# Secure Members Area — Implementation Plan

## 1. Executive Summary

The Manchester LMC website is an Eleventy v3 static site deployed on Netlify with Decap CMS. It has a fully designed members area page (`/members/`) with login/register forms and an auth-gated vacancy posting form, but **no backend authentication exists** — forms are non-functional HTML. This plan proposes adding a secure members area using **Supabase** (Auth + Postgres + Row-Level Security) as the backend, with **Netlify Functions** as a lightweight API layer. This approach keeps the static-site architecture intact, provides UK/EU data residency, handles personal data with privacy by design, and stays within free/low-cost tiers. Netlify Identity — already loaded for CMS admin — is deliberately kept separate from member auth to maintain a clear security boundary between content editors and subscribers.

## 2. Repo Snapshot

| Aspect | Finding |
|---|---|
| **Stack** | Eleventy v3 (ESM), Nunjucks templates, plain CSS, vanilla JS |
| **Runtime** | Node 20 (per `netlify.toml`) |
| **Frontend framework** | None — vanilla JS IIFEs in `main.js` |
| **Hosting** | Netlify (static site + Decap CMS via git-gateway) |
| **Current auth** | Netlify Identity widget loaded in `base.njk` for CMS admin only; no member auth |
| **Data layer** | None — no database, no ORM, no migrations |
| **CMS** | Decap CMS (`src/admin/`) with git-gateway backend, editorial workflow |
| **Existing members routes** | `/members/` — login/register tab UI, authenticated content placeholder (hidden `#member-content` div), logout button |
| **Existing auth gates** | `/vacancies/` — `#vacancy-auth-gate` div with hardcoded `isAuthenticated = false` |
| **Forms backend** | Vacancy form points to `formspree.io/f/placeholder` — not wired |
| **Password reset** | "Forgotten your password?" link exists but points to `#` |
| **Existing session/token code** | None |
| **Environment config** | No `.env`, no `.env.example` |
| **Lockfile** | Not present (`package-lock.json` absent from repo) |

### Gaps & Assumptions

| # | Gap / Assumption | Status |
|---|---|---|
| A1 | **No backend exists.** All auth, session, and data logic must be built from scratch. | Confirmed |
| A2 | Members are primarily GPs and practice staff in Manchester (~400 GPs, 87 practices). Assume **< 1,000 total users** for sizing. | Assumption |
| A3 | "Practice staff at member practices" are registered manually by LMC admin (per FAQ). Locum/portfolio GPs self-register with payment. | Confirmed from UI |
| A4 | Member-only content currently comprises: agenda papers (PDFs), meeting minutes (PDFs), open forum access, subscriber briefings. | Confirmed from UI |
| A5 | Payment integration (£100/year subscription) is out of scope for auth — handled via emailed payment link per FAQ. Account activated manually after payment. | Assumption — **confirm** |
| A6 | No existing `package-lock.json`. Will generate one. | Confirmed |
| A7 | The site will remain on Netlify. | Assumption — **confirm** |

## 3. Requirements & Scope

### Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| F1 | **Login** — email + password, with "remember me" | Must |
| F2 | **Registration** — locum/portfolio GPs self-register; pending until admin-approved after payment | Must |
| F3 | **Email verification** — verify email before account is usable | Must |
| F4 | **Password reset** — "forgotten password" flow with time-bounded single-use token | Must |
| F5 | **Logout** — clear session, redirect to `/members/` | Must |
| F6 | **Protected content** — show `#member-content` div only to authenticated members; gate vacancy form | Must |
| F7 | **Profile management** — view/update name, email, password | Should |
| F8 | **Admin dashboard** — manage members (approve, suspend, list); separate from Decap CMS | Should |
| F9 | **Role assignment** — admin can assign roles (member, practice-admin, lmc-admin) | Should |
| F10 | **MFA (TOTP/WebAuthn)** — optional for members, mandatory for admins | Could (M7) |
| F11 | **Open Forum** — threaded discussion space for members | Could (future) |

### Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Security** | OWASP ASVS Level 2+; all controls detailed in §5 |
| **Privacy** | UK GDPR compliant; data minimisation; EU/UK data residency; retention & deletion policy |
| **Performance** | Auth flows < 2s; static pages unaffected (CDN-served) |
| **Accessibility** | WCAG 2.1 AA; existing forms already use labels and ARIA |
| **Observability** | Audit log for security events; error tracking |
| **Maintainability** | Minimal dependencies; documented; reproducible builds |

