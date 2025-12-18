# TrainSmart GCP Deployment Guide

## Overview

This guide walks through deploying TrainSmart to Google Cloud Platform using:
- **Cloud Run** for backend (FastAPI) and frontend (Next.js)
- **Cloud SQL** for PostgreSQL database
- **Artifact Registry** for Docker images
- **Secret Manager** for secure environment variables

### Estimated Monthly Cost (Low Traffic)
| Service | Cost |
|---------|------|
| Cloud Run | ~$0-10 (free tier: 2M requests/month) |
| Cloud SQL | ~$10-30 (smallest instance) |
| **Total** | **~$15-40/month** |

---

## Phase 1: GCP Account & CLI Setup

### 1.1 Create GCP Account

1. Go to https://cloud.google.com
2. Click **"Get started for free"**
   - You get **$300 free credits** for 90 days
3. Sign in with your Google account
4. Add billing info (credit card required, won't charge beyond free tier)

### 1.2 Create a Project

1. Go to https://console.cloud.google.com
2. Click the project dropdown (top-left) → **"New Project"**
3. Configure:
   - **Project name:** `trainsmart`
   - **Project ID:** Note this down (e.g., `trainsmart-12345`)
4. Click **Create**

### 1.3 Install gcloud CLI

**macOS (Homebrew):**
```bash
brew install google-cloud-sdk
```

**macOS/Linux (Manual):**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL  # Restart shell
```

**Windows:**
Download installer from: https://cloud.google.com/sdk/docs/install

**Verify installation:**
```bash
gcloud --version
```

### 1.4 Initialize gcloud

```bash
gcloud init
```

Follow the prompts to:
1. Log in to your Google account (browser will open)
2. Select your `trainsmart` project
3. Optionally set a default region (recommended: `us-central1`)

### 1.5 Set Project ID

```bash
# Set your project (replace with your actual project ID)
export PROJECT_ID="trainsmart-12345"
gcloud config set project $PROJECT_ID
```

---

## Phase 2: Enable GCP APIs

Run these commands to enable required services:

```bash
# Enable all required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com
```

---

## Phase 3: Create Artifact Registry

Create a Docker repository to store container images:

```bash
# Create Artifact Registry repository
gcloud artifacts repositories create trainsmart \
  --repository-format=docker \
  --location=us-central1 \
  --description="TrainSmart Docker images"

# Configure Docker to use gcloud credentials
gcloud auth configure-docker us-central1-docker.pkg.dev
```

---

## Phase 4: Create Cloud SQL Database

### 4.1 Create PostgreSQL Instance

```bash
# Create Cloud SQL instance (this takes 5-10 minutes)
gcloud sql instances create trainsmart-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_SECURE_PASSWORD \
  --storage-type=SSD \
  --storage-size=10GB
```

> ⚠️ **Replace `YOUR_SECURE_PASSWORD` with a strong password!**

### 4.2 Create Database and User

```bash
# Create the database
gcloud sql databases create trainsmart --instance=trainsmart-db

# Create application user
gcloud sql users create trainsmart_user \
  --instance=trainsmart-db \
  --password=YOUR_APP_PASSWORD
```

### 4.3 Get Connection Name

```bash
# Note this for later - format: PROJECT_ID:REGION:INSTANCE_NAME
gcloud sql instances describe trainsmart-db --format="value(connectionName)"
```

---

## Phase 5: Create Secrets

Store sensitive configuration in Secret Manager:

```bash
# Create secrets (replace values with your own)
echo -n "your-super-secret-jwt-key-min-32-chars" | \
  gcloud secrets create jwt-secret --data-file=-

echo -n "YOUR_APP_PASSWORD" | \
  gcloud secrets create db-password --data-file=-

# Optional: Resend API key for emails
# echo -n "re_xxxxx" | gcloud secrets create resend-api-key --data-file=-
```

---

## Phase 6: Build and Push Docker Images

### 6.1 Build Backend Image

```bash
cd /path/to/trainsmart

# Build and push backend
gcloud builds submit ./backend \
  --tag us-central1-docker.pkg.dev/$PROJECT_ID/trainsmart/backend:latest
```

### 6.2 Build Frontend Image

```bash
# Build and push frontend
gcloud builds submit ./frontend \
  --tag us-central1-docker.pkg.dev/$PROJECT_ID/trainsmart/frontend:latest
```

---

## Phase 7: Deploy Backend to Cloud Run

### 7.1 Get Cloud SQL Connection Name

```bash
CONNECTION_NAME=$(gcloud sql instances describe trainsmart-db --format="value(connectionName)")
echo $CONNECTION_NAME
```

### 7.2 Deploy Backend Service

```bash
gcloud run deploy trainsmart-backend \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/trainsmart/backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances $CONNECTION_NAME \
  --set-env-vars "ENVIRONMENT=production" \
  --set-env-vars "DATABASE_URL=postgresql+asyncpg://trainsmart_user:YOUR_APP_PASSWORD@/trainsmart?host=/cloudsql/$CONNECTION_NAME" \
  --set-secrets "SECRET_KEY=jwt-secret:latest" \
  --min-instances 0 \
  --max-instances 10 \
  --memory 512Mi \
  --cpu 1
```

### 7.3 Note the Backend URL

After deployment, note the URL (e.g., `https://trainsmart-backend-xxxxx-uc.a.run.app`)

### 7.4 Update CORS Origins

```bash
# Get the backend URL
BACKEND_URL=$(gcloud run services describe trainsmart-backend --region=us-central1 --format="value(status.url)")

# Update with CORS (will also need frontend URL after it's deployed)
# We'll update this after frontend deployment
```

---

## Phase 8: Run Database Migrations

### 8.1 Create a Migration Job

```bash
# Run migrations using Cloud Run Jobs
gcloud run jobs create run-migrations \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/trainsmart/backend:latest \
  --region us-central1 \
  --add-cloudsql-instances $CONNECTION_NAME \
  --set-env-vars "DATABASE_URL=postgresql+asyncpg://trainsmart_user:YOUR_APP_PASSWORD@/trainsmart?host=/cloudsql/$CONNECTION_NAME" \
  --command "alembic" \
  --args "upgrade,head"

# Execute the migration job
gcloud run jobs execute run-migrations --region us-central1 --wait
```

---

## Phase 9: Deploy Frontend to Cloud Run

### 9.1 Deploy Frontend Service

```bash
# Get backend URL
BACKEND_URL=$(gcloud run services describe trainsmart-backend --region=us-central1 --format="value(status.url)")

gcloud run deploy trainsmart-frontend \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/trainsmart/frontend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NEXT_PUBLIC_API_URL=$BACKEND_URL" \
  --min-instances 0 \
  --max-instances 10 \
  --memory 512Mi \
  --cpu 1
```

### 9.2 Note the Frontend URL

After deployment, note the URL (e.g., `https://trainsmart-frontend-xxxxx-uc.a.run.app`)

---

## Phase 10: Update CORS Configuration

Update the backend to allow requests from the frontend:

```bash
# Get frontend URL
FRONTEND_URL=$(gcloud run services describe trainsmart-frontend --region=us-central1 --format="value(status.url)")

# Update backend with correct CORS
gcloud run services update trainsmart-backend \
  --region us-central1 \
  --set-env-vars "CORS_ORIGINS=$FRONTEND_URL"
```

---

## Deployment Complete! 🎉

### Your URLs

| Service | URL |
|---------|-----|
| Frontend | `https://trainsmart-frontend-xxxxx-uc.a.run.app` |
| Backend API | `https://trainsmart-backend-xxxxx-uc.a.run.app` |

### Verify Deployment

```bash
# Check backend health
curl $(gcloud run services describe trainsmart-backend --region=us-central1 --format="value(status.url)")/api/v1/health

# Open frontend in browser
open $(gcloud run services describe trainsmart-frontend --region=us-central1 --format="value(status.url)")
```

---

## Useful Commands

### View Logs

```bash
# Backend logs
gcloud run services logs read trainsmart-backend --region=us-central1

# Frontend logs
gcloud run services logs read trainsmart-frontend --region=us-central1
```

### Redeploy After Code Changes

```bash
# Rebuild and redeploy backend
gcloud builds submit ./backend \
  --tag us-central1-docker.pkg.dev/$PROJECT_ID/trainsmart/backend:latest
gcloud run deploy trainsmart-backend \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/trainsmart/backend:latest \
  --region us-central1

# Rebuild and redeploy frontend
gcloud builds submit ./frontend \
  --tag us-central1-docker.pkg.dev/$PROJECT_ID/trainsmart/frontend:latest
gcloud run deploy trainsmart-frontend \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/trainsmart/frontend:latest \
  --region us-central1
```

### Connect to Database (for debugging)

```bash
# Install Cloud SQL Proxy
gcloud components install cloud-sql-proxy

# Start proxy
cloud-sql-proxy $CONNECTION_NAME &

# Connect with psql
psql "host=127.0.0.1 dbname=trainsmart user=trainsmart_user"
```

### Delete Everything (cleanup)

```bash
# Delete Cloud Run services
gcloud run services delete trainsmart-backend --region=us-central1 --quiet
gcloud run services delete trainsmart-frontend --region=us-central1 --quiet

# Delete Cloud SQL instance
gcloud sql instances delete trainsmart-db --quiet

# Delete Artifact Registry images
gcloud artifacts repositories delete trainsmart --location=us-central1 --quiet

# Delete secrets
gcloud secrets delete jwt-secret --quiet
gcloud secrets delete db-password --quiet
```

---

## Troubleshooting

### "Permission denied" errors
```bash
# Ensure you're authenticated
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### Database connection errors
- Verify Cloud SQL instance is running
- Check the connection name is correct
- Ensure the Cloud Run service has the Cloud SQL client role

### Frontend can't reach backend
- Check CORS_ORIGINS includes the frontend URL
- Verify NEXT_PUBLIC_API_URL is set correctly
- Check backend logs for errors

### Container build fails
- Check Dockerfile syntax
- Ensure all required files are present
- Review Cloud Build logs: `gcloud builds list`

---

## Phase 1 Checklist

Complete these before running deployment commands:

- [ ] GCP account created at https://cloud.google.com
- [ ] Billing enabled (free tier available)
- [ ] Project created (note the Project ID)
- [ ] gcloud CLI installed (`brew install google-cloud-sdk`)
- [ ] gcloud initialized (`gcloud init`)
- [ ] Project ID exported (`export PROJECT_ID="your-project-id"`)

Once complete, proceed to Phase 2!
