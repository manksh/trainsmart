# TrainSmart Multi-Environment Infrastructure Plan

## Executive Summary

This document outlines the plan to establish a proper two-environment infrastructure (TEST and PROD) for TrainSmart on GCP, with automated deployments to TEST and controlled promotions to PROD.

**Current State:**
- Single environment deployed via GitHub Actions on push to main
- Cloud Run services: `trainsmart-frontend`, `trainsmart-backend`
- Cloud SQL: `trainsmart-db` (PostgreSQL 15)
- Project: `trainsmart-481620`
- Region: `us-central1`

**Target State:**
- TEST environment: Automatic deployment on push to main
- PROD environment: Manual approval required, custom domains:
  - `ctlstlabs.com` (primary)
  - `ctlstlabs.ca` (Canadian market)
  - `ctlstlab.com` (typo protection)

**Domain Registrar:** Squarespace (all 3 domains)

---

## 1. GCP Infrastructure Setup

### 1.1 Cloud Run Service Naming Convention

| Environment | Frontend Service | Backend Service |
|-------------|------------------|-----------------|
| TEST | `trainsmart-frontend-test` | `trainsmart-backend-test` |
| PROD | `trainsmart-frontend-prod` | `trainsmart-backend-prod` |

**Migration Note:** The current services (`trainsmart-frontend`, `trainsmart-backend`) will be renamed to the `-test` suffix or kept as-is and used for TEST.

**Recommendation:** Keep existing services as TEST (avoid migration complexity):
- `trainsmart-frontend` -> remains as TEST
- `trainsmart-backend` -> remains as TEST
- Create NEW services for PROD with `-prod` suffix

### 1.2 Cloud SQL Database Strategy

**Option A: Single Instance, Separate Databases (Recommended)**
```
Cloud SQL Instance: trainsmart-db
  |-- Database: trainsmart        (TEST)
  |-- Database: trainsmart_prod   (PROD)
```

**Pros:**
- Lower cost (single instance ~$10-30/month vs ~$20-60 for two)
- Simpler management
- Shared compute resources

**Cons:**
- Shared resources could impact PROD during heavy TEST usage
- Single point of failure for infrastructure

**Option B: Separate Instances**
```
Cloud SQL Instance: trainsmart-db       (TEST)
  |-- Database: trainsmart

Cloud SQL Instance: trainsmart-db-prod  (PROD)
  |-- Database: trainsmart
```

**Pros:**
- Complete isolation
- Independent scaling
- No risk of TEST impacting PROD

**Cons:**
- Higher cost (~2x database cost)
- More infrastructure to manage

**Recommendation:** Start with Option A (single instance, separate databases) for cost efficiency. Migrate to Option B if performance isolation becomes critical.

### 1.3 Environment Variable Management

#### TEST Environment Variables

| Variable | Source | Value |
|----------|--------|-------|
| `ENVIRONMENT` | Direct | `test` |
| `DATABASE_URL` | Direct | `postgresql+asyncpg://trainsmart_user:{password}@/trainsmart?host=/cloudsql/{connection}` |
| `SECRET_KEY` | Secret Manager | `jwt-secret-test:latest` |
| `CORS_ORIGINS` | Direct | `https://trainsmart-frontend-{hash}-uc.a.run.app` |
| `NEXT_PUBLIC_API_URL` | Build Arg | `https://trainsmart-backend-{hash}-uc.a.run.app` |

#### PROD Environment Variables

| Variable | Source | Value |
|----------|--------|-------|
| `ENVIRONMENT` | Direct | `production` |
| `DATABASE_URL` | Direct | `postgresql+asyncpg://trainsmart_prod_user:{password}@/trainsmart_prod?host=/cloudsql/{connection}` |
| `SECRET_KEY` | Secret Manager | `jwt-secret-prod:latest` |
| `CORS_ORIGINS` | Direct | `https://ctlstlabs.com,https://www.ctlstlabs.com,https://ctlstlabs.ca,https://www.ctlstlabs.ca,https://ctlstlab.com,https://www.ctlstlab.com` |
| `NEXT_PUBLIC_API_URL` | Build Arg | `https://api.ctlstlabs.com` |

### 1.4 GCP Commands to Create PROD Infrastructure

```bash
# Set variables
export PROJECT_ID="trainsmart-481620"
export REGION="us-central1"
export CONNECTION_NAME=$(gcloud sql instances describe trainsmart-db --format="value(connectionName)")

# 1. Create PROD database in existing instance
gcloud sql databases create trainsmart_prod --instance=trainsmart-db

# 2. Create PROD database user
gcloud sql users create trainsmart_prod_user \
  --instance=trainsmart-db \
  --password=YOUR_SECURE_PROD_PASSWORD

# 3. Create PROD secrets
echo -n "your-prod-jwt-secret-min-32-chars-different-from-test" | \
  gcloud secrets create jwt-secret-prod --data-file=-

echo -n "YOUR_SECURE_PROD_PASSWORD" | \
  gcloud secrets create db-password-prod --data-file=-

# 4. Create PROD migration job
gcloud run jobs create trainsmart-migrations-prod \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/trainsmart/backend:latest \
  --region $REGION \
  --add-cloudsql-instances $CONNECTION_NAME \
  --set-env-vars "DATABASE_URL=postgresql+asyncpg://trainsmart_prod_user:PASSWORD@/trainsmart_prod?host=/cloudsql/$CONNECTION_NAME" \
  --command "alembic" \
  --args "upgrade,head"
```

---

