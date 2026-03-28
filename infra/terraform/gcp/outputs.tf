output "gke_cluster_name" {
  value = google_container_cluster.main.name
}

output "gke_cluster_endpoint" {
  value     = google_container_cluster.main.endpoint
  sensitive = true
}

output "cloud_sql_instance" {
  value     = google_sql_database_instance.postgres.connection_name
  sensitive = true
}

output "gcs_bucket_name" {
  value = google_storage_bucket.uploads.name
}

output "cloud_run_agents_url" {
  value = google_cloud_run_v2_service.agents.uri
}

output "vpc_id" {
  value = google_compute_network.main.id
}
