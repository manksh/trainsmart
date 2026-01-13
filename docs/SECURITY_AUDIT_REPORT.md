# TrainSmart Security Audit Report

**Audit Date:** January 13, 2026
**Auditor:** Security Review
**Application:** TrainSmart - B2B Mental Performance Training Platform
**Scope:** Full-stack security review (Backend, Frontend, Infrastructure)

---

## Executive Summary

This security audit was conducted in preparation for rolling out TrainSmart to select users. The review covered authentication, authorization, API security, data protection, frontend security, and deployment configuration.

### Overall Assessment: **MEDIUM-HIGH RISK**

The application has a solid foundation with modern security practices (bcrypt password hashing, JWT tokens, role-based access control), but several critical and high-severity issues must be addressed before production deployment.

### Key Findings Summary

| Severity | Count | Description |
|----------|-------|-------------|
| Critical | 2 | Weak password policy, No rate limiting |
| High | 4 | Hardcoded secrets, Missing password reset, Overly permissive CORS, Testing endpoint in production |
| Medium | 5 | Long token expiry, JWT claims in localStorage, Missing security headers, etc. |
| Low | 3 | Debug mode defaults, Missing audit logging, etc. |

---

## Section 1: What the Application Does Well

### 1.1 Password Hashing (Strong)
The application uses bcrypt for password hashing via passlib, which is a secure choice.

**Location:** `/Users/mankshgupta/Desktop/trainsmart/backend/app/utils/security.py`
```python
# Lines 8-9
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
```

- Bcrypt with automatic salt generation
- Proper cost factor (default 12 rounds)
- Uses passlib for secure implementation

### 1.2 Role-Based Access Control (Good)
The application implements a multi-tier authorization system:
- SuperAdmin (platform-wide access)
- Admin (organization-level access)
- Athlete (user-level access)

**Location:** `/Users/mankshgupta/Desktop/trainsmart/backend/app/api/deps.py`
```python
# Lines 52-61
async def get_current_superadmin(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> User:
    """Ensure user is a superadmin."""
    if not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="SuperAdmin access required",
        )
    return current_user
```

### 1.3 Invite Code Security (Good)
Invite codes use cryptographically secure random generation:

**Location:** `/Users/mankshgupta/Desktop/trainsmart/backend/app/models/invite.py`
```python
# Lines 13-15
def generate_invite_code() -> str:
    """Generate a unique invite code."""
    return secrets.token_urlsafe(16)
```

- Uses `secrets.token_urlsafe()` (CSPRNG)
- 16 bytes provides 128 bits of entropy
- Codes expire after 7 days

### 1.4 Email Case Normalization (Good)
All emails are lowercased before storage, preventing duplicate account issues.

**Location:** `/Users/mankshgupta/Desktop/trainsmart/backend/app/services/auth.py`
```python
# Line 46
email=user_data.email.lower(),
```

### 1.5 Organization Membership Verification (Good)
Data access is properly scoped to organization membership:

**Location:** `/Users/mankshgupta/Desktop/trainsmart/backend/app/api/deps.py`
```python
# Lines 70-110 - verify_org_membership function
```

### 1.6 Pydantic Input Validation (Good)
Strong input validation using Pydantic schemas with field constraints:

**Location:** `/Users/mankshgupta/Desktop/trainsmart/backend/app/schemas/checkin.py`
```python
# Line 38
intensity: int = Field(..., ge=1, le=5)
```

---

## Section 2: Critical Vulnerabilities (P0 - Immediate Action Required)

### 2.1 CRITICAL: Weak Password Policy

**Severity:** Critical
**Location:** `/Users/mankshgupta/Desktop/trainsmart/frontend/src/app/(auth)/signup/page.tsx`

**Issue:** The only password requirement is minimum 8 characters. No complexity requirements.

```typescript
// Line 19
password: z.string().min(8, 'Password must be at least 8 characters'),
```

**Backend schema also lacks validation:**
**Location:** `/Users/mankshgupta/Desktop/trainsmart/backend/app/schemas/user.py`
```python
# Line 15
class UserCreate(UserBase):
    password: str  # No length or complexity validation
```

**Impact:** Users can create extremely weak passwords like "password" or "12345678", making accounts vulnerable to brute-force and credential stuffing attacks.