## 2. Domain and SSL Configuration (Squarespace)

### 2.1 Domain Strategy Overview

**All 3 domains are registered on Squarespace:**

| Domain | Purpose | Target |
|--------|---------|--------|
| `ctlstlabs.com` | Primary domain | Frontend PROD |
| `api.ctlstlabs.com` | API subdomain | Backend PROD |
| `www.ctlstlabs.com` | www redirect | Frontend PROD |
| `ctlstlabs.ca` | Canadian market | Frontend PROD (same content) |
| `api.ctlstlabs.ca` | Canadian API | Backend PROD (same content) |
| `ctlstlab.com` | Typo protection | Redirect to `ctlstlabs.com` |

**Architecture Diagram:**
```
                    +------------------+
                    |   Squarespace    |
                    |   DNS Records    |
                    +------------------+
                           |
         +-----------------+-----------------+
         |                 |                 |
         v                 v                 v
   ctlstlabs.com     ctlstlabs.ca     ctlstlab.com
   (Primary)         (Canadian)       (Typo Redirect)
         |                 |                 |
         v                 v                 |
   +-------------+   +-------------+         |
   | Cloud Run   |   | Cloud Run   |         |
   | Frontend    |<--| Frontend    |         |
   | PROD        |   | PROD        |         |
   +-------------+   +-------------+         |
                                             |
                                             v
                                    Redirect to ctlstlabs.com
                                    (via Squarespace URL Redirect)
```

### 2.2 Squarespace DNS Configuration

#### How to Access Squarespace DNS Settings

1. Log in to your Squarespace account at https://account.squarespace.com
2. Click on **Domains** in the left sidebar
3. Select the domain you want to configure (e.g., `ctlstlabs.com`)
4. Click **DNS Settings** or **Advanced Settings**
5. You will see the DNS Records panel

**Important Squarespace Notes:**
- Squarespace uses a simplified DNS interface
- Some record types may need to be added via "Custom Records"
- Changes typically propagate within 15-60 minutes (can take up to 48 hours)
- Squarespace does NOT support AAAA (IPv6) records in their standard interface

---

### 2.3 Primary Domain: ctlstlabs.com

#### Step 1: Create Cloud Run Domain Mappings (GCP)

Run these commands in your terminal:

```bash
# Set variables
export PROJECT_ID="trainsmart-481620"
export REGION="us-central1"

# Map ctlstlabs.com to frontend
gcloud run domain-mappings create \
  --service trainsmart-frontend-prod \
  --domain ctlstlabs.com \
  --region $REGION

# Map api.ctlstlabs.com to backend
gcloud run domain-mappings create \
  --service trainsmart-backend-prod \
  --domain api.ctlstlabs.com \
  --region $REGION

# Map www.ctlstlabs.com to frontend (serves same content)
gcloud run domain-mappings create \
  --service trainsmart-frontend-prod \
  --domain www.ctlstlabs.com \
  --region $REGION
```

#### Step 2: Get DNS Records from GCP

After creating the domain mappings, get the required DNS records:

```bash
# Get DNS records for ctlstlabs.com
gcloud run domain-mappings describe \
  --domain ctlstlabs.com \
  --region us-central1 \
  --format="yaml(resourceRecords)"
```

This will output something like:
```
resourceRecords:
- name: ctlstlabs.com.
  rrdata: 216.239.32.21
  type: A
- name: ctlstlabs.com.
  rrdata: 216.239.34.21
  type: A
...
```

#### Step 3: Configure DNS in Squarespace for ctlstlabs.com

In Squarespace DNS Settings for `ctlstlabs.com`, add these records:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | `216.239.32.21` | 3600 |
| A | @ | `216.239.34.21` | 3600 |
| A | @ | `216.239.36.21` | 3600 |
| A | @ | `216.239.38.21` | 3600 |
| CNAME | www | `ghs.googlehosted.com.` | 3600 |
| CNAME | api | `ghs.googlehosted.com.` | 3600 |

**Squarespace-Specific Instructions:**

1. **Delete existing records** (if any) that conflict:
   - Remove any existing A records for @ (root)
   - Remove any existing CNAME records for www or api

2. **Add A records** (you may need to add 4 separate A records):
   - Click "Add Record" or "Custom Record"
   - Type: A
   - Host: Leave blank or use `@`
   - Points to: `216.239.32.21`
   - Repeat for the other 3 IP addresses

3. **Add CNAME records**:
   - Click "Add Record"
   - Type: CNAME
   - Host: `www`
   - Points to: `ghs.googlehosted.com.`
   - Repeat for `api` subdomain

**Screenshot Guide (Squarespace DNS Panel):**
```
+----------------------------------------------------------+
| DNS SETTINGS - ctlstlabs.com                              |
+----------------------------------------------------------+
| CUSTOM RECORDS                                            |
| +------------------------------------------------------+ |
| | Type: A      Host: @     Points to: 216.239.32.21   | |
| +------------------------------------------------------+ |
| | Type: A      Host: @     Points to: 216.239.34.21   | |
| +------------------------------------------------------+ |
| | Type: A      Host: @     Points to: 216.239.36.21   | |
| +------------------------------------------------------+ |
| | Type: A      Host: @     Points to: 216.239.38.21   | |
| +------------------------------------------------------+ |
| | Type: CNAME  Host: www   Points to: ghs.googlehosted.com. | |
| +------------------------------------------------------+ |
| | Type: CNAME  Host: api   Points to: ghs.googlehosted.com. | |
| +------------------------------------------------------+ |
+----------------------------------------------------------+
```

