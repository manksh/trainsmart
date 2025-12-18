# TrainSmart - Project Summary

**Last Updated:** December 18, 2024

## Overview

TrainSmart is a B2B mental performance training platform for athletes. It provides organizations (sports clubs, teams) with tools to assess, train, and track their athletes' mental performance.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | FastAPI (Python), SQLAlchemy, Alembic |
| Database | PostgreSQL 15 |
| Auth | JWT tokens with role-based access |
| Testing | Vitest (frontend), Pytest (backend) |
| Infrastructure | Docker, Docker Compose |

---

## What We Built (Last 3 Days)

### Day 1: Core B2B Foundation (Phase 1 MVP)

#### Backend Infrastructure
- **User Authentication** - JWT-based auth with login/signup
- **Role Hierarchy** - SuperAdmin > Admin > Athlete permissions
- **Organization Management** - Multi-tenant architecture
- **Membership System** - Users belong to organizations with roles
- **Invite System** - Unique invite codes for athlete onboarding

#### Mental Performance Assessment
- **48-Question Assessment** - Comprehensive mental performance evaluation
- **6 Pillar Scoring System:**
  - Confidence
  - Focus
  - Intensity/Energy
  - Mindfulness
  - Goal Setting
  - Resilience
- **Reverse Scoring Support** - Some questions scored inversely
- **Strengths/Growth Areas** - Automated identification based on scores

#### Frontend Pages
- Login/Signup with invite code validation
- Role-based dashboards (SuperAdmin, Admin, Athlete)
- Multi-step assessment form with progress tracking
- Results visualization with radar chart and score bars
- Admin athlete list with expandable score details

---

### Day 2: Check-ins, Journaling & Activity Tracking

#### Check-in System
- **Mood Check-in** - 8-screen flow with emoji selection
- **Confidence Check-in** - Pre/post competition confidence tracking
- **Energy Check-in** - Energy level monitoring

#### Journaling Feature
- **Pre-Competition Journal** - Structured prompts before events
- **Post-Competition Journal** - Reflection after events
- **Open Journal** - Free-form journaling
- **Journal History** - View past entries

#### Weekly Activity Tracker
- Visual display of weekly engagement on athlete dashboard
- Tracks check-ins, journals, and training completed

#### Navigation Redesign
- Bottom navigation for mobile-first experience
- Top navigation bar with user menu
- Role-appropriate navigation items

#### Test Infrastructure
- GitHub Actions CI pipeline
- Frontend tests with Vitest
- Backend tests with Pytest
- Automated test runs on PR

---

### Day 3: Training Modules System

#### Backend - Training Module Infrastructure
- **TrainingModule Model** - Stores module metadata and JSONB content
- **UserModuleProgress Model** - Tracks individual progress
- **API Endpoints:**
  - `GET /training-modules/config` - List available modules
  - `GET /training-modules/{slug}/content` - Get module content
  - `GET /training-modules/{slug}/progress` - Get user progress
  - `PATCH /training-modules/{slug}/progress` - Update progress

#### Module 1: Being Human (Hub-Based Flow)
- **Flow Type:** Hub with 4 sections
- **Sections:**
  - Mindset Foundation (6 cards)
  - Performance Thoughts (5 cards)
  - Self-Talk (4 cards)
  - Daily Practice (3 cards)
- **Screen Types:** swipe_card, full_screen_statement

#### Module 2: About Performance (Sequential Activities)
- **Flow Type:** Sequential with 5 activities (~47 screens total)
- **Activities:**
  1. Why Performance Feels Hard (12 screens)
  2. Working With What's Hard (8 screens)
  3. Your Brain's Responses (10 screens)
  4. Working With Discomfort (9 screens)
  5. Your Commitment (8 screens)

#### Screen Components Created
| Component | Description |
|-----------|-------------|
| `SwipeCard` | Card with optional flip-to-reveal animation |
| `FullScreenStatement` | Bold statement display (reassurance/insight) |
| `SingleTapReflection` | Single-choice selection |
| `TapRevealColumns` | Two-column with tap-to-reveal items |
| `ZoneDiagram` | Interactive concentric circles (Comfort/Stretch/Danger zones) |
| `RecognitionList` | Multi-select highlight list |
| `MicroCommitment` | Commitment selection with custom input support |
| `MicroCommitmentConfirmation` | Confirmation display |
| `ActivityCompletion` | Activity completion celebration screen |
| `ScreenRenderer` | Dynamic router to correct screen component |

#### Key Features Implemented
- **Flip Card Animation** - 3D CSS transform for SwipeCard follow_up content
- **Activity Completion Markers** - Clear completion screens for proper unlocking
- **Custom Input Support** - MicroCommitment allows personalized commitments
- **Progress Persistence** - Resume at exact screen after leaving
- **Color Theming** - Emerald, purple, blue themes across components

