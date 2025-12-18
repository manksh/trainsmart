# Cloud SQL PostgreSQL Instance
resource "google_sql_database_instance" "trainsmart" {
  name             = "trainsmart-db"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier              = var.db_tier
    availability_type = "ZONAL"
    disk_type         = "PD_SSD"
    disk_size         = 10

    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      point_in_time_recovery_enabled = false
    }

    ip_configuration {
      ipv4_enabled = true
      # For Cloud Run, we use Cloud SQL Auth Proxy via Unix socket
      # No authorized networks needed
    }

    database_flags {
      name  = "max_connections"
      value = "100"
    }
  }

  deletion_protection = false # Set to true for production

  depends_on = [google_project_service.apis]
}

# Database
resource "google_sql_database" "trainsmart" {
  name     = "trainsmart"
  instance = google_sql_database_instance.trainsmart.name
}

# Database user
resource "google_sql_user" "trainsmart" {
  name     = "trainsmart_user"
  instance = google_sql_database_instance.trainsmart.name
  password = var.db_password
}

# Output connection name for Cloud Run
output "db_connection_name" {
  value = google_sql_database_instance.trainsmart.connection_name
}
