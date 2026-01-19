# TrainSmart Development Guide

## Project Overview

TrainSmart is a B2B Mental Performance Training Platform built with:
- **Frontend**: Next.js 14 (TypeScript, Tailwind CSS)
- **Backend**: FastAPI (Python, async)
- **Database**: PostgreSQL 15
- **Deployment**: GCP Cloud Run with CI/CD via GitHub Actions

## Local Development Setup

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local frontend development without Docker)
- Python 3.11+ (for local backend development without Docker)

### Running with Docker (Recommended)

All services run via Docker containers. This is the recommended approach.

```bash
# Start all services (database, backend, frontend)
docker-compose up

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (fresh database)
docker-compose down -v
```

**Services:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Database: localhost:5432

### Running Database Migrations

Migrations run inside the backend container:

```bash
# Run all pending migrations
docker-compose exec backend alembic upgrade head

# Create a new migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# Check current migration status
docker-compose exec backend alembic current

# Rollback one migration
docker-compose exec backend alembic downgrade -1
```

### Running Tests

```bash
# Backend tests
docker-compose exec backend pytest

# Backend tests with coverage
docker-compose exec backend pytest --cov=app

# Frontend tests (if configured)
docker-compose exec frontend npm test
```

### Local Development Without Docker (Alternative)

If you need to run services locally without Docker:

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL="postgresql+asyncpg://trainsmart:trainsmart_dev@localhost:5432/trainsmart"
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Note: You still need PostgreSQL running (use Docker for just the database):
```bash
docker-compose up db
```

## Project Structure

```
trainsmart/
├── frontend/                 # Next.js 14 frontend
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   │   ├── training/    # Training module components
│   │   │   │   ├── screens/ # Screen type components
│   │   │   │   └── types.ts # TypeScript interfaces
│   │   │   └── ...
│   │   └── lib/             # Utilities
│   └── package.json
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── api/             # API routes
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   └── main.py
│   ├── alembic/
│   │   └── versions/        # Database migrations
│   └── requirements.txt
├── docker-compose.yml        # Docker services config
└── CLAUDE.md                # This file
```

## Training Modules

Training modules use a screen-based content system with the following flow types:
- `sequential_activities`: Linear progression through activities

### Screen Types

Current implemented screen types:
- `swipe_card` - Swipeable cards for yes/no decisions
- `static_card` - Simple text display
- `tap_reveal_list` - Sequential tap-to-reveal items
- `full_screen_statement` - Emphasis statement display
- `single_tap_reflection` - Single tap to continue
- `tap_reveal_columns` - Column-based tap reveals
- `zone_diagram` - Performance zone visualization
- `recognition_list` - List of items to recognize
- `micro_commitment` - User commitment selection
- `micro_commitment_confirmation` - Confirm commitment
- `activity_completion` - Activity end screen
- `emoji_select` - Multi-select with emojis
- `multi_select` - Text-based multi-select
- `text_input` - Free text entry
- `confirmation_display` - Shows previous responses
- `category_toggle` - Tap-to-categorize items

### Adding New Screen Types

1. Define content interface in `frontend/src/components/training/types.ts`
2. Create component in `frontend/src/components/training/screens/`
3. Export from `frontend/src/components/training/screens/index.ts`
4. Add case to `ScreenRenderer.tsx`
5. Create migration to seed content using new type

### Screen ID Naming Convention

**CRITICAL:** Screen IDs must be globally unique within a module to support cross-activity data access.

**Format:** `a{activity_number}_s{screen_number}_{purpose}`

**Examples:**
- `a4_s3_goal_input` - Activity 4, Screen 3, goal input field
- `a5_s7_action_items` - Activity 5, Screen 7, action items entry
- `a4_s5_timeline` - Activity 4, Screen 5, timeline selection