#### Bug Fixes
- Fixed MicroCommitment auto-selection (no longer auto-shows confirmation)
- Fixed SwipeCard "Tell me more" UX (now uses flip animation)
- Removed redundant confirmation screens from Activities 2-5

#### Tests Added (72 Frontend Tests)
- `SwipeCard.test.tsx` - 14 tests (flip animation, continue button logic)
- `ActivityCompletion.test.tsx` - 12 tests (rendering, interactions)
- `MicroCommitment.test.tsx` - 22 tests (selection, custom input, saved state)
- `ScreenRenderer.test.tsx` - 11 tests (routing to correct components)
- Plus existing tests: TopNav, utils

---

## Current Architecture

```
trainsmart/
├── backend/
│   ├── app/
│   │   ├── api/v1/           # API endpoints
│   │   │   ├── auth.py       # Authentication
│   │   │   ├── users.py      # User management
│   │   │   ├── organizations.py
│   │   │   ├── invites.py
│   │   │   ├── assessments.py
│   │   │   ├── checkins.py
│   │   │   ├── journals.py
│   │   │   └── training_modules.py
│   │   ├── models/           # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── organization.py
│   │   │   ├── membership.py
│   │   │   ├── invite.py
│   │   │   ├── assessment.py
│   │   │   ├── checkin.py
│   │   │   ├── journal.py
│   │   │   └── training_module.py
│   │   └── schemas/          # Pydantic schemas
│   ├── alembic/versions/     # Database migrations
│   └── tests/                # Backend tests
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/       # Login, Signup
│   │   │   └── (dashboard)/
│   │   │       ├── athlete/  # Athlete dashboard
│   │   │       ├── admin/    # Admin dashboard
│   │   │       ├── superadmin/
│   │   │       ├── assessment/
│   │   │       ├── results/
│   │   │       ├── checkin/  # Mood, Confidence, Energy
│   │   │       ├── train/    # Training modules
│   │   │       │   └── [slug]/
│   │   │       │       ├── activity/[activityId]/
│   │   │       │       └── ...
│   │   │       └── tools/
│   │   │           ├── journaling/
│   │   │           └── breathing/
│   │   ├── components/
│   │   │   ├── training/screens/  # Training screen components
│   │   │   └── layout/
│   │   ├── hooks/
│   │   └── lib/
│   └── public/
│
├── docs/
│   ├── PROJECT_SUMMARY.md    # This file
│   └── GCP_DEPLOYMENT_GUIDE.md
│
├── docker-compose.yml
└── Makefile
```

---

## Database Schema

### Core Tables
| Table | Description |
|-------|-------------|
| `users` | User accounts with auth info |
| `organizations` | Sports clubs/teams |
| `memberships` | User-organization relationships with roles |
| `invites` | Invite codes for onboarding |

### Assessment Tables
| Table | Description |
|-------|-------------|
| `assessments` | Assessment definitions |
| `assessment_questions` | 48 questions with pillar mapping |
| `assessment_responses` | User answers |
| `assessment_results` | Calculated pillar scores |

### Engagement Tables
| Table | Description |
|-------|-------------|
| `check_ins` | Mood, confidence, energy check-ins |
| `journals` | Journal entries (pre/post/open) |

### Training Tables
| Table | Description |
|-------|-------------|
| `training_modules` | Module metadata + JSONB content |
| `user_module_progress` | Progress tracking per user/module |

---