---

### 2.4 Canadian Domain: ctlstlabs.ca

#### Step 1: Create Cloud Run Domain Mappings (GCP)

```bash
# Map ctlstlabs.ca to frontend (same service as primary)
gcloud run domain-mappings create \
  --service trainsmart-frontend-prod \
  --domain ctlstlabs.ca \
  --region us-central1

# Map api.ctlstlabs.ca to backend
gcloud run domain-mappings create \
  --service trainsmart-backend-prod \
  --domain api.ctlstlabs.ca \
  --region us-central1

# Map www.ctlstlabs.ca to frontend
gcloud run domain-mappings create \
  --service trainsmart-frontend-prod \
  --domain www.ctlstlabs.ca \
  --region us-central1
```

#### Step 2: Configure DNS in Squarespace for ctlstlabs.ca

In Squarespace DNS Settings for `ctlstlabs.ca`, add these records:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | `216.239.32.21` | 3600 |
| A | @ | `216.239.34.21` | 3600 |
| A | @ | `216.239.36.21` | 3600 |
| A | @ | `216.239.38.21` | 3600 |
| CNAME | www | `ghs.googlehosted.com.` | 3600 |
| CNAME | api | `ghs.googlehosted.com.` | 3600 |

**Note:** These are the same records as ctlstlabs.com because they point to the same Cloud Run services.

---

### 2.5 Typo Domain: ctlstlab.com (Redirect)

For the typo domain `ctlstlab.com`, you have two options:

#### Option A: Squarespace URL Redirect (Recommended - Simpler)

Squarespace offers built-in URL forwarding which is the easiest approach:

1. Go to Squarespace Domains > `ctlstlab.com`
2. Look for **"URL Forwarding"** or **"Redirect"** option
3. Configure:
   - **Source:** `ctlstlab.com` (and `www.ctlstlab.com`)
   - **Destination:** `https://ctlstlabs.com`
   - **Redirect Type:** Permanent (301)

This handles both root and www without needing Cloud Run.

#### Option B: Cloud Run Domain Mapping (Alternative)

If Squarespace URL forwarding doesn't work well, map to the same frontend:

```bash
# Map typo domain to frontend
gcloud run domain-mappings create \
  --service trainsmart-frontend-prod \
  --domain ctlstlab.com \
  --region us-central1

gcloud run domain-mappings create \
  --service trainsmart-frontend-prod \
  --domain www.ctlstlab.com \
  --region us-central1
```

Then add DNS records in Squarespace for `ctlstlab.com`:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | `216.239.32.21` | 3600 |
| A | @ | `216.239.34.21` | 3600 |
| A | @ | `216.239.36.21` | 3600 |
| A | @ | `216.239.38.21` | 3600 |
| CNAME | www | `ghs.googlehosted.com.` | 3600 |

---

### 2.6 SSL Certificate Provisioning

Cloud Run automatically provisions Google-managed SSL certificates for all mapped domains. This happens automatically after DNS records are configured correctly.

**Timeline:**
- DNS propagation: 15-60 minutes (can take up to 48 hours)
- SSL provisioning: Additional 15-30 minutes after DNS is active

**Verification Commands:**

```bash
# Check certificate status for all domains
gcloud run domain-mappings describe --domain ctlstlabs.com --region us-central1
gcloud run domain-mappings describe --domain api.ctlstlabs.com --region us-central1
gcloud run domain-mappings describe --domain ctlstlabs.ca --region us-central1
gcloud run domain-mappings describe --domain api.ctlstlabs.ca --region us-central1

# Look for: certificateStatus: ACTIVE
```

**Certificate Status Values:**
| Status | Meaning |
|--------|---------|
| `PENDING` | Waiting for DNS to propagate |
| `PROVISIONING` | DNS verified, SSL being created |
| `ACTIVE` | SSL certificate is live |
| `FAILED` | DNS misconfiguration - check records |

---

### 2.7 Complete GCP Domain Mapping Commands

Here are all the domain mapping commands in one place:

```bash
#!/bin/bash
# File: setup-domains.sh
# Run this after PROD services are deployed

export PROJECT_ID="trainsmart-481620"
export REGION="us-central1"

echo "Creating domain mappings for ctlstlabs.com..."

# Primary domain: ctlstlabs.com
gcloud run domain-mappings create \
  --service trainsmart-frontend-prod \
  --domain ctlstlabs.com \
  --region $REGION

gcloud run domain-mappings create \
  --service trainsmart-frontend-prod \
  --domain www.ctlstlabs.com \
  --region $REGION

gcloud run domain-mappings create \
  --service trainsmart-backend-prod \
  --domain api.ctlstlabs.com \
  --region $REGION

echo "Creating domain mappings for ctlstlabs.ca..."

# Canadian domain: ctlstlabs.ca
gcloud run domain-mappings create \
  --service trainsmart-frontend-prod \
  --domain ctlstlabs.ca \
  --region $REGION

gcloud run domain-mappings create \
  --service trainsmart-frontend-prod \
  --domain www.ctlstlabs.ca \
  --region $REGION

gcloud run domain-mappings create \
  --service trainsmart-backend-prod \
  --domain api.ctlstlabs.ca \
  --region $REGION

echo "Creating domain mappings for ctlstlab.com (typo domain)..."

# Typo domain: ctlstlab.com (skip if using Squarespace redirect)
gcloud run domain-mappings create \
  --service trainsmart-frontend-prod \
  --domain ctlstlab.com \
  --region $REGION

gcloud run domain-mappings create \
  --service trainsmart-frontend-prod \
  --domain www.ctlstlab.com \
  --region $REGION

echo "Domain mappings created. Now configure DNS in Squarespace."
echo ""
echo "Get DNS records with:"
echo "  gcloud run domain-mappings describe --domain ctlstlabs.com --region $REGION"
```