**Remediation:**
```python
# backend/app/schemas/user.py
import re
from pydantic import field_validator

class UserCreate(UserBase):
    password: str

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 12:
            raise ValueError('Password must be at least 12 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v
```

```typescript
// frontend/src/app/(auth)/signup/page.tsx
const signupSchema = z.object({
  // ... other fields
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
})
```

---

### 2.2 CRITICAL: No Rate Limiting on Authentication Endpoints

**Severity:** Critical
**Location:** `/Users/mankshgupta/Desktop/trainsmart/backend/app/main.py` and `/Users/mankshgupta/Desktop/trainsmart/backend/app/api/v1/auth.py`

**Issue:** No rate limiting is implemented on login or registration endpoints, allowing unlimited brute-force attempts.

**Impact:**
- Attackers can perform unlimited password guessing attacks
- No protection against credential stuffing
- Potential for denial-of-service via resource exhaustion

**Remediation:**
```python
# backend/app/main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# backend/app/api/v1/auth.py
from slowapi import limiter

@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")  # 5 attempts per minute per IP
async def login(request: Request, ...):
    ...
```

Add to requirements.txt:
```
slowapi==0.1.9
```

---

## Section 3: High Severity Issues (P1 - Fix Before Production)

### 3.1 HIGH: Hardcoded Default Secret Key

**Severity:** High
**Location:** `/Users/mankshgupta/Desktop/trainsmart/backend/app/config.py`

```python
# Line 11
secret_key: str = "dev-secret-key-change-in-production"
```

**Also in docker-compose.yml:**
```yaml
# Line 30
SECRET_KEY: ${SECRET_KEY:-dev-secret-key-change-in-production}
```

**Impact:** If SECRET_KEY environment variable is not set in production, the hardcoded key will be used. This would allow attackers to:
- Forge JWT tokens
- Impersonate any user
- Gain full access to the system

**Remediation:**
```python
# backend/app/config.py
class Settings(BaseSettings):
    secret_key: str  # Remove default - require explicit setting

    @field_validator('secret_key')
    @classmethod
    def validate_secret_key(cls, v):
        if v == "dev-secret-key-change-in-production":
            raise ValueError("SECRET_KEY must be changed from default in production")
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters")
        return v
```

---

### 3.2 HIGH: No Password Reset Functionality

**Severity:** High
**Location:** Application-wide

**Issue:** There is no password reset or forgot password functionality implemented.

**Impact:**
- Users who forget passwords are locked out
- No secure way to recover accounts
- Support burden for manual password resets
- May lead to insecure workarounds

**Remediation:** Implement a secure password reset flow:
1. Create `/auth/forgot-password` endpoint that generates a time-limited token
2. Send token via email (Resend is already configured)
3. Create `/auth/reset-password` endpoint to verify token and update password
4. Invalidate all existing sessions on password reset

---

### 3.3 HIGH: Testing Endpoint Exposed in Production

**Severity:** High
**Location:** `/Users/mankshgupta/Desktop/trainsmart/backend/app/api/v1/assessments.py`

```python
# Lines 218-238
@router.delete("/me/reset")
async def reset_my_assessment(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Reset/delete all assessment responses for the current user.
    NOTE: This is a testing endpoint - should be removed or restricted in production.
    """
```

**Impact:** Any authenticated user can delete all their assessment data, which may:
- Violate data retention requirements
- Allow gaming of the assessment system
- Cause data integrity issues

**Remediation:**
```python
from app.config import settings

@router.delete("/me/reset")
async def reset_my_assessment(...):
    if settings.environment != "development":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only available in development"
        )
    # ... rest of implementation
```

---

### 3.4 HIGH: Overly Permissive CORS Configuration

**Severity:** High
**Location:** `/Users/mankshgupta/Desktop/trainsmart/backend/app/main.py`

```python
# Lines 16-22
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Issue:** `allow_methods=["*"]` and `allow_headers=["*"]` are overly permissive.

**Impact:** Potential for exploitation via unexpected HTTP methods or headers.

**Remediation:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)
```

---

## Section 4: Medium Severity Issues (P2 - Fix Soon)

### 4.1 MEDIUM: Excessively Long JWT Token Expiry

**Severity:** Medium
**Location:** `/Users/mankshgupta/Desktop/trainsmart/backend/app/config.py`

```python
# Line 13
access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
```

**Impact:** Stolen tokens remain valid for 7 days, giving attackers extended access.

