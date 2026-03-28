# GCP Terraform — Main Configuration
# GKE, Cloud SQL, GCS, Cloud Run, Secret Manager

terraform {
  required_version = ">= 1.7"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  # Uncomment to use remote state (recommended)
  # backend "gcs" {
  #   bucket = "hackathon-tf-state"
  #   prefix = "gcp/terraform.tfstate"
  # }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
  zone    = var.gcp_zone
}

# ── VPC ───────────────────────────────────────────────────────────────────────
resource "google_compute_network" "main" {
  name                    = "${var.project_name}-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "main" {
  name          = "${var.project_name}-subnet"
  ip_cidr_range = "10.1.0.0/16"
  network       = google_compute_network.main.id
  region        = var.gcp_region

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.2.0.0/16"
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.3.0.0/16"
  }
}

# ── GKE Cluster ───────────────────────────────────────────────────────────────
resource "google_container_cluster" "main" {
  name     = "${var.project_name}-gke"
  location = var.gcp_region

  network    = google_compute_network.main.name
  subnetwork = google_compute_subnetwork.main.name

  # Use a separate node pool
  remove_default_node_pool = true
  initial_node_count       = 1

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  # Workload Identity
  workload_identity_config {
    workload_pool = "${var.gcp_project_id}.svc.id.goog"
  }

  # Kubernetes version
  min_master_version = "1.31"

  addons_config {
    horizontal_pod_autoscaling { disabled = false }
    http_load_balancing        { disabled = false }
    gce_persistent_disk_csi_driver_config { enabled = true }
  }
}

resource "google_container_node_pool" "main" {
  name     = "${var.project_name}-node-pool"
  cluster  = google_container_cluster.main.name
  location = var.gcp_region

  autoscaling {
    min_node_count = 1
    max_node_count = 10
  }

  node_config {
    machine_type = var.gke_machine_type
    disk_size_gb = 50
    disk_type    = "pd-ssd"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    labels = {
      role = "app"
    }
  }
}

# ── Cloud SQL (PostgreSQL) ────────────────────────────────────────────────────
resource "google_sql_database_instance" "postgres" {
  name             = "${var.project_name}-sql"
  database_version = "POSTGRES_16"
  region           = var.gcp_region

  settings {
    tier = var.cloudsql_tier

    backup_configuration {
      enabled    = true
      start_time = "02:00"
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.main.id
    }

    insights_config {
      query_insights_enabled = true
    }
  }

  deletion_protection = var.environment == "production"
}

resource "google_sql_database" "main" {
  name     = "hackathon"
  instance = google_sql_database_instance.postgres.name
}

# ── GCS Bucket ────────────────────────────────────────────────────────────────
resource "google_storage_bucket" "uploads" {
  name          = "${var.project_name}-uploads-${var.environment}"
  location      = var.gcp_region
  force_destroy = var.environment != "production"

  versioning { enabled = true }

  uniform_bucket_level_access = true

  lifecycle_rule {
    condition { age = 90 }
    action    { type = "Delete" }
  }
}

# ── Secret Manager ────────────────────────────────────────────────────────────
resource "google_secret_manager_secret" "app_secrets" {
  secret_id = "${var.project_name}-app-secrets"
  replication { auto {} }
}

# ── Cloud Run (serverless agents) ─────────────────────────────────────────────
resource "google_cloud_run_v2_service" "agents" {
  name     = "${var.project_name}-agents"
  location = var.gcp_region

  template {
    containers {
      image = var.agents_image

      env {
        name  = "REDIS_URL"
        value = "redis://redis:6379/0"
      }

      resources {
        limits = {
          cpu    = "2"
          memory = "2Gi"
        }
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 20
    }
  }
}

# ── Locals ─────────────────────────────────────────────────────────────────────
locals {
  common_labels = {
    project     = var.project_name
    environment = var.environment
    managed_by  = "terraform"
    cloud       = "gcp"
  }
}
