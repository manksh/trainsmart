variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region for resources"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment name (e.g., production, staging)"
  type        = string
  default     = "production"
}

# Database variables
variable "db_tier" {
  description = "Cloud SQL instance tier"
  type        = string
  default     = "db-f1-micro"
}

variable "db_password" {
  description = "Password for the database user"
  type        = string
  sensitive   = true
}

# Application secrets
variable "jwt_secret" {
  description = "JWT secret key (min 32 characters)"
  type        = string
  sensitive   = true
}

# Optional: Email service
variable "resend_api_key" {
  description = "Resend API key for emails (optional)"
  type        = string
  default     = ""
  sensitive   = true
}

# Cloud Run configuration
variable "backend_memory" {
  description = "Memory allocation for backend service"
  type        = string
  default     = "512Mi"
}

variable "frontend_memory" {
  description = "Memory allocation for frontend service"
  type        = string
  default     = "512Mi"
}

variable "max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = number
  default     = 10
}
