# Security Checks — Manchester LMC

Run these checks before deploying significant changes and periodically (suggested: quarterly).

---

## 1. Automated (run locally)

```bash
# Unit + integration tests
npm test

# Dependency vulnerability scan
npm audit

# Static security analysis of Netlify Functions
npm run lint:security
```

All three should complete with zero errors. `npm audit` and `npm run lint:security` should also report zero warnings.

---

## 2. Browser checks (requires a logged-in session on the live site)

**Cookie flags**

1. Log in at `/members/`
2. DevTools → Application → Cookies → `https://manchesterlmc.co.uk`
3. Verify both `sb_access_token` and `sb_refresh_token` have:

| Flag | Expected value |
|---|---|
| HttpOnly | ✓ |
| Secure | ✓ |
| SameSite | Strict |
| Path | / |

**Auth state across pages**

1. Log in at `/members/`
2. Navigate to `/about/`, `/news/`, `/guidance/`
3. Your first name should remain visible in the top-right nav on every page
4. Closing the browser tab and reopening should require login again

**Admin gate**

1. Log in as a non-admin account
2. Visit `/members/admin/` directly
3. Should redirect or show an access-denied message — never the admin dashboard

---

## 3. External scanners (run against the live site)

| Tool | URL | Target grade |
|---|---|---|
| Security Headers | `https://securityheaders.com/?q=manchesterlmc.co.uk` | A or A+ |
| Mozilla Observatory | `https://observatory.mozilla.org/analyze/manchesterlmc.co.uk` | A or above |

If the grade drops, check `netlify.toml` — the `Content-Security-Policy`, `Strict-Transport-Security`, and related headers are defined there.

---

## 4. Netlify Function logs

After any auth-related deployment, trigger a login and visit a non-members page, then check:

**Netlify dashboard → Logs → Function logs → filter by `auth-status`**

You should see:
```
[auth-status] has access_token: true has refresh_token: true
```

Any `getUser error` or `refreshSession error` lines indicate an authentication problem that needs investigation.

---

## 5. Periodic review checklist

| Task | Frequency |
|---|---|
| Rotate `SESSION_SECRET` in Netlify env vars | Every 90 days |
| Review `audit_log` table in Supabase for unusual patterns | Monthly |
| Check Supabase dashboard → Auth → Users for unexpected accounts | Monthly |
| Run `npm audit` and update vulnerable packages | After any `npm install` |
| Re-run external scanners after CSP or header changes | After each relevant deploy |
| Review Supabase project settings (email limits, auth config) | Quarterly |
