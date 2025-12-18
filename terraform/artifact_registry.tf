# Artifact Registry for Docker images
resource "google_artifact_registry_repository" "trainsmart" {
  location      = var.region
  repository_id = "trainsmart"
  description   = "TrainSmart Docker images"
  format        = "DOCKER"

  depends_on = [google_project_service.apis]
}

# Output the registry URL for docker push commands
output "artifact_registry_url" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.trainsmart.repository_id}"
}
