# TrainSmart Security Implementation Plan

**Created:** January 13, 2026
**Last Updated:** January 13, 2026
**Status:** Partially Implemented
**Contributors:** Security Reviewer, Product Manager, Senior Backend Architect, Staff Frontend Engineer

---

## Implementation Status Summary

| Item | Status | Notes |
|------|--------|-------|
| **1.1 Testing Endpoint** | ⏸️ DEFERRED | User decided to keep for now |
| **1.2 Secret Key Validation** | ✅ DONE | Rejects weak keys in production |
| **1.3 Rate Limiting** | ✅ DONE | Login 5/min, Register 3/min |
| **1.4 Password Reset** | ⏸️ DEFERRED | User to spec out later |
| **2.1 Password Policy** | ✅ DONE | 8-12 chars (user-specified) |
| **2.2 CORS Tightening** | ❌ TODO | Sprint 1 |
| **2.3 Security Headers** | ❌ TODO | Sprint 1 |
| **2.4 JWT Expiry** | ❌ TODO | Sprint 1 |

---

## Executive Summary

This plan addresses 14 security findings from the security audit. After cross-functional review, the team agreed on a phased approach that ensures critical protections before pilot launch while deferring lower-risk items to future sprints.

### Priority Summary

| Phase | Items | Total Effort | Target |
|-------|-------|--------------|--------|
| **Pre-Pilot (Critical)** | 4 fixes | ~8-12 hours | This week |
| **Sprint 1** | 4 fixes | ~4-6 hours | Next sprint |
| **Sprint 2+** | 6 fixes | ~20+ hours | Backlog |

---

## Phase 1: Pre-Pilot Blockers (MUST FIX)

These issues represent exploitable vulnerabilities that could lead to immediate compromise.

### 1.1 Remove Testing Endpoint (30 min) - ⏸️ DEFERRED

**Risk:** Data destruction vulnerability - any user can delete their assessment data
**Files:** `backend/app/api/v1/assessments.py`

**Status:** User decided to keep this endpoint for testing purposes during development.

**Original Implementation Plan:**
- Change `get_current_active_user` to `get_current_superadmin` on `/assessments/me/reset`
- Alternative: Add environment check to disable in production

**Tests:** Add test verifying regular users get 403 Forbidden

---

### 1.2 Secret Key Validation (1 hour) - ✅ COMPLETED

**Risk:** Known default key allows JWT forgery and complete authentication bypass
**Files:** `backend/app/config.py`

**Implementation (Completed):**
- Added Pydantic `@field_validator("secret_key")` that rejects weak/default keys in production
- Validates at application startup, fails fast with clear error message
- Required format: 32+ characters, not in WEAK_SECRET_KEYS list
- **Fix Applied:** Moved `environment` field before `secret_key` to ensure validator ordering works correctly

**Environment Variable:** Verify `SECRET_KEY` is properly set in GCP Cloud Run for PROD

---

### 1.3 Rate Limiting (2-4 hours) - ✅ COMPLETED

**Risk:** Unlimited brute-force attacks on authentication endpoints
**Files:** `backend/app/main.py`, `backend/app/api/v1/auth.py`, `requirements.txt`

**Implementation (Completed):**
- Added `slowapi==0.1.9` to requirements.txt
- Created rate limiter with Cloud Run-aware IP extraction
- **Security Fix Applied:** Uses RIGHTMOST IP from X-Forwarded-For header (cannot be spoofed by clients, added by Cloud Run load balancer)
- Applied limits:
  - `/auth/login`: 5 requests/minute per IP
  - `/auth/register`: 3 requests/minute per IP
  - `/auth/register/superadmin`: 1 request/minute per IP

**Frontend Integration (Completed):**
- Added `retryAfter` property to `ApiError` class in `frontend/src/lib/api.ts`
- Updated `/login` page with countdown timer when rate limited
- Shows progressive error messages after 3+ failed attempts
- Button disabled with countdown text when rate limited

---

### 1.4 Password Reset Flow (4-8 hours) - ⏸️ DEFERRED