## API Endpoints Summary

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register/superadmin` - Initial superadmin setup
- `POST /api/v1/auth/signup` - Athlete signup with invite code

### Users & Organizations
- `GET /api/v1/users/me` - Current user profile
- `GET /api/v1/organizations` - List organizations (superadmin)
- `GET /api/v1/organizations/{id}` - Organization details

### Invites
- `POST /api/v1/invites` - Create invite (admin)
- `GET /api/v1/invites/validate/{code}` - Validate invite code

### Assessments
- `GET /api/v1/assessments` - List assessments
- `POST /api/v1/assessments/{id}/responses` - Submit responses
- `GET /api/v1/assessments/{id}/results` - Get results

### Check-ins
- `POST /api/v1/checkins` - Create check-in
- `GET /api/v1/checkins` - List user check-ins
- `GET /api/v1/checkins/weekly-summary` - Weekly activity data

### Journals
- `POST /api/v1/journals` - Create journal entry
- `GET /api/v1/journals` - List journal entries
- `GET /api/v1/journals/{id}` - Get journal entry

### Training Modules
- `GET /api/v1/training-modules/config` - List modules with progress
- `GET /api/v1/training-modules/{slug}/content` - Module content
- `GET /api/v1/training-modules/{slug}/progress` - User progress
- `PATCH /api/v1/training-modules/{slug}/progress` - Update progress

---

## Test Coverage

### Frontend (72 tests)
- **Components:** TopNav, SwipeCard, ActivityCompletion, MicroCommitment, ScreenRenderer
- **Utilities:** cn function

### Backend (6 test files)
- `test_auth.py` - Authentication and JWT handling
- `test_authorization.py` - Role-based access control
- `test_assessments.py` - Assessment submission and scoring
- `test_scoring.py` - Pillar score calculations
- `test_checkins.py` - Check-in creation and retrieval
- `test_journals.py` - Journal CRUD operations

---

## Next Steps

### Immediate: GCP Deployment

See `docs/GCP_DEPLOYMENT_GUIDE.md` for detailed instructions.

**Phase 1 Checklist (Manual):**
- [ ] Create GCP account at https://cloud.google.com
- [ ] Enable billing (free $300 credits available)
- [ ] Create project named `trainsmart`
- [ ] Install gcloud CLI: `brew install google-cloud-sdk`
- [ ] Initialize: `gcloud init`
- [ ] Export project ID: `export PROJECT_ID="your-project-id"`

**Phase 2+ (Automated with gcloud commands):**
- [ ] Enable required APIs
- [ ] Create Artifact Registry
- [ ] Create Cloud SQL PostgreSQL instance
- [ ] Create secrets in Secret Manager
- [ ] Build and push Docker images
- [ ] Deploy backend to Cloud Run
- [ ] Run database migrations
- [ ] Deploy frontend to Cloud Run
- [ ] Configure CORS

---

### Short-term Improvements

#### Training Modules
- [ ] Add progress percentage to module cards
- [ ] Implement module completion celebration
- [ ] Add "Continue where you left off" quick action
- [ ] Create Module 3 content (next in curriculum)

#### User Experience
- [ ] Add loading skeletons for async content
- [ ] Implement pull-to-refresh on mobile
- [ ] Add haptic feedback on interactions (mobile)
- [ ] Create onboarding tutorial for new users

#### Admin Features
- [ ] Athlete progress dashboard
- [ ] Bulk invite functionality
- [ ] Export assessment results to CSV
- [ ] Team-wide engagement analytics

---

### Medium-term Features

#### Content & Training
- [ ] Video content integration
- [ ] Audio guided exercises (breathing, visualization)
- [ ] Personalized training recommendations based on assessment
- [ ] Spaced repetition for key concepts

#### Engagement
- [ ] Push notifications for daily check-ins
- [ ] Streak tracking and rewards
- [ ] Weekly progress emails
- [ ] In-app messaging (coach to athlete)

#### Analytics
- [ ] Assessment score trends over time
- [ ] Team comparison dashboards
- [ ] Engagement metrics and reporting
- [ ] A/B testing framework for content

---

### Long-term Vision

#### Platform Expansion
- [ ] Mobile apps (React Native or Flutter)
- [ ] Wearable integration (sleep, HRV data)
- [ ] Competition calendar integration
- [ ] Multi-language support

#### AI Features
- [ ] AI-powered journaling prompts
- [ ] Personalized content recommendations
- [ ] Natural language check-ins
- [ ] Predictive performance insights

#### Enterprise
- [ ] SSO integration (SAML, OAuth)
- [ ] Custom branding per organization
- [ ] API for third-party integrations
- [ ] Advanced role permissions

---

## Jira Epics & Tasks

### Completed
- **KAN-67:** About Performance Training Module (Epic)
  - KAN-68 through KAN-79: Individual screen implementations
- **KAN-65:** Being Human Module (if separate)

### In Progress
- GCP Deployment setup

### Backlog
- Module 3 development
- Admin analytics dashboard
- Push notification system
- Mobile app development

---

## Quick Commands

### Local Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Run backend tests
cd backend && pytest

# Run frontend tests
cd frontend && npm run test

# Run migrations
cd backend && alembic upgrade head
```

### Database
```bash
# Connect to local database
psql postgresql://trainsmart:trainsmart_dev@localhost:5432/trainsmart

# Create new migration
cd backend && alembic revision --autogenerate -m "description"
```

### Git
```bash
# Check status
git status

# Create feature branch
git checkout -b feature/your-feature

# Push changes
git push origin main
```

---

## Team Notes

- **Testing:** All PRs should have passing tests before merge
- **Commits:** Use conventional commit messages
- **Code Style:** Run linters before committing
- **Documentation:** Update this file when adding major features

---

*Generated with Claude Code - December 18, 2024*
