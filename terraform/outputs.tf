output "backend_url" {
  description = "URL of the backend Cloud Run service"
  value       = google_cloud_run_v2_service.backend.uri
}

output "frontend_url" {
  description = "URL of the frontend Cloud Run service"
  value       = google_cloud_run_v2_service.frontend.uri
}

output "project_id" {
  description = "GCP Project ID"
  value       = var.project_id
}

output "region" {
  description = "GCP Region"
  value       = var.region
}

output "migration_job_name" {
  description = "Name of the Cloud Run job for migrations"
  value       = google_cloud_run_v2_job.migrations.name
}

output "docker_push_commands" {
  description = "Commands to build and push Docker images"
  value       = <<-EOT
    # Configure Docker for Artifact Registry
    gcloud auth configure-docker ${var.region}-docker.pkg.dev

    # Build and push backend
    gcloud builds submit ./backend \
      --tag ${var.region}-docker.pkg.dev/${var.project_id}/trainsmart/backend:latest

    # Build and push frontend
    gcloud builds submit ./frontend \
      --tag ${var.region}-docker.pkg.dev/${var.project_id}/trainsmart/frontend:latest
  EOT
}

output "run_migrations_command" {
  description = "Command to run database migrations"
  value       = "gcloud run jobs execute ${google_cloud_run_v2_job.migrations.name} --region ${var.region} --wait"
}

output "update_cors_command" {
  description = "Command to update CORS after deployment"
  value       = <<-EOT
    gcloud run services update trainsmart-backend \
      --region ${var.region} \
      --set-env-vars "CORS_ORIGINS=${google_cloud_run_v2_service.frontend.uri}"
  EOT
}