## 4. Architecture Options

### 4.1 Auth Model

| Option | Pros | Cons | Recommendation |
|---|---|---|---|
| **A. Supabase Auth** (managed, OIDC-based) | Free tier (50k MAU); email/password + magic link + social login; built-in email verification, password reset; JWT-based with RLS; EU region (Frankfurt); client SDK | External dependency; need to learn Supabase; email sending limits on free tier (4/hr → use custom SMTP) | **Recommended** |
| **B. Netlify Identity** (already loaded) | Already in the codebase; zero new dependencies; 1,000 free users | Limited customisation; no EU data residency guarantee; roles are basic; MFA only on paid plan; mixing CMS auth with member auth is a security risk | Not recommended for member auth |
| **C. Custom auth (Netlify Functions + DB)** | Full control; no external auth dependency | Significant build effort; must implement password hashing, token management, email verification manually; higher risk of security flaws | Not recommended unless specific constraints require it |
| **D. Auth0 / Clerk / WorkOS** | Polished, feature-rich; good security posture | Cost at scale; another vendor; EU residency varies | Viable alternative |

**Decision: Option A — Supabase Auth**, keeping Netlify Identity solely for CMS admin access.

### 4.2 Session Strategy

| Option | Pros | Cons | Recommendation |
|---|---|---|---|
| **Supabase JWT (access + refresh tokens) in httpOnly cookies** | Supabase issues JWTs natively; short-lived access (15 min) + refresh token rotation; RLS policies use JWT claims | Requires a thin Netlify Function proxy to set httpOnly cookies (Supabase JS SDK stores tokens in localStorage by default) | **Recommended** |
| **Server-side sessions via Netlify Functions + KV/DB** | Traditional session model; no client-side tokens | Extra infrastructure; Netlify has no native session store; adds latency | Over-engineered for this scale |

**Decision: Supabase JWTs stored in httpOnly, Secure, SameSite=Strict cookies**, set by Netlify Functions acting as auth proxy endpoints. The Supabase JS client SDK is **not** used for auth on the client side — all auth API calls go through Netlify Functions to keep tokens out of the browser.

### 4.3 Authorization

**RBAC model with three roles:**

| Role | Permissions |
|---|---|
| `member` | View protected content, download agenda/minutes PDFs, access open forum, post vacancies |
| `practice_admin` | All member permissions + manage practice staff accounts |
| `lmc_admin` | All permissions + approve registrations, suspend/delete accounts, assign roles, view audit log |

**Where checks live:**
- **Netlify Functions** (API layer) — validate JWT, check role claims on every request; this is the security boundary
- **Supabase RLS** — row-level policies on database tables as defence in depth
- **Client-side JS** — UI-only gating (show/hide elements); never trusted for security

### 4.4 Data Model

```
users (Supabase auth.users — managed)
├── id            UUID PK
├── email         TEXT UNIQUE
├── encrypted_password  (managed by Supabase)
├── email_confirmed_at  TIMESTAMPTZ
├── created_at    TIMESTAMPTZ
└── updated_at    TIMESTAMPTZ

profiles (public schema)
├── id            UUID PK FK → auth.users.id
├── first_name    TEXT NOT NULL
├── last_name     TEXT NOT NULL
├── gmc_number    TEXT (nullable; only for locum/portfolio GPs)
├── role_type     TEXT NOT NULL (locum_gp | portfolio_gp | practice_staff | gp_partner | salaried_gp | other)
├── practice_name TEXT (nullable)
├── status        TEXT NOT NULL DEFAULT 'pending' (pending | active | suspended)
├── role          TEXT NOT NULL DEFAULT 'member' (member | practice_admin | lmc_admin)
├── created_at    TIMESTAMPTZ DEFAULT now()
└── updated_at    TIMESTAMPTZ DEFAULT now()

audit_log (public schema)
├── id            BIGSERIAL PK
├── user_id       UUID FK → auth.users.id (nullable — some events are system-level)
├── action        TEXT NOT NULL (login | logout | login_failed | password_reset_request | password_reset_complete | profile_update | role_change | account_approved | account_suspended)
├── ip_address    INET (hashed or truncated for privacy)
├── metadata      JSONB (minimal; never store passwords or tokens)
├── created_at    TIMESTAMPTZ DEFAULT now()
```

