# MyApp - User Authentication

Add OAuth-based user authentication to the application.

---

## Summary

This plan implements a complete authentication system with Google and GitHub OAuth providers. Users will be able to sign in, sign out, and have their sessions persisted securely.

---

## User Stories

### Backend Stories

#### US-001: Add User Model
**Repository:** `backend`
**Description:** As a developer, I need a User model to store authenticated user information.

**Acceptance Criteria:**
- [ ] User model with fields: id, email, name, provider, provider_id, created_at
- [ ] Alembic migration created and tested
- [ ] Tests pass (pytest)

---

#### US-002: Add OAuth Configuration
**Repository:** `backend`
**Description:** As a developer, I need OAuth configuration for Google and GitHub providers.

**Acceptance Criteria:**
- [ ] Environment variables for GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- [ ] Environment variables for GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
- [ ] OAuth configuration module created
- [ ] Tests pass (pytest)

---

#### US-003: Add Auth Endpoints
**Repository:** `backend`
**Description:** As a user, I want API endpoints to authenticate via OAuth.

**Acceptance Criteria:**
- [ ] GET /auth/google - Redirects to Google OAuth
- [ ] GET /auth/google/callback - Handles Google callback
- [ ] GET /auth/github - Redirects to GitHub OAuth
- [ ] GET /auth/github/callback - Handles GitHub callback
- [ ] POST /auth/logout - Ends session
- [ ] GET /auth/me - Returns current user
- [ ] Tests pass (pytest)

---

### Frontend Stories

#### US-004: Add Login Page
**Repository:** `frontend`
**Description:** As a user, I want a login page with OAuth buttons.

**Acceptance Criteria:**
- [ ] Login page at /login route
- [ ] "Sign in with Google" button
- [ ] "Sign in with GitHub" button
- [ ] Loading state while authenticating
- [ ] Build passes (npm run build)
- [ ] Verify in browser

---

#### US-005: Add Auth Context
**Repository:** `frontend`
**Description:** As a developer, I need React context to manage auth state.

**Acceptance Criteria:**
- [ ] AuthContext with user state
- [ ] useAuth hook for components
- [ ] Automatic session check on mount
- [ ] Build passes (npm run build)
- [ ] Verify in browser

---

#### US-006: Add Protected Routes
**Repository:** `frontend`
**Description:** As a user, I should be redirected to login if not authenticated.

**Acceptance Criteria:**
- [ ] ProtectedRoute wrapper component
- [ ] Redirects to /login if not authenticated
- [ ] Shows loading while checking auth
- [ ] Build passes (npm run build)
- [ ] Verify in browser

---

## Technical Considerations

- Use httpOnly cookies for session management
- JWT tokens for API authentication
- Refresh token rotation for security
- CORS configuration for frontend domain

---

## Open Questions

- Should we support email/password in addition to OAuth?
- What is the session expiration policy?