---

### 2.8 Squarespace DNS Summary

**For each domain, add these records in Squarespace:**

#### ctlstlabs.com
| Type | Host | Value |
|------|------|-------|
| A | @ | 216.239.32.21 |
| A | @ | 216.239.34.21 |
| A | @ | 216.239.36.21 |
| A | @ | 216.239.38.21 |
| CNAME | www | ghs.googlehosted.com. |
| CNAME | api | ghs.googlehosted.com. |

#### ctlstlabs.ca
| Type | Host | Value |
|------|------|-------|
| A | @ | 216.239.32.21 |
| A | @ | 216.239.34.21 |
| A | @ | 216.239.36.21 |
| A | @ | 216.239.38.21 |
| CNAME | www | ghs.googlehosted.com. |
| CNAME | api | ghs.googlehosted.com. |

#### ctlstlab.com (Option A - Squarespace Redirect)
- Use Squarespace URL Forwarding to redirect to `https://ctlstlabs.com`

#### ctlstlab.com (Option B - Cloud Run)
| Type | Host | Value |
|------|------|-------|
| A | @ | 216.239.32.21 |
| A | @ | 216.239.34.21 |
| A | @ | 216.239.36.21 |
| A | @ | 216.239.38.21 |
| CNAME | www | ghs.googlehosted.com. |

---

### 2.9 DNS Propagation and Troubleshooting

**Check DNS Propagation:**

Use online tools to verify DNS records are propagating:
- https://dnschecker.org
- https://whatsmydns.net

**Common Issues:**

| Issue | Cause | Solution |
|-------|-------|----------|
| SSL stuck on PENDING | DNS not propagated | Wait 24-48 hours, verify records |
| 404 errors | Domain mapping missing | Run `gcloud run domain-mappings list` |
| Mixed content warnings | HTTP links in code | Ensure all URLs use HTTPS |
| CORS errors | Backend CORS not updated | Update CORS_ORIGINS env var |

**Squarespace-Specific Issues:**

1. **Cannot add multiple A records with same host:**
   - Squarespace should allow this, but if not, try adding them one at a time
   - Some Squarespace plans may have limitations

2. **CNAME at root (@) not allowed:**
   - This is standard DNS behavior; use A records for root domain
   - CNAME is only for subdomains (www, api)

3. **Records not appearing:**
   - Clear browser cache
   - Wait 15 minutes and refresh Squarespace panel
   - Contact Squarespace support if records don't save

---

## 3. CI/CD Pipeline Design

### 3.1 GitHub Actions Workflow Strategy

The current workflow deploys on push to main. We will modify it to:

1. **Push to main** -> Deploy to TEST automatically
2. **Manual workflow dispatch** OR **Release tag** -> Deploy to PROD

### 3.2 Updated Workflow Files

#### File: `.github/workflows/deploy.yml` (TEST - Automatic)

```yaml
name: Deploy to TEST

on:
  push:
    branches: [main]

env:
  PROJECT_ID: trainsmart-481620
  REGION: us-central1
  BACKEND_IMAGE: us-central1-docker.pkg.dev/trainsmart-481620/trainsmart/backend
  FRONTEND_IMAGE: us-central1-docker.pkg.dev/trainsmart-481620/trainsmart/frontend
  # TEST environment uses existing service names
  BACKEND_SERVICE: trainsmart-backend
  FRONTEND_SERVICE: trainsmart-frontend
  MIGRATIONS_JOB: trainsmart-migrations
  WORKLOAD_IDENTITY_PROVIDER: projects/922138784988/locations/global/workloadIdentityPools/github-pool/providers/github-provider
  SERVICE_ACCOUNT: github-actions@trainsmart-481620.iam.gserviceaccount.com
  ENVIRONMENT: test

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      backend: ${{ steps.changes.outputs.backend }}
      frontend: ${{ steps.changes.outputs.frontend }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: changes
        with:
          filters: |
            backend:
              - 'backend/**'
            frontend:
              - 'frontend/**'

  deploy-backend:
    needs: detect-changes
    if: needs.detect-changes.outputs.backend == 'true'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4

      - id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ env.WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ env.SERVICE_ACCOUNT }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev --quiet

      - name: Build and Push
        run: |
          BUILD_ID=$(gcloud builds submit ./backend \
            --tag ${{ env.BACKEND_IMAGE }}:${{ github.sha }} \
            --tag ${{ env.BACKEND_IMAGE }}:latest \
            --async \
            --format='value(id)')

          echo "Build ID: $BUILD_ID"

          while true; do
            STATUS=$(gcloud builds describe $BUILD_ID --format='value(status)')
            echo "Build status: $STATUS"

            if [ "$STATUS" = "SUCCESS" ]; then
              echo "Build completed successfully"
              break
            elif [ "$STATUS" = "FAILURE" ] || [ "$STATUS" = "CANCELLED" ] || [ "$STATUS" = "TIMEOUT" ]; then
              echo "Build failed with status: $STATUS"
              gcloud builds log $BUILD_ID --limit=100 || true
              exit 1
            fi

            sleep 10
          done

      - name: Deploy to Cloud Run (TEST)
        run: |
          gcloud run deploy ${{ env.BACKEND_SERVICE }} \
            --image ${{ env.BACKEND_IMAGE }}:${{ github.sha }} \
            --region ${{ env.REGION }} \
            --tag test

      - name: Run Migrations (TEST)
        run: |
          gcloud run jobs execute ${{ env.MIGRATIONS_JOB }} \
            --region ${{ env.REGION }} \
            --wait

  deploy-frontend:
    needs: detect-changes
    if: needs.detect-changes.outputs.frontend == 'true'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4

      - id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ env.WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ env.SERVICE_ACCOUNT }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev --quiet

      - name: Build and Push
        working-directory: frontend
        run: |
          BUILD_ID=$(gcloud builds submit --config=cloudbuild.yaml . \
            --async \
            --format='value(id)')

          echo "Build ID: $BUILD_ID"

          while true; do
            STATUS=$(gcloud builds describe $BUILD_ID --format='value(status)')
            echo "Build status: $STATUS"

            if [ "$STATUS" = "SUCCESS" ]; then
              echo "Build completed successfully"
              break
            elif [ "$STATUS" = "FAILURE" ] || [ "$STATUS" = "CANCELLED" ] || [ "$STATUS" = "TIMEOUT" ]; then
              echo "Build failed with status: $STATUS"
              gcloud builds log $BUILD_ID --limit=100 || true
              exit 1
            fi

            sleep 10
          done

      - name: Deploy to Cloud Run (TEST)
        run: |
          gcloud run deploy ${{ env.FRONTEND_SERVICE }} \
            --image ${{ env.FRONTEND_IMAGE }}:latest \
            --region ${{ env.REGION }} \
            --tag test
```