**Notes:**
- No separate roles/permissions tables needed at this scale — `role` column on `profiles` suffices
- Supabase manages `auth.users`, password hashing (bcrypt via GoTrue), email verification, and password reset tokens
- `profiles` table created via migration with RLS enabled
- `audit_log` is append-only; members can read only their own entries; admins can read all

## 5. Security Design

### 5.1 Threat Model (STRIDE)

| Threat | Category | Target | Mitigation |
|---|---|---|---|
| Credential stuffing / brute force | Spoofing | Login endpoint | Rate limiting (§5.4), account lockout after 5 failures, optional CAPTCHA |
| Session hijacking | Spoofing | JWT cookies | httpOnly + Secure + SameSite=Strict; short-lived access tokens (15 min) |
| Privilege escalation | Tampering | Role claims | Server-side role check in Functions; RLS in Supabase; never trust client |
| User enumeration | Information Disclosure | Login/register/reset | Generic error messages ("If an account exists…") on all auth responses |
| XSS | Tampering | Client-side JS | CSP (§5.4); Nunjucks auto-escaping; no `| safe` on user input; no inline event handlers |
| CSRF | Tampering | State-changing endpoints | SameSite=Strict cookies; CSRF token on forms; origin header validation in Functions |
| SQL injection | Tampering | Database | Supabase client uses parameterised queries; no raw SQL in Functions |
| IDOR | Tampering | Profile/resource endpoints | RLS policies; user can only access own profile; admin functions validate role |
| Data breach at rest | Information Disclosure | Database | Supabase encrypts at rest (AES-256); minimise stored PII |
| Man-in-the-middle | Information Disclosure | Data in transit | HTTPS enforced (Netlify provides TLS); HSTS header |
| Admin account compromise | Elevation of Privilege | Admin endpoints | MFA required for admins (M7); audit logging |

### 5.2 Controls Mapping

| Control | Implementation |
|---|---|
| **Password hashing** | Supabase GoTrue uses bcrypt (cost 10); Argon2id not configurable in Supabase — bcrypt is acceptable per spec |
| **Password policy** | Minimum 8 characters enforced client-side and server-side; Supabase config: `min_password_length: 8` |
| **Email verification** | Supabase `confirm_email: true`; user cannot log in until email is confirmed |
| **Password reset tokens** | Supabase-managed; single-use, 1-hour expiry; generic response to prevent enumeration |
| **CSRF** | SameSite=Strict cookies + custom `X-Requested-With` header check in Functions |
| **XSS prevention** | CSP (below); Nunjucks auto-escaping; no user-generated HTML rendered unescaped |
| **Secure cookies** | Set by Netlify Functions: `Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=900` (access), `Max-Age=604800` (refresh) |

### 5.3 Secrets Management

| Environment | Approach |
|---|---|
| **Local dev** | `.env` file (git-ignored); loaded by Netlify CLI (`netlify dev`) |
| **Netlify (prod/preview)** | Netlify environment variables (encrypted at rest); scoped to production/deploy-preview contexts |
| **Supabase** | Service role key stored only in Netlify env vars; never exposed to client; anon key used client-side (safe — RLS enforces access) |

**Secrets inventory:**