**Remediation:**
- Reduce access token expiry to 15-60 minutes
- Implement refresh token mechanism for session continuation
- Add token revocation capability

---

### 4.2 MEDIUM: JWT Token Stored in localStorage

**Severity:** Medium
**Location:** `/Users/mankshgupta/Desktop/trainsmart/frontend/src/hooks/useAuth.tsx`

```typescript
// Line 71
localStorage.setItem('token', response.access_token)
```

**Impact:** Tokens in localStorage are vulnerable to XSS attacks.

**Remediation:**
- Use httpOnly cookies for token storage
- Implement CSRF protection if using cookies
- Consider using a Backend-for-Frontend (BFF) pattern

---

### 4.3 MEDIUM: Missing Security Headers

**Severity:** Medium
**Location:** `/Users/mankshgupta/Desktop/trainsmart/backend/app/main.py`

**Issue:** No security headers are configured (CSP, X-Frame-Options, etc.)

**Remediation:**
```python
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware

# Add security headers middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response

# In production, add trusted host middleware
if settings.environment == "production":
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["yourdomain.com"])
    app.add_middleware(HTTPSRedirectMiddleware)
```

---

### 4.4 MEDIUM: SQL Echo Enabled in Debug Mode

**Severity:** Medium
**Location:** `/Users/mankshgupta/Desktop/trainsmart/backend/app/database.py`

```python
# Line 9
echo=settings.debug,
```

**Issue:** When debug=True (default), all SQL queries are logged, potentially exposing sensitive data.

**Remediation:** Never enable SQL echo in any environment except explicit local development.

---

### 4.5 MEDIUM: Sensitive Data in JWT Claims

**Severity:** Medium
**Location:** `/Users/mankshgupta/Desktop/trainsmart/backend/app/services/auth.py`

```python
# Lines 109-112
additional_claims = {
    "is_superadmin": user.is_superadmin,
    "organization_ids": org_ids,
}
```

**Impact:** JWT claims are visible to anyone who decodes the token (base64). While not secret, this exposes:
- User's admin status
- All organizations they belong to

**Remediation:** Keep JWT payload minimal (sub claim only), fetch additional data from database as needed.

---

## Section 5: Low Severity Issues (P3 - Address When Possible)

### 5.1 LOW: Debug Mode Enabled by Default

**Severity:** Low
**Location:** `/Users/mankshgupta/Desktop/trainsmart/backend/app/config.py`

```python
# Lines 16-17
environment: str = "development"
debug: bool = True
```

**Remediation:** Default to production-safe values:
```python
environment: str = "production"
debug: bool = False
```

---

### 5.2 LOW: Missing Audit Logging

**Severity:** Low
**Location:** Application-wide

**Issue:** No audit logging for security-relevant events (login, failed login, password changes, privilege changes).

**Remediation:** Implement structured audit logging for:
- Authentication events (success/failure)
- Authorization failures
- Data access by privileged users
- Administrative actions

---

### 5.3 LOW: Account Enumeration Possible

**Severity:** Low
**Location:** `/Users/mankshgupta/Desktop/trainsmart/backend/app/api/v1/auth.py`

```python
# Lines 62-67
existing_user = await auth_service.get_user_by_email(user_data.email)
if existing_user:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Email already registered",
    )
```

**Impact:** Attackers can determine which email addresses have accounts.

**Remediation:** Use consistent timing and generic messages for both existing and non-existing accounts.

---

## Section 6: Infrastructure & Deployment Review

### 6.1 Docker Security

**Good:**
- Frontend Dockerfile uses non-root user (nextjs:nodejs)
- Multi-stage builds minimize image size

**Needs Improvement:**
- Backend Dockerfile runs as root
- No security scanning in CI/CD

**Remediation for backend Dockerfile:**
```dockerfile
FROM python:3.11-slim

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# ... install dependencies ...

# Change ownership and switch user
RUN chown -R appuser:appuser /app
USER appuser

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT"]
```

---

### 6.2 CI/CD Security

**Good:**
- Workload Identity Federation (no service account keys)
- Separate test and deploy workflows

**Needs Improvement:**
- No dependency vulnerability scanning
- No container image scanning

**Remediation:** Add security scanning step:
```yaml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    scan-type: 'fs'
    ignore-unfixed: true
    severity: 'CRITICAL,HIGH'
```