**Risk:** Users locked out with no recovery path; creates support burden
**Files:** New model, schema, endpoints, migration, and frontend pages

**Status:** User decided to defer this feature to spec it out properly later.

**Original Implementation Plan:**
- New model: `PasswordResetToken` (token, user_id, expires_at, used_at)
- New endpoints: `POST /auth/forgot-password`, `POST /auth/reset-password`
- Migration: Create `password_reset_tokens` table
- Email: Use existing Resend integration for reset emails
- Security: Always return success (prevent email enumeration), 1-hour expiry, single-use tokens

**Frontend (Pending):**
- New page: `/forgot-password` - email entry form
- New page: `/reset-password?token=xxx` - new password form
- Modify: `/login` - add "Forgot password?" link

---

## Phase 2: Sprint 1 (HIGH PRIORITY)

### 2.1 Strengthen Password Policy (1 hour) - ✅ COMPLETED (Modified)

**Files:** `backend/app/schemas/user.py`, `frontend/src/app/(auth)/signup/page.tsx`

**Requirements (User-Specified - differs from original plan):**
- Minimum 8 characters
- Maximum 12 characters
- At least one letter (uppercase or lowercase)
- At least one digit
- At least one special character from: `!@#$%^&*()_+-=[]{};':"\\|,.<>/?`

**Implementation (Completed):**
- Added Pydantic `@field_validator("password")` in backend `UserCreate` schema
- **Security Fix Applied:** Synced special character regex between frontend and backend
- All test passwords updated to comply with 8-12 character policy

**Frontend UX (Completed):**
- Added `PasswordRequirementsChecklist` component with real-time validation
- Shows checkmarks (✓) for met requirements, X icons for unmet
- Requirements displayed as checklist, not error messages

---

### 2.2 Tighten CORS (30 min) - ❌ TODO

**Files:** `backend/app/main.py`

**Status:** Pending - Sprint 1

**Change from:**
```python
allow_methods=["*"]
allow_headers=["*"]
```

**Change to:**
```python
allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"]
```

---

### 2.3 Add Security Headers (2 hours) - ❌ TODO

**Status:** Pending - Sprint 1

**Backend:** `backend/app/main.py` - Add middleware for:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Content-Security-Policy: default-src 'none'; frame-ancestors 'none'
- Strict-Transport-Security (production only)

**Frontend:** `frontend/next.config.js` - Add headers config for:
- Same headers as backend
- CSP adapted for Next.js (allow inline scripts/styles for React)

---

### 2.4 Reduce JWT Expiry (2 hours) - ❌ TODO

**Status:** Pending - Sprint 1

**Files:** `backend/app/config.py`

**Change:** Reduce from 7 days to 24 hours

**Future (Sprint 2+):** Implement refresh token rotation with 15-minute access tokens

---

## Phase 3: Backlog (ACCEPTABLE TECHNICAL DEBT)

These items are real concerns but lower risk, acceptable for post-pilot:

| Issue | Effort | Notes |
|-------|--------|-------|
| JWT in localStorage | 8 hours | Requires backend cookie implementation |
| Sensitive data in JWT claims | 2 hours | Move to minimal claims |
| Debug mode default | 30 min | Ensure production config correct |
| Missing audit logging | 16 hours | Important for compliance |
| Account enumeration | 2 hours | Normalize login/register error messages |
| Backend runs as root | 1 hour | Update Dockerfile |
| Add CI/CD security scanning | 4 hours | Trivy, pip-audit, npm audit |

---

## Implementation Dependencies

### Sequence Requirements

```
1. Secret Key Validation (can deploy alone)
2. Testing Endpoint (can deploy alone)
3. Rate Limiting (can deploy alone)
4. Password Reset (depends on nothing, but large)
   └── Frontend rate limit handling (needs backend 429 responses)
5. Password Policy (can deploy alone)
   └── Frontend password requirements (needs backend validation)
```

### Parallel Work Streams

**Backend (can be done in parallel):**
- Items 1.1, 1.2 simultaneously (both ~1 hour)
- Item 1.3 after 1.1 and 1.2 deployed
- Item 1.4 can start independently