| Variable | Purpose | Exposure |
|---|---|---|
| `SUPABASE_URL` | Supabase project URL | Client-safe (anon access) |
| `SUPABASE_ANON_KEY` | Public anonymous key | Client-safe (RLS enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged server key | Server-only (Functions) |
| `SESSION_SECRET` | Cookie signing key | Server-only (Functions) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Custom email for Supabase | Supabase dashboard only |

### 5.4 Secure Defaults

**Secure headers** (set via `netlify.toml` `[[headers]]`):

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Strict-Transport-Security = "max-age=63072000; includeSubDomains; preload"
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=(), payment=()"
    Content-Security-Policy-Report-Only = "default-src 'self'; script-src 'self' https://identity.netlify.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
```

**Rate limiting:**
- Netlify Functions: use `@netlify/functions` rate limiting or a lightweight in-memory counter (acceptable at < 1k users)
- Login: max 5 attempts per IP per 15 min; then 429 response
- Password reset: max 3 requests per email per hour
- Registration: max 3 per IP per hour
- After threshold: present hCaptcha (privacy-friendly, free tier)

**Account lockout:**
- After 5 consecutive failed logins: 15-minute lockout on the account (tracked in `profiles.lockout_until`)
- Exponential backoff: 15 min → 30 min → 1 hr
- Admin can unlock manually

### 5.5 Data Retention & Deletion

| Data | Retention | Deletion |
|---|---|---|
| User profile | Active while account is active; deleted 30 days after account closure request | User can request deletion; admin marks as `deleted`; cron purges after 30 days |
| Audit log | 2 years | Auto-purge entries older than 2 years; anonymise `user_id` on purge |
| Session tokens | Access: 15 min; Refresh: 7 days | Automatically expired; revoked on logout |
| Password reset tokens | 1 hour | Single-use; expired tokens purged daily |

## 6. Implementation Plan & Milestones

### M1: Foundations (Week 1)

| Task | Detail | Acceptance Criteria |
|---|---|---|
| Generate `package-lock.json` | `npm install` to create lockfile | Lockfile committed |
| Add secure headers to `netlify.toml` | HSTS, CSP (report-only), X-Content-Type-Options, etc. | Headers verified via `curl -I` |
| Install Supabase JS client | `npm install @supabase/supabase-js` | In `package.json` |
| Create `netlify/functions/` directory | API layer scaffold | Directory exists |
| Create auth proxy functions (stubs) | `auth-login.mjs`, `auth-register.mjs`, `auth-logout.mjs`, `auth-reset-password.mjs`, `auth-refresh.mjs` | Functions return 501 |
| Wire existing forms to function endpoints | Update form `action` attributes / JS `fetch` calls | Forms POST to `/.netlify/functions/auth-*` |
| Add `.env.example` | All env var names, no values | Committed |
| Update `.gitignore` | Add `.env`, `.netlify/` | Committed |

### M2: Authentication & Sessions (Weeks 2–3)

| Task | Detail | Acceptance Criteria |
|---|---|---|
| Set up Supabase project | Create project (EU region — Frankfurt); enable email auth; configure email templates; set password policy | Project running; email verification enabled |
| Create `profiles` table + RLS | Migration SQL; RLS policies: users read/update own row; admins read all | Migration applied; RLS verified |
| Implement `auth-register` function | Validate input; call `supabase.auth.signUp()`; create `profiles` row (status: pending); set cookie; return generic response | Registration works; email sent; status is `pending` |
| Implement `auth-login` function | Validate input; call `supabase.auth.signInWithPassword()`; check `profiles.status === 'active'`; set httpOnly cookies; log event | Login works for active users; pending/suspended users rejected; cookies set correctly |
| Implement `auth-logout` function | Call `supabase.auth.signOut()`; clear cookies; log event | Session cleared; redirect to `/members/` |
| Implement `auth-refresh` function | Read refresh token from cookie; call `supabase.auth.refreshSession()`; set new cookies | Silent token refresh works |
| Client-side JS: auth state check | On page load, call `/.netlify/functions/auth-status`; show/hide `#member-content` vs login form | Authenticated users see content; unauthenticated see login |
| Update vacancy auth gate | Replace hardcoded `isAuthenticated = false` with real auth check | Vacancy form visible only to authenticated members |

### M3: Account Management (Week 4)

| Task | Detail | Acceptance Criteria |
|---|---|---|
| Profile page | New page `/members/profile/` or section within `/members/` | Renders profile data |
| Profile update function | `auth-profile-update.mjs` — validate input, update `profiles` row, log event | Name/email update works; validates input |
| Password change function | `auth-change-password.mjs` — requires current password; calls `supabase.auth.updateUser()` | Password changed; old sessions invalidated |

### M4: Password Reset Flow (Week 4–5)

| Task | Detail | Acceptance Criteria |
|---|---|---|
| Implement `auth-reset-request` function | Call `supabase.auth.resetPasswordForEmail()`; always return generic "If an account exists…" message; rate limit | No user enumeration; email sent if account exists |
| Implement `auth-reset-confirm` function | Verify token via Supabase; set new password; invalidate token; log event | Single-use token; password updated; user redirected to login |
| UI: password reset page | `/members/reset-password/` with token input and new password form | Accessible from "Forgotten your password?" link |

### M5: Authorization & Admin (Weeks 5–6)

| Task | Detail | Acceptance Criteria |
|---|---|---|
| Role middleware in Functions | Extract role from JWT; reject unauthorised access | Non-admin users get 403 on admin endpoints |
| Admin dashboard page | `/members/admin/` — list pending registrations, approve/suspend users, view audit log | Only `lmc_admin` can access |
| Admin functions | `admin-approve.mjs`, `admin-suspend.mjs`, `admin-list-users.mjs`, `admin-audit-log.mjs` | CRUD works; authorisation enforced; events logged |
| RLS policies for admin | Admin can read all profiles, update status/role | Verified via Supabase SQL |

### M6: Hardening (Week 6–7)

| Task | Detail | Acceptance Criteria |
|---|---|---|
| Rate limiting | Implement per-IP and per-account counters in Functions (using Supabase table or Netlify Blobs) | 429 returned after threshold |
| CAPTCHA after threshold | Add hCaptcha to login/register after rate limit approached | CAPTCHA displayed; verified server-side |
| Audit logging | All security events written to `audit_log` table; IP hashed with HMAC | Events recorded; log queryable by admin |
| CSP enforcement | Move CSP from `report-only` to enforced; address any violations | No console violations on core flows |
| Dependency audit | `npm audit`; address findings | No critical/high vulnerabilities |
| Cookie review | Verify all cookie flags in production | `Secure`, `HttpOnly`, `SameSite=Strict` confirmed |

### M7: Optional MFA (Week 8+)

| Task | Detail | Acceptance Criteria |
|---|---|---|
| TOTP setup | Supabase supports TOTP via `supabase.auth.mfa.enroll()` | Members can enable TOTP |
| TOTP verification on login | Challenge-response flow after password verification | Login requires TOTP code if enabled |
| Admin MFA enforcement | `lmc_admin` role requires MFA; cannot access admin pages without it | Enforced |
| Device/session management | List active sessions; revoke individual sessions | User can see and revoke sessions |

### M8: Testing & Verification (Ongoing, focused in Week 7–8)

See §7 below.

### Database Migration Strategy

- Migrations stored in `supabase/migrations/` directory (SQL files, timestamped)
- Applied via Supabase CLI (`supabase db push`) or dashboard
- Rollback: each migration has a corresponding `down` file; Supabase CLI supports `supabase db reset`
- Seed data: `supabase/seed.sql` with a test admin user (dev only)

## 7. Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| **Unit** | Node test runner (`node --test`) or Vitest | Auth utility functions, input validators, cookie helpers, role checks |
| **Integration** | Vitest + `undici` (or `supertest` against local Functions) | Each Netlify Function endpoint: happy path, validation errors, auth failures, rate limits |
| **E2E** | Playwright | Full flows: register → verify email → login → view protected content → logout; password reset; admin approval |
| **Security — SCA** | `npm audit`, Snyk (free tier) | Dependency vulnerabilities |
| **Security — SAST** | ESLint security plugin (`eslint-plugin-security`) | Common JS security anti-patterns |
| **Security — DAST** | OWASP ZAP (baseline scan against staging) | XSS, injection, misconfiguration |
| **Security — Headers** | Mozilla Observatory, securityheaders.com | Header configuration validation |
| **Manual** | Checklist walkthrough | Cookie flags, CSRF, enumeration resistance, error messages |

## 8. Deployment Options

### Option 1: Netlify + Supabase (Recommended)

| Aspect | Detail |
|---|---|
| **Static site** | Netlify CDN (existing setup) |
| **API layer** | Netlify Functions (Node 20, included in free tier — 125k invocations/month) |
| **Auth + DB** | Supabase free tier: 50k MAU, 500 MB Postgres, 2 GB bandwidth |
| **Data residency** | Supabase EU region (Frankfurt); Netlify CDN is global but origin Functions run in US — upgrade to Netlify Pro ($19/mo) for regional Functions, or accept latency |
| **Secrets** | Netlify environment variables (encrypted) |
| **Migrations** | Supabase CLI from local or CI |
| **HTTPS** | Automatic via Netlify; custom domain supported |
| **Cost** | **$0** (both free tiers) → ~$25/mo if scaling to Pro |

| Pros | Cons |
|---|---|
| Minimal change to existing setup | Supabase free tier has limits (email 4/hr without custom SMTP) |
| Strong free tier for both services | Netlify Functions cold starts (~200ms) |
| Supabase RLS provides defence in depth | Two vendors to manage |
| EU data residency for DB | Netlify Functions default to US region |

### Option 2: Cloudflare Pages + Workers + D1

| Aspect | Detail |
|---|---|
| **Static site** | Cloudflare Pages (free) |
| **API layer** | Cloudflare Workers (free: 100k requests/day) |
| **Auth** | Custom auth in Workers or `@auth/core` library |
| **DB** | D1 (SQLite-based, free: 5 GB) |
| **Data residency** | EU-only processing available via Cloudflare Data Localisation |
| **Secrets** | Workers Secrets (encrypted) |
| **Cost** | **$0** (free tier) → $5/mo Workers Paid |

| Pros | Cons |
|---|---|
| Zero cold starts (edge execution) | Must build auth from scratch or use `@auth/core` |
| Excellent performance globally | D1 is relatively new (GA but less mature than Postgres) |
| Strong free tier | Migration from Netlify required |
| EU data localisation available | No managed auth — more code to maintain |

### Option 3: Render (Node.js Service + Postgres)

| Aspect | Detail |
|---|---|
| **Hosting** | Render Web Service (free: 750 hrs/mo; spins down on idle) |
| **API** | Express.js or Fastify running as a persistent service |
| **Auth** | Custom with Passport.js or `better-auth` library |
| **DB** | Render Postgres (free: 256 MB, 90-day limit; Starter: $7/mo) |
| **Data residency** | Frankfurt region available |
| **Secrets** | Render environment groups (encrypted) |
| **Cost** | **$0–7/mo** |

| Pros | Cons |
|---|---|
| Traditional server model; full control | Requires rewriting build/deploy pipeline |
| Persistent process — no cold starts | Free tier spins down (30s+ cold start) |
| Mature Postgres | Must maintain a server process |
| EU region available | More infrastructure to manage |

### Option 4: Azure Static Web Apps + Functions + Cosmos DB / Postgres

| Aspect | Detail |
|---|---|
| **Static site** | Azure Static Web Apps (free tier) |
| **API layer** | Azure Functions (integrated; free: 1M requests/mo) |
| **Auth** | Azure AD B2C or custom |
| **DB** | Azure Database for PostgreSQL Flexible (starts ~$13/mo) or Cosmos DB |
| **Data residency** | UK South / UK West regions |
| **Secrets** | Azure Key Vault |
| **Cost** | **$13–40/mo** |

| Pros | Cons |
|---|---|
| UK data residency (strongest compliance posture) | Higher cost |
| Enterprise-grade secrets management (Key Vault) | Steeper learning curve |
| Azure AD B2C is a full identity platform | Over-engineered for < 1k users |
| Excellent monitoring (Application Insights) | Migration from Netlify required |

### Recommendation

**Option 1: Netlify + Supabase** — it preserves the existing deployment pipeline, adds auth with minimal new infrastructure, stays free at current scale, and provides EU data residency for the database. Configure custom SMTP (e.g., Postmark, Resend — both have free tiers) in Supabase to avoid the 4/hr email limit.

## 9. Environment & Secrets

### `.env.example`

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Session
SESSION_SECRET=generate-a-random-64-char-hex-string

# hCaptcha (rate limit CAPTCHA)
HCAPTCHA_SITE_KEY=your-site-key
HCAPTCHA_SECRET_KEY=your-secret-key

# SMTP (configured in Supabase dashboard, not in app code)
# SMTP_HOST=smtp.postmarkapp.com
# SMTP_PORT=587
# SMTP_USER=your-api-token
# SMTP_PASS=your-api-token
```

### `.gitignore` additions

```
.env
.env.local
.netlify/
supabase/.temp/
```

### Secrets rotation guidance

| Secret | Rotation frequency | Method |
|---|---|---|
| `SESSION_SECRET` | 90 days | Generate new value; deploy; old sessions expire naturally (7-day max refresh) |
| `SUPABASE_SERVICE_ROLE_KEY` | On suspected compromise only | Regenerate in Supabase dashboard; update Netlify env vars; redeploy |
| `HCAPTCHA_SECRET_KEY` | Annually | Regenerate in hCaptcha dashboard; update env vars |
| SMTP credentials | Per provider policy | Rotate in SMTP provider; update Supabase dashboard |

## 10. Operational Runbook

### Deploy

1. `git push origin main` → Netlify auto-deploys
2. For Supabase migrations: `npx supabase db push --linked`
3. Verify: visit `/members/`, attempt login flow

### Migrations

```bash
# Create a new migration
npx supabase migration new add_profiles_table

# Apply to remote
npx supabase db push --linked

# Rollback (manual)
# Write and apply a reverse migration
npx supabase migration new rollback_profiles_table
```

### Seed (dev only)

```bash
npx supabase db seed --linked
```

### Health check

- Visit `/.netlify/functions/auth-status` — should return `{ "authenticated": false }` or `{ "authenticated": true, "role": "member" }`
- Check Supabase dashboard → Auth → Users for user count
- Check Netlify Functions log for errors

### Rollback

1. **Code**: Netlify supports instant rollback to any previous deploy via dashboard or `netlify rollback`
2. **Database**: Apply reverse migration; Supabase supports point-in-time recovery on Pro plan ($25/mo)

### Monitoring & Alerts

| What | Tool | Setup |
|---|---|---|
| Function errors | Netlify Functions log | Review in dashboard; set up Netlify notifications for deploy failures |
| Auth failures | `audit_log` table | Admin dashboard query; optional: Supabase webhook → email on threshold |
| Uptime | Netlify Analytics (free) or UptimeRobot (free) | Monitor `/` and `/.netlify/functions/auth-status` |
| Dependency vulns | `npm audit` in CI (GitHub Actions) | Fail build on critical |

### Backup

- **Supabase free tier**: daily backups retained 7 days (automatic)
- **Manual**: `npx supabase db dump -f backup.sql --linked` (run weekly via cron or CI)
- **Restore**: `npx supabase db restore -f backup.sql --linked`

## 11. Acceptance Criteria & Security Checklist

- [ ] No tokens or session data in `localStorage` or `sessionStorage`
- [ ] Auth cookies set with `Secure`, `HttpOnly`, `SameSite=Strict`
- [ ] Access tokens expire within 15 minutes
- [ ] Refresh tokens rotate on use; max lifetime 7 days
- [ ] All auth endpoints validate input server-side (type, length, format)
- [ ] Login/register/reset responses are generic (no user enumeration)
- [ ] Password reset tokens are single-use and expire within 1 hour
- [ ] Email verification required before login is permitted
- [ ] CSRF protection on all state-changing requests (SameSite + custom header)
- [ ] Rate limiting applied: login (5/15min), register (3/hr), reset (3/hr)
- [ ] Account lockout after 5 failed login attempts (15-min escalating)
- [ ] Passwords hashed with bcrypt (Supabase default); minimum 8 characters enforced
- [ ] HSTS header set with `max-age ≥ 63072000`
- [ ] CSP deployed (report-only initially, then enforced)
- [ ] `X-Content-Type-Options: nosniff` set
- [ ] `X-Frame-Options: DENY` set
- [ ] RLS enabled on all Supabase tables
- [ ] Service role key never exposed to client
- [ ] No secrets committed to repository
- [ ] `.env.example` committed (no values)
- [ ] `package-lock.json` committed
- [ ] `npm audit` shows no critical/high vulnerabilities
- [ ] Audit log records: login, logout, failed login, password reset request/complete, profile update, role change, account approval/suspension
- [ ] Audit log does not store passwords, tokens, or full IP addresses
- [ ] Admin endpoints require `lmc_admin` role
- [ ] Protected pages/content not visible without valid session
- [ ] All Nunjucks user-data output is auto-escaped (no unescaped `| safe` on user input)
- [ ] Password change requires current password
- [ ] Logout clears all cookies and revokes refresh token

## 12. Open Questions & Assumptions

| # | Question | Default Assumption |
|---|---|---|
| Q1 | **Confirm: site will remain on Netlify?** | Yes — plan is built around Netlify + Supabase |
| Q2 | **Confirm: payment is handled out-of-band (emailed link, manual activation)?** | Yes — no payment integration in this plan |
| Q3 | **Custom domain for member auth emails?** Will Supabase emails come from `noreply@manchesterlmc.co.uk` or a generic address? | Custom SMTP recommended — Postmark or Resend free tier with LMC domain |
| Q4 | **Is the Open Forum (threaded discussion) in scope for this plan, or a separate future initiative?** | Out of scope — listed as "Could" |
| Q5 | **Are there existing admin users who need pre-seeded accounts?** | Will seed one `lmc_admin` account for the Managing Director |
| Q6 | **Should practice staff bulk import be supported (CSV upload)?** | Not in initial scope; admin creates individually or via future import tool |
