# Shared Infrastructure — AWS ↔ GCP Cross-Cloud VPN
# IPSec VPN tunnel connecting AWS VPC and GCP VPC

terraform {
  required_version = ">= 1.7"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# ───────────────────────────────────────────────────────────────────────────────
# AWS Side: Customer Gateway + VPN Gateway + VPN Connection
# ───────────────────────────────────────────────────────────────────────────────

# GCP external IP (will be set after GCP VPN gateway is created)
data "terraform_remote_state" "gcp" {
  backend = "local"
  config = {
    path = "../gcp/terraform.tfstate"
  }
}

resource "aws_vpn_gateway" "main" {
  vpc_id = var.aws_vpc_id
  tags = {
    Name    = "${var.project_name}-vpn-gateway"
    Project = var.project_name
  }
}

# GCP external IP for customer gateway
resource "aws_customer_gateway" "gcp" {
  bgp_asn    = 65000
  ip_address = google_compute_ha_vpn_gateway.main.vpn_interfaces[0].ip_address
  type       = "ipsec.1"

  tags = {
    Name    = "${var.project_name}-cgw-gcp"
    Project = var.project_name
  }
}

resource "aws_vpn_connection" "to_gcp" {
  vpn_gateway_id      = aws_vpn_gateway.main.id
  customer_gateway_id = aws_customer_gateway.gcp.id
  type                = "ipsec.1"
  static_routes_only  = true

  tags = {
    Name    = "${var.project_name}-vpn-to-gcp"
    Project = var.project_name
  }
}

resource "aws_vpn_connection_route" "gcp_subnet" {
  vpn_connection_id      = aws_vpn_connection.to_gcp.id
  destination_cidr_block = "10.1.0.0/16"   # GCP subnet CIDR
}

# ───────────────────────────────────────────────────────────────────────────────
# GCP Side: HA VPN Gateway + VPN Tunnel
# ───────────────────────────────────────────────────────────────────────────────

resource "google_compute_ha_vpn_gateway" "main" {
  name    = "${var.project_name}-ha-vpn"
  network = var.gcp_network_id
  region  = var.gcp_region
}

resource "google_compute_router" "vpn_router" {
  name    = "${var.project_name}-vpn-router"
  network = var.gcp_network_id
  region  = var.gcp_region

  bgp {
    asn = 65001
  }
}

resource "google_compute_vpn_tunnel" "to_aws_tunnel1" {
  name          = "${var.project_name}-tunnel-aws-1"
  region        = var.gcp_region
  vpn_gateway   = google_compute_ha_vpn_gateway.main.id

  peer_ip                 = aws_vpn_connection.to_gcp.tunnel1_address
  shared_secret           = aws_vpn_connection.to_gcp.tunnel1_preshared_key
  peer_external_gateway   = null
  vpn_gateway_interface   = 0

  router = google_compute_router.vpn_router.id

  ike_version = 2
}

resource "google_compute_router_interface" "vpn_if1" {
  name       = "${var.project_name}-vpn-if1"
  router     = google_compute_router.vpn_router.name
  region     = var.gcp_region
  vpn_tunnel = google_compute_vpn_tunnel.to_aws_tunnel1.name
  ip_range   = "169.254.0.1/30"
}

# Firewall — allow traffic from AWS CIDR into GCP
resource "google_compute_firewall" "allow_aws" {
  name    = "${var.project_name}-allow-aws-traffic"
  network = var.gcp_network_id

  allow {
    protocol = "tcp"
    ports    = ["8000", "8001", "5432", "6379"]
  }

  source_ranges = ["10.0.0.0/16"]   # AWS VPC CIDR
}
