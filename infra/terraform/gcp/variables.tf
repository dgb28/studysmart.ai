variable "project_name" {
  description = "Project name prefix for all resources"
  type        = string
  default     = "hackathon"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "development"
}

variable "gcp_project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "gcp_region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "gcp_zone" {
  description = "GCP zone"
  type        = string
  default     = "us-central1-a"
}

variable "gke_machine_type" {
  description = "GKE node machine type"
  type        = string
  default     = "e2-standard-2"
}

variable "cloudsql_tier" {
  description = "Cloud SQL instance tier"
  type        = string
  default     = "db-f1-micro"
}

variable "agents_image" {
  description = "Docker image for the agents Cloud Run service"
  type        = string
  default     = "gcr.io/PROJECT_ID/hackathon-agents:latest"
}
