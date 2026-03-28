variable "project_name" { type = string; default = "hackathon" }
variable "aws_region"   { type = string; default = "us-east-1" }
variable "gcp_region"   { type = string; default = "us-central1" }
variable "gcp_project_id" { type = string }
variable "aws_vpc_id"   { type = string; description = "AWS VPC ID from AWS terraform output" }
variable "gcp_network_id" { type = string; description = "GCP network ID from GCP terraform output" }