**Frontend (after backend endpoints exist):**
- Password reset pages (after 1.4 backend complete)
- Rate limit handling (after 1.3 backend complete)
- Password requirements (after 2.1 backend complete)

---

## Database Migrations

Only one new migration required:

**`password_reset_tokens` table:**
```sql
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY,
    token VARCHAR(64) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL
);
CREATE UNIQUE INDEX ix_password_reset_tokens_token ON password_reset_tokens(token);
```

---

## Environment Variables Checklist

**Verify in GCP Cloud Run (PROD):**
- [ ] `SECRET_KEY` - cryptographically random, 32+ chars
- [ ] `ENVIRONMENT=production`
- [ ] `DEBUG=False`
- [ ] `RESEND_API_KEY` - for password reset emails
- [ ] `FROM_EMAIL` - sender email address

---

## Test Coverage Requirements

**Backend Tests:**
- [ ] Testing endpoint returns 403 for non-superadmin (DEFERRED)
- [x] Secret key validation rejects defaults in production
- [x] Rate limiting returns 429 after threshold
- [ ] Password reset flow (request, validate, confirm) (DEFERRED)
- [x] Password policy rejects weak passwords
- [x] Test passwords updated to comply with 8-12 char policy

**Frontend Tests:**
- [x] PasswordRequirements component renders correctly
- [x] Rate limit countdown displays correctly
- [ ] Password reset pages handle all states (DEFERRED)

---

## Rollout Plan

### Day 1
- [ ] Deploy backend: secret key validation + testing endpoint fix
- [ ] Verify PROD still works

### Day 2
- [ ] Deploy backend: rate limiting
- [ ] Test rate limiting manually

### Day 3-4
- [ ] Deploy backend: password reset endpoints + migration
- [ ] Deploy frontend: forgot/reset password pages
- [ ] Deploy frontend: rate limit handling on login

### Day 5 (Sprint 1)
- [ ] Deploy: password policy (backend + frontend)
- [ ] Deploy: CORS tightening
- [ ] Deploy: security headers

---

## Risk Assessment

| Change | Risk Level | Mitigation |
|--------|------------|------------|
| Secret key validation | Medium | Test locally first, have key ready |
| Testing endpoint removal | Low | Was undocumented |
| Rate limiting | Medium | Start with generous limits, monitor |
| Password reset | Low | Additive feature |
| Password policy | Medium | Only affects new passwords |
| CORS tightening | Low | Using standard methods/headers |
| JWT expiry reduction | Medium | Users re-login more often |

---

## Success Criteria

**Pre-Pilot Complete When:**
- [x] No authentication endpoints accept unlimited requests (rate limiting implemented)
- [x] Application fails to start with default secret key in production
- [ ] Testing endpoint requires superadmin (DEFERRED - kept for now)
- [ ] Users can reset forgotten passwords (DEFERRED - to be specced)
- [x] Password policy enforces strong passwords (8-12 chars with letter, number, special)

---

## Team Assignments (Suggested)

| Task | Assignee | Estimated Hours |
|------|----------|-----------------|
| 1.1 Testing Endpoint | Backend | 0.5 |
| 1.2 Secret Key | Backend | 1 |
| 1.3 Rate Limiting | Backend | 3 |
| 1.4 Password Reset (Backend) | Backend | 5 |
| 1.4 Password Reset (Frontend) | Frontend | 4 |
| Rate Limit UI | Frontend | 2 |
| 2.1 Password Policy (Backend) | Backend | 1 |
| 2.1 Password Policy (Frontend) | Frontend | 2 |
| 2.2 CORS | Backend | 0.5 |
| 2.3 Security Headers (Backend) | Backend | 1 |
| 2.3 Security Headers (Frontend) | Frontend | 1 |
| 2.4 JWT Expiry | Backend | 0.5 |

**Total:** ~21 hours (split between backend and frontend)

---

## Approval

- [ ] Product Manager approval
- [ ] Engineering Lead approval
- [ ] Security sign-off

**Approved by:** ___________________ **Date:** _______________