#### File: `.github/workflows/deploy-prod.yml` (PROD - Manual)

```yaml
name: Deploy to PRODUCTION

on:
  workflow_dispatch:
    inputs:
      confirm_deployment:
        description: 'Type "deploy-prod" to confirm production deployment'
        required: true
        type: string
      backend:
        description: 'Deploy backend?'
        required: true
        type: boolean
        default: true
      frontend:
        description: 'Deploy frontend?'
        required: true
        type: boolean
        default: true
      run_migrations:
        description: 'Run database migrations?'
        required: true
        type: boolean
        default: true

env:
  PROJECT_ID: trainsmart-481620
  REGION: us-central1
  BACKEND_IMAGE: us-central1-docker.pkg.dev/trainsmart-481620/trainsmart/backend
  FRONTEND_IMAGE: us-central1-docker.pkg.dev/trainsmart-481620/trainsmart/frontend
  # PROD environment uses -prod suffix
  BACKEND_SERVICE: trainsmart-backend-prod
  FRONTEND_SERVICE: trainsmart-frontend-prod
  MIGRATIONS_JOB: trainsmart-migrations-prod
  WORKLOAD_IDENTITY_PROVIDER: projects/922138784988/locations/global/workloadIdentityPools/github-pool/providers/github-provider
  SERVICE_ACCOUNT: github-actions@trainsmart-481620.iam.gserviceaccount.com

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Validate deployment confirmation
        if: ${{ github.event.inputs.confirm_deployment != 'deploy-prod' }}
        run: |
          echo "ERROR: You must type 'deploy-prod' to confirm production deployment"
          echo "You entered: ${{ github.event.inputs.confirm_deployment }}"
          exit 1

  deploy-backend:
    needs: validate
    if: ${{ github.event.inputs.backend == 'true' }}
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4

      - id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ env.WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ env.SERVICE_ACCOUNT }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Get latest TEST image digest
        id: get-digest
        run: |
          DIGEST=$(gcloud container images describe ${{ env.BACKEND_IMAGE }}:latest --format='value(image_summary.digest)')
          echo "digest=$DIGEST" >> $GITHUB_OUTPUT
          echo "Promoting image with digest: $DIGEST"

      - name: Deploy to Cloud Run (PROD)
        run: |
          gcloud run deploy ${{ env.BACKEND_SERVICE }} \
            --image ${{ env.BACKEND_IMAGE }}@${{ steps.get-digest.outputs.digest }} \
            --region ${{ env.REGION }}

      - name: Run Migrations (PROD)
        if: ${{ github.event.inputs.run_migrations == 'true' }}
        run: |
          gcloud run jobs execute ${{ env.MIGRATIONS_JOB }} \
            --region ${{ env.REGION }} \
            --wait

  deploy-frontend:
    needs: validate
    if: ${{ github.event.inputs.frontend == 'true' }}
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4

      - id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ env.WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ env.SERVICE_ACCOUNT }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev --quiet

      - name: Build PROD Frontend Image
        working-directory: frontend
        run: |
          # Build with PROD API URL
          BUILD_ID=$(gcloud builds submit \
            --config=cloudbuild-prod.yaml . \
            --async \
            --format='value(id)')

          echo "Build ID: $BUILD_ID"

          while true; do
            STATUS=$(gcloud builds describe $BUILD_ID --format='value(status)')
            echo "Build status: $STATUS"

            if [ "$STATUS" = "SUCCESS" ]; then
              echo "Build completed successfully"
              break
            elif [ "$STATUS" = "FAILURE" ] || [ "$STATUS" = "CANCELLED" ] || [ "$STATUS" = "TIMEOUT" ]; then
              echo "Build failed with status: $STATUS"
              gcloud builds log $BUILD_ID --limit=100 || true
              exit 1
            fi

            sleep 10
          done

      - name: Deploy to Cloud Run (PROD)
        run: |
          gcloud run deploy ${{ env.FRONTEND_SERVICE }} \
            --image ${{ env.FRONTEND_IMAGE }}:prod \
            --region ${{ env.REGION }}

  notify:
    needs: [deploy-backend, deploy-frontend]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Deployment Summary
        run: |
          echo "## Production Deployment Summary" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "| Component | Status |" >> $GITHUB_STEP_SUMMARY
          echo "|-----------|--------|" >> $GITHUB_STEP_SUMMARY
          echo "| Backend | ${{ needs.deploy-backend.result }} |" >> $GITHUB_STEP_SUMMARY
          echo "| Frontend | ${{ needs.deploy-frontend.result }} |" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**Deployed by:** ${{ github.actor }}" >> $GITHUB_STEP_SUMMARY
          echo "**Commit:** ${{ github.sha }}" >> $GITHUB_STEP_SUMMARY
```

