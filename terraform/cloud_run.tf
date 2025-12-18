# Cloud Run Backend Service
resource "google_cloud_run_v2_service" "backend" {
  name     = "trainsmart-backend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    scaling {
      min_instance_count = 0
      max_instance_count = var.max_instances
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.trainsmart.connection_name]
      }
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/trainsmart/backend:latest"

      resources {
        limits = {
          memory = var.backend_memory
          cpu    = "1"
        }
      }

      env {
        name  = "ENVIRONMENT"
        value = var.environment
      }

      env {
        name  = "DATABASE_URL"
        value = "postgresql+asyncpg://trainsmart_user:${var.db_password}@/trainsmart?host=/cloudsql/${google_sql_database_instance.trainsmart.connection_name}"
      }

      env {
        name = "SECRET_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.jwt_secret.secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "CORS_ORIGINS"
        value = "" # Will be updated after frontend is deployed
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
    }

    service_account = "${data.google_project.project.number}-compute@developer.gserviceaccount.com"
  }

  depends_on = [
    google_project_service.apis,
    google_artifact_registry_repository.trainsmart,
    google_sql_database_instance.trainsmart,
    google_secret_manager_secret_version.jwt_secret,
  ]
}

# Allow unauthenticated access to backend
resource "google_cloud_run_v2_service_iam_member" "backend_public" {
  location = google_cloud_run_v2_service.backend.location
  name     = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Cloud Run Frontend Service
resource "google_cloud_run_v2_service" "frontend" {
  name     = "trainsmart-frontend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    scaling {
      min_instance_count = 0
      max_instance_count = var.max_instances
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/trainsmart/frontend:latest"

      resources {
        limits = {
          memory = var.frontend_memory
          cpu    = "1"
        }
      }

      env {
        name  = "NEXT_PUBLIC_API_URL"
        value = google_cloud_run_v2_service.backend.uri
      }
    }
  }

  depends_on = [
    google_project_service.apis,
    google_artifact_registry_repository.trainsmart,
    google_cloud_run_v2_service.backend,
  ]
}

# Allow unauthenticated access to frontend
resource "google_cloud_run_v2_service_iam_member" "frontend_public" {
  location = google_cloud_run_v2_service.frontend.location
  name     = google_cloud_run_v2_service.frontend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Cloud Run Job for database migrations
resource "google_cloud_run_v2_job" "migrations" {
  name     = "trainsmart-migrations"
  location = var.region

  template {
    template {
      volumes {
        name = "cloudsql"
        cloud_sql_instance {
          instances = [google_sql_database_instance.trainsmart.connection_name]
        }
      }

      containers {
        image   = "${var.region}-docker.pkg.dev/${var.project_id}/trainsmart/backend:latest"
        command = ["alembic"]
        args    = ["upgrade", "head"]

        env {
          name  = "DATABASE_URL"
          value = "postgresql+asyncpg://trainsmart_user:${var.db_password}@/trainsmart?host=/cloudsql/${google_sql_database_instance.trainsmart.connection_name}"
        }

        volume_mounts {
          name       = "cloudsql"
          mount_path = "/cloudsql"
        }
      }

      service_account = "${data.google_project.project.number}-compute@developer.gserviceaccount.com"
    }
  }

  depends_on = [
    google_sql_database.trainsmart,
    google_sql_user.trainsmart,
  ]
}