**Why this matters:**
- Screen responses are stored in a flat `screen_responses` dictionary
- Cross-activity references (e.g., Activity 5 displaying Activity 4's goals) use screen IDs
- ID collisions cause data overwrites and incorrect displays

**Cross-Activity Data Access:**
Screens can reference data from other activities using `display_from_screens` or `context_display`:
```typescript
// In Activity 5, display the goal entered in Activity 4
{
  type: 'static_card',
  content: {
    body: 'Let\'s break down your goal into steps.',
    context_display: {
      from_screen: 'a4_s3_goal_input',
      label: 'Your goal:'
    }
  }
}
```

## Database

### Environment Variables
```
DATABASE_URL=postgresql+asyncpg://trainsmart:trainsmart_dev@db:5432/trainsmart
```

### Key Models
- `User` - User accounts
- `TrainingModule` - Training modules (e.g., "Building Confidence")
- `Activity` - Activities within modules
- `Screen` - Individual screens with content (JSONB)
- `UserProgress` - User progress tracking (JSONB for responses)

## Deployment

### GCP Cloud Run

Deployment happens automatically via GitHub Actions on push to main:
- Frontend: Cloud Run service `trainsmart-frontend`
- Backend: Cloud Run service `trainsmart-backend`
- Database: Cloud SQL PostgreSQL

### Deployment Safety Rules

**IMPORTANT:** When pushing code to GitHub:
1. **DO NOT automatically deploy to PROD** - Only push to GitHub and let TEST deploy run
2. **Wait for TEST to pass** - Verify the changes work in TEST environment first
3. **User triggers PROD deployment** - Only deploy to PROD when the user explicitly requests it
4. PROD deployment requires manual confirmation (`DEPLOY-PROD`)

This prevents accidental production deployments and allows for proper testing.

### Manual Deployment

```bash
# Backend
gcloud run deploy trainsmart-backend --source ./backend

# Frontend
gcloud run deploy trainsmart-frontend --source ./frontend
```

## Common Tasks

### Rebuilding Containers
```bash
docker-compose build --no-cache
docker-compose up
```

### Checking Container Status
```bash
docker-compose ps
```

### Accessing Container Shell
```bash
# Backend
docker-compose exec backend bash

# Database
docker-compose exec db psql -U trainsmart
```

### Viewing Database
```bash
docker-compose exec db psql -U trainsmart -c "SELECT * FROM training_modules;"
```

## Troubleshooting

### "role trainsmart does not exist"
You're trying to connect to a local PostgreSQL instead of the Docker container. Make sure Docker is running:
```bash
docker-compose up db
```

### Frontend can't reach backend
Check CORS settings and ensure backend is running:
```bash
docker-compose logs backend
```

### Migration conflicts
Check current state and resolve:
```bash
docker-compose exec backend alembic current
docker-compose exec backend alembic heads
```

## Known Issues & Root Causes

### Activity Not Unlocking After Completion (Sequential Activities)

**Symptom:** User completes Activity 1 but Activity 2 remains locked.

**Root Cause:** No progress record exists when the user starts an activity.

**Why it happens:**
1. When clicking directly on an activity card (instead of "Start Module" button), `handleStartActivity` was only navigating without creating a progress record
2. Without a progress record, `progress?.id` is undefined in the activity page
3. When `handleContinue` runs on the last screen, `if (progress?.id)` is false, so nothing is saved
4. User returns to module overview with no `activities_completed` data

**Also check:**
- Backend `/progress/start` endpoint must initialize `progress_data` based on module `flow_type`:
  - `sequential_activities`: `{activities_completed: [], current_activity: null, current_screen: 0, screen_responses: {}}`
  - Sections-based: `{cards_viewed: [], sections_completed: [], examples_viewed: []}`

**Files involved:**
- `frontend/src/app/(dashboard)/train/[slug]/page.tsx` - `handleStartActivity` must create progress if none exists
- `backend/app/api/v1/training_modules.py` - `start_module` endpoint initializes `progress_data`

**Debug steps:**
1. Check database: `SELECT progress_data FROM module_progress WHERE module_id = (SELECT id FROM training_modules WHERE slug = 'module-slug');`
2. If no rows, progress record wasn't created
3. If `progress_data` has wrong structure (e.g., `cards_viewed` for sequential module), backend initialization is wrong

### API 404 Errors Due to Trailing Slash

**Symptom:** Frontend gets 404 error when calling an API endpoint.

**Root Cause:** The backend has `redirect_slashes=False` in `app/main.py`, meaning routes are strict about trailing slashes.

**Why it happens:**
- Backend defines routes WITHOUT trailing slashes (e.g., `@router.post("")` for `/checkins`)
- If frontend calls WITH trailing slash (e.g., `/checkins/`), it returns 404
- This is intentional for GCP Cloud Run deployment consistency

**Fix:**
- Ensure frontend API calls match backend route definitions exactly
- Never use trailing slashes unless the route explicitly defines one

**Example:**
```python
# Backend: @router.post("")  → /checkins (no trailing slash)
# Frontend WRONG: apiPost('/checkins/', {...})  → 404
# Frontend RIGHT: apiPost('/checkins', {...})   → 201
```

**Test added:** `test_create_checkin_trailing_slash_returns_404` in `tests/test_checkins.py` to catch this issue