### 3.3 Additional Files Needed

#### File: `frontend/cloudbuild-prod.yaml` (PROD Frontend Build)

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '--build-arg'
      - 'NEXT_PUBLIC_API_URL=https://api.ctlstlabs.com'
      - '-t'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/trainsmart/frontend:prod'
      - '.'

images:
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/trainsmart/frontend:prod'
```

### 3.4 Branch Strategy

**Recommended: Keep Simple (trunk-based)**

```
main branch
  |
  |-- push --> TEST (automatic)
  |
  |-- manual trigger --> PROD (workflow_dispatch)
```

**Why trunk-based:**
- The codebase is small
- Single team/developer
- TEST serves as the staging/QA environment
- PROD deployment is controlled via manual workflow dispatch

**Alternative: Release Tags (if preferred)**

```yaml
# Alternative trigger for deploy-prod.yml
on:
  release:
    types: [published]
```

This would deploy to PROD when a GitHub Release is created.

### 3.5 Rollback Strategy

#### Immediate Rollback (Cloud Run Revisions)

Cloud Run keeps previous revisions. To rollback:

```bash
# List recent revisions
gcloud run revisions list --service trainsmart-backend-prod --region us-central1

# Rollback to previous revision
gcloud run services update-traffic trainsmart-backend-prod \
  --region us-central1 \
  --to-revisions REVISION_NAME=100
```

#### Automated Rollback Workflow

Create `.github/workflows/rollback-prod.yml`:

```yaml
name: Rollback PRODUCTION

on:
  workflow_dispatch:
    inputs:
      service:
        description: 'Service to rollback'
        required: true
        type: choice
        options:
          - backend
          - frontend
          - both
      revision_count:
        description: 'Number of revisions to go back (1 = previous)'
        required: true
        type: number
        default: 1

env:
  PROJECT_ID: trainsmart-481620
  REGION: us-central1
  WORKLOAD_IDENTITY_PROVIDER: projects/922138784988/locations/global/workloadIdentityPools/github-pool/providers/github-provider
  SERVICE_ACCOUNT: github-actions@trainsmart-481620.iam.gserviceaccount.com

jobs:
  rollback:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ env.WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ env.SERVICE_ACCOUNT }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Rollback Backend
        if: ${{ github.event.inputs.service == 'backend' || github.event.inputs.service == 'both' }}
        run: |
          REVISIONS=$(gcloud run revisions list \
            --service trainsmart-backend-prod \
            --region ${{ env.REGION }} \
            --format='value(name)' \
            --limit=$((1 + ${{ github.event.inputs.revision_count }})))

          TARGET=$(echo "$REVISIONS" | tail -n 1)
          echo "Rolling back to: $TARGET"

          gcloud run services update-traffic trainsmart-backend-prod \
            --region ${{ env.REGION }} \
            --to-revisions $TARGET=100

      - name: Rollback Frontend
        if: ${{ github.event.inputs.service == 'frontend' || github.event.inputs.service == 'both' }}
        run: |
          REVISIONS=$(gcloud run revisions list \
            --service trainsmart-frontend-prod \
            --region ${{ env.REGION }} \
            --format='value(name)' \
            --limit=$((1 + ${{ github.event.inputs.revision_count }})))

          TARGET=$(echo "$REVISIONS" | tail -n 1)
          echo "Rolling back to: $TARGET"

          gcloud run services update-traffic trainsmart-frontend-prod \
            --region ${{ env.REGION }} \
            --to-revisions $TARGET=100
```

---

## 4. Database Migration Strategy

### 4.1 Migration Flow

```
Developer creates migration
        |
        v
Push to main
        |
        v
Deploy to TEST (runs migrations automatically)
        |
        v
QA/Testing in TEST environment
        |
        v
Manual trigger PROD deployment (includes migration checkbox)
        |
        v
PROD migrations run
```

### 4.2 Migration Safety Rules

1. **Always forward-compatible:** Migrations must not break the currently running code
2. **Additive changes preferred:** Add columns as nullable, add new tables
3. **Two-phase migrations for breaking changes:**
   - Phase 1: Add new structure, deploy code that supports both
   - Phase 2: Remove old structure after all code updated

### 4.3 Migration Commands Per Environment

```bash
# TEST migrations (automatic in CI/CD)
gcloud run jobs execute trainsmart-migrations \
  --region us-central1 \
  --wait

# PROD migrations (manual or via CI/CD with approval)
gcloud run jobs execute trainsmart-migrations-prod \
  --region us-central1 \
  --wait