---

### 6.3 Environment Variables

**Issue:** `.env` file contains placeholder secrets that should never be committed.

**Location:** `/Users/mankshgupta/Desktop/trainsmart/.env`
```
SECRET_KEY=your-secret-key-change-in-production
```

While `.env` is in `.gitignore`, git status shows it as untracked but present. Ensure production secrets are managed via GCP Secret Manager, not environment files.

---

## Section 7: Prioritized Remediation Roadmap

### Phase 1: Before User Rollout (P0 - Critical)

| Issue | Effort | Impact |
|-------|--------|--------|
| Implement strong password policy | 2 hours | Critical |
| Add rate limiting to auth endpoints | 4 hours | Critical |

### Phase 2: First Week (P1 - High)

| Issue | Effort | Impact |
|-------|--------|--------|
| Change hardcoded secret key handling | 1 hour | High |
| Remove/protect testing endpoint | 30 min | High |
| Implement password reset flow | 8 hours | High |
| Restrict CORS methods/headers | 30 min | High |

### Phase 3: First Month (P2 - Medium)

| Issue | Effort | Impact |
|-------|--------|--------|
| Reduce JWT expiry + add refresh tokens | 8 hours | Medium |
| Move to httpOnly cookies | 8 hours | Medium |
| Add security headers | 2 hours | Medium |
| Fix SQL echo in debug mode | 30 min | Medium |
| Minimize JWT claims | 2 hours | Medium |

### Phase 4: Ongoing (P3 - Low)

| Issue | Effort | Impact |
|-------|--------|--------|
| Default to production-safe config | 30 min | Low |
| Implement audit logging | 16 hours | Low |
| Fix account enumeration | 2 hours | Low |
| Add container security scanning | 4 hours | Low |
| Run backend as non-root | 1 hour | Low |

---

## Appendix A: Files Reviewed

### Backend
- `/backend/app/main.py` - Application entry, CORS config
- `/backend/app/config.py` - Settings and secrets
- `/backend/app/api/v1/auth.py` - Authentication endpoints
- `/backend/app/api/v1/users.py` - User endpoints
- `/backend/app/api/v1/invites.py` - Invite management
- `/backend/app/api/v1/assessments.py` - Assessment endpoints
- `/backend/app/api/v1/training_modules.py` - Training endpoints
- `/backend/app/api/v1/checkins.py` - Check-in endpoints
- `/backend/app/api/v1/journals.py` - Journal endpoints
- `/backend/app/api/v1/organizations.py` - Organization management
- `/backend/app/api/deps.py` - Authentication dependencies
- `/backend/app/services/auth.py` - Auth service layer
- `/backend/app/utils/security.py` - Password hashing, JWT
- `/backend/app/models/user.py` - User model
- `/backend/app/models/invite.py` - Invite model
- `/backend/app/schemas/user.py` - User validation schemas
- `/backend/app/schemas/checkin.py` - Check-in validation
- `/backend/app/database.py` - Database configuration
- `/backend/Dockerfile` - Container configuration

### Frontend
- `/frontend/src/app/(auth)/login/page.tsx` - Login page
- `/frontend/src/app/(auth)/signup/page.tsx` - Signup page
- `/frontend/src/hooks/useAuth.tsx` - Auth context/hooks
- `/frontend/src/lib/api.ts` - API client
- `/frontend/src/app/(dashboard)/layout.tsx` - Dashboard auth guard
- `/frontend/Dockerfile` - Container configuration
- `/frontend/next.config.js` - Next.js configuration

### Infrastructure
- `/docker-compose.yml` - Docker services
- `/.env.example` - Environment template
- `/.gitignore` - Git ignore rules
- `/.github/workflows/deploy.yml` - Deployment workflow
- `/.github/workflows/tests.yml` - Test workflow

---

## Appendix B: Testing Recommendations

Before production deployment, conduct:

1. **Penetration Testing** - Professional pentest focusing on:
   - Authentication bypass attempts
   - Authorization testing (IDOR, privilege escalation)
   - API security testing

2. **Dependency Scanning** - Run `pip audit` and `npm audit`

3. **Container Scanning** - Use Trivy or similar for image vulnerabilities

4. **Load Testing** - Verify rate limiting effectiveness under load

---

*Report prepared for TrainSmart security review. This document should be treated as confidential.*