# Check migration status
gcloud run jobs executions list --job trainsmart-migrations-prod --region us-central1
```

### 4.4 Data Isolation

| Aspect | TEST | PROD |
|--------|------|------|
| Database | `trainsmart` | `trainsmart_prod` |
| User | `trainsmart_user` | `trainsmart_prod_user` |
| Data | Test data, can be reset | Real user data |
| Secrets | `jwt-secret` (existing) | `jwt-secret-prod` (new) |

**Never copy PROD data to TEST** without proper anonymization.

---

## 5. Cost Considerations

### 5.1 Current Monthly Cost (Single Environment)

| Service | Estimated Cost |
|---------|---------------|
| Cloud Run (2 services, low traffic) | $0-10 |
| Cloud SQL (db-f1-micro) | $10-30 |
| Artifact Registry | $0-5 |
| Cloud Build | $0 (free tier: 120 min/day) |
| **Total** | **$15-45/month** |

### 5.2 Projected Monthly Cost (Two Environments)

| Service | TEST | PROD | Total |
|---------|------|------|-------|
| Cloud Run Backend | $0-5 | $5-15 | $5-20 |
| Cloud Run Frontend | $0-5 | $5-15 | $5-20 |
| Cloud SQL | $10-30 (shared instance) | (included) | $10-30 |
| Custom Domain SSL | $0 | $0 (managed) | $0 |
| Artifact Registry | $0-5 (shared) | (included) | $0-5 |
| Cloud Build | $0 | (included) | $0 |
| **Total** | | | **$25-75/month** |

### 5.3 Cost Optimization Tips

1. **Cloud Run min-instances:** Keep at 0 for TEST, consider 1 for PROD to reduce cold starts
2. **Cloud SQL:** Use single instance with separate databases (saves ~$15-30/month)
3. **Build caching:** Implement Docker layer caching to reduce build times and costs
4. **Traffic-based scaling:** Cloud Run automatically scales to zero when idle

---

## 6. Implementation Checklist

### Phase 1: GCP Infrastructure (Day 1)

- [ ] Create PROD database: `gcloud sql databases create trainsmart_prod --instance=trainsmart-db`
- [ ] Create PROD database user
- [ ] Create PROD secrets in Secret Manager
- [ ] Create PROD Cloud Run services (backend and frontend)
- [ ] Create PROD migrations job
- [ ] Verify PROD services are accessible

### Phase 2: Domain Configuration in Squarespace (Day 1-2)

- [ ] Create GCP domain mappings for all domains (run setup-domains.sh or commands from Section 2.7)
- [ ] Configure DNS records in Squarespace for `ctlstlabs.com` (Section 2.3)
- [ ] Configure DNS records in Squarespace for `ctlstlabs.ca` (Section 2.4)
- [ ] Configure redirect for `ctlstlab.com` (Section 2.5 - Option A recommended)
- [ ] Wait for DNS propagation (15-60 minutes, up to 48 hours)
- [ ] Verify SSL certificates are ACTIVE for all domains
- [ ] Test PROD endpoints via all custom domains:
  - [ ] `https://ctlstlabs.com`
  - [ ] `https://api.ctlstlabs.com`
  - [ ] `https://ctlstlabs.ca`
  - [ ] `https://api.ctlstlabs.ca`
  - [ ] `https://ctlstlab.com` (should redirect to ctlstlabs.com)

### Phase 3: CI/CD Updates (Day 2)

- [ ] Rename `deploy.yml` to reflect TEST environment
- [ ] Create `deploy-prod.yml` for manual PROD deployments
- [ ] Create `rollback-prod.yml` for emergency rollbacks
- [ ] Create `frontend/cloudbuild-prod.yaml` with PROD API URL
- [ ] Test TEST deployment workflow
- [ ] Test PROD deployment workflow (dry run)

### Phase 4: Testing and Validation (Day 2-3)

- [ ] Deploy to TEST and verify functionality
- [ ] Deploy to PROD and verify functionality
- [ ] Test all domains accessibility:
  - [ ] `https://ctlstlabs.com` (primary frontend)
  - [ ] `https://api.ctlstlabs.com/api/v1/health` (primary API)
  - [ ] `https://ctlstlabs.ca` (Canadian frontend)
  - [ ] `https://api.ctlstlabs.ca/api/v1/health` (Canadian API)
  - [ ] `https://ctlstlab.com` redirects to `https://ctlstlabs.com`
- [ ] Verify CORS works for all domains (frontend can call API)
- [ ] Verify database isolation (TEST vs PROD data)
- [ ] Test rollback procedure

### Phase 5: Documentation and Handoff (Day 3)

- [ ] Update CLAUDE.md with multi-environment notes
- [ ] Document deployment procedures for team
- [ ] Create runbook for common operations
- [ ] Set up monitoring/alerting (optional)

---

## 7. GCP Commands Quick Reference

### Create PROD Infrastructure

```bash
# Variables
export PROJECT_ID="trainsmart-481620"
export REGION="us-central1"
export CONNECTION_NAME=$(gcloud sql instances describe trainsmart-db --format="value(connectionName)")

# 1. Create PROD database
gcloud sql databases create trainsmart_prod --instance=trainsmart-db

# 2. Create PROD user (use a secure password)
gcloud sql users create trainsmart_prod_user \
  --instance=trainsmart-db \
  --password=SECURE_PASSWORD_HERE

# 3. Create PROD secret
echo -n "prod-jwt-secret-at-least-32-characters-long" | \
  gcloud secrets create jwt-secret-prod --data-file=-

# 4. Deploy PROD backend
gcloud run deploy trainsmart-backend-prod \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/trainsmart/backend:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --add-cloudsql-instances $CONNECTION_NAME \
  --set-env-vars "ENVIRONMENT=production" \
  --set-env-vars "DATABASE_URL=postgresql+asyncpg://trainsmart_prod_user:PASSWORD@/trainsmart_prod?host=/cloudsql/$CONNECTION_NAME" \
  --set-secrets "SECRET_KEY=jwt-secret-prod:latest" \
  --min-instances 1 \
  --max-instances 10 \
  --memory 512Mi \
  --cpu 1

# 5. Create PROD migrations job
gcloud run jobs create trainsmart-migrations-prod \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/trainsmart/backend:latest \
  --region $REGION \
  --add-cloudsql-instances $CONNECTION_NAME \
  --set-env-vars "DATABASE_URL=postgresql+asyncpg://trainsmart_prod_user:PASSWORD@/trainsmart_prod?host=/cloudsql/$CONNECTION_NAME" \
  --command "alembic" \
  --args "upgrade,head"

# 6. Run PROD migrations
gcloud run jobs execute trainsmart-migrations-prod --region $REGION --wait

# 7. Deploy PROD frontend (after creating cloudbuild-prod.yaml)
cd frontend
gcloud builds submit --config=cloudbuild-prod.yaml .
gcloud run deploy trainsmart-frontend-prod \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/trainsmart/frontend:prod \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 10 \
  --memory 512Mi \
  --cpu 1

# 8. Map custom domain
gcloud run domain-mappings create \
  --service trainsmart-frontend-prod \
  --domain ctlstlabs.com \
  --region $REGION

gcloud run domain-mappings create \
  --service trainsmart-backend-prod \
  --domain api.ctlstlabs.com \
  --region $REGION

# 9. Update CORS on PROD backend (include all domains)
gcloud run services update trainsmart-backend-prod \
  --region $REGION \
  --set-env-vars "CORS_ORIGINS=https://ctlstlabs.com,https://www.ctlstlabs.com,https://ctlstlabs.ca,https://www.ctlstlabs.ca,https://ctlstlab.com,https://www.ctlstlab.com"
```

---

## 8. Architecture Diagram

```
                                    GitHub Repository
                                           |
                    +----------------------+----------------------+
                    |                                             |
               Push to main                              Manual Dispatch
                    |                                             |
                    v                                             v
          +------------------+                          +------------------+
          | GitHub Actions   |                          | GitHub Actions   |
          | deploy.yml       |                          | deploy-prod.yml  |
          +------------------+                          +------------------+
                    |                                             |
                    v                                             v
    +-------------------------------+           +----------------------------------------+
    |        TEST Environment       |           |           PROD Environment             |
    +-------------------------------+           +----------------------------------------+
    |                               |           |                                        |
    | trainsmart-frontend           |           | trainsmart-frontend-prod               |
    | (Cloud Run URL)               |           |   - ctlstlabs.com (primary)            |
    |                               |           |   - ctlstlabs.ca (Canadian)            |
    | trainsmart-backend            |           |   - ctlstlab.com (typo redirect)       |
    | (Cloud Run URL)               |           |                                        |
    |                               |           | trainsmart-backend-prod                |
    +-------------------------------+           |   - api.ctlstlabs.com                  |
                    |                           |   - api.ctlstlabs.ca                   |
                    |                           +----------------------------------------+
                    |                                             |
                    +---------------------+----------------------+
                                          |
                                          v
                              +------------------------+
                              |    Cloud SQL           |
                              |    trainsmart-db       |
                              +------------------------+
                              | DB: trainsmart (TEST)  |
                              | DB: trainsmart_prod    |
                              +------------------------+

                              +------------------------+
                              |     Squarespace        |
                              |     (DNS Registrar)    |
                              +------------------------+
                              | ctlstlabs.com -> GCP   |
                              | ctlstlabs.ca  -> GCP   |
                              | ctlstlab.com  -> Redirect |
                              +------------------------+
```

---

## 9. Monitoring and Alerting (Future Enhancement)

While not required for initial setup, consider adding:

1. **Cloud Monitoring Dashboards:**
   - Request latency (p50, p95, p99)
   - Error rates by service
   - Instance count over time

2. **Alerting Policies:**
   - Error rate > 1% for 5 minutes
   - Latency p95 > 2s for 5 minutes
   - Service unavailable

3. **Uptime Checks:**
   - Frontend: `https://ctlstlabs.com`
   - Backend: `https://api.ctlstlabs.com/api/v1/health`

```bash
# Example: Create uptime check
gcloud monitoring uptime-checks create http trainsmart-prod-frontend \
  --display-name="TrainSmart PROD Frontend" \
  --uri="https://ctlstlabs.com" \
  --check-interval=60s
```

---

## 10. Summary

This plan provides a clear path from single-environment to a proper TEST/PROD setup:

| Aspect | Current | After Implementation |
|--------|---------|---------------------|
| Environments | 1 (implicit prod) | 2 (TEST + PROD) |
| Deployment trigger | Push to main | TEST: auto, PROD: manual |
| Domain | Cloud Run default | PROD: ctlstlabs.com, ctlstlabs.ca, ctlstlab.com |
| Database isolation | None | Separate databases |
| Rollback capability | Manual | Automated workflow |
| Cost | ~$15-45/month | ~$25-75/month |

**Estimated Implementation Time:** 2-3 days

**Risk Level:** Low (all changes are additive; existing TEST environment remains unchanged)
