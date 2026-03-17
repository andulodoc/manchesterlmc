import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Supabase mock ──────────────────────────────────────────────────────────────
const mockSignIn = vi.fn();
const mockGetProfile = vi.fn();

vi.mock("../../netlify/functions/_shared/supabase.mjs", () => ({
  supabaseAnon: {
    auth: { signInWithPassword: mockSignIn },
  },
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: mockGetProfile,
        }),
      }),
    }),
  },
}));

vi.mock("../../netlify/functions/_shared/audit.mjs", () => ({
  logEvent: vi.fn(),
}));

vi.mock("../../netlify/functions/_shared/rate-limit.mjs", () => ({
  isRateLimited: vi.fn().mockResolvedValue(false),
  hashKey: (v) => v,
}));

// Import handler AFTER mocks are set up
const { handler } = await import("../../netlify/functions/auth-login.mjs");

// ── Helpers ────────────────────────────────────────────────────────────────────
function makeEvent(body = {}) {
  return {
    httpMethod: "POST",
    headers: { "x-forwarded-for": "1.2.3.4" },
    body: JSON.stringify(body),
  };
}

const VALID_SESSION = {
  access_token: "eyJ.access.token",
  refresh_token: "refresh-token",
};

const ACTIVE_PROFILE = {
  status: "active",
  role: "member",
  first_name: "Jane",
  last_name: "Smith",
  lockout_until: null,
};

// ── Tests ──────────────────────────────────────────────────────────────────────
describe("auth-login", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset rate limiter to default (not limited) between tests
    const { isRateLimited } = await import("../../netlify/functions/_shared/rate-limit.mjs");
    isRateLimited.mockResolvedValue(false);
  });

  it("rejects non-POST requests", async () => {
    const res = await handler({ httpMethod: "GET", headers: {}, body: "" });
    expect(res.statusCode).toBe(405);
  });

  it("returns 400 for missing email", async () => {
    const res = await handler(makeEvent({ password: "password123" }));
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for invalid email format", async () => {
    const res = await handler(makeEvent({ email: "notanemail", password: "password123" }));
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for missing password", async () => {
    const res = await handler(makeEvent({ email: "user@example.com" }));
    expect(res.statusCode).toBe(400);
  });

  it("returns 401 for wrong credentials", async () => {
    mockSignIn.mockResolvedValue({ data: { session: null, user: null }, error: { message: "Invalid credentials" } });
    const res = await handler(makeEvent({ email: "user@example.com", password: "wrongpass" }));
    expect(res.statusCode).toBe(401);
    // Must NOT reveal whether the account exists (enumeration resistance)
    // Forbidden patterns: "email not found", "no account with this email", "user does not exist"
    expect(JSON.parse(res.body).error).not.toMatch(/not found|no account|does not exist|not registered/i);
  });

  it("returns 403 for pending accounts", async () => {
    mockSignIn.mockResolvedValue({
      data: { session: VALID_SESSION, user: { id: "user-1" } },
      error: null,
    });
    mockGetProfile.mockResolvedValue({ data: { ...ACTIVE_PROFILE, status: "pending" }, error: null });

    const res = await handler(makeEvent({ email: "user@example.com", password: "correctpass" }));
    expect(res.statusCode).toBe(403);
  });

  it("returns 403 for suspended accounts", async () => {
    mockSignIn.mockResolvedValue({
      data: { session: VALID_SESSION, user: { id: "user-1" } },
      error: null,
    });
    mockGetProfile.mockResolvedValue({ data: { ...ACTIVE_PROFILE, status: "suspended" }, error: null });

    const res = await handler(makeEvent({ email: "user@example.com", password: "correctpass" }));
    expect(res.statusCode).toBe(403);
  });

  it("sets httpOnly cookies on successful login", async () => {
    mockSignIn.mockResolvedValue({
      data: { session: VALID_SESSION, user: { id: "user-1" } },
      error: null,
    });
    mockGetProfile.mockResolvedValue({ data: ACTIVE_PROFILE, error: null });

    const res = await handler(makeEvent({ email: "user@example.com", password: "correctpass" }));
    expect(res.statusCode).toBe(200);

    const cookies = res.multiValueHeaders["Set-Cookie"];
    expect(cookies).toHaveLength(2);

    const accessCookie = cookies.find((c) => c.startsWith("sb_access_token"));
    const refreshCookie = cookies.find((c) => c.startsWith("sb_refresh_token"));
    expect(accessCookie).toBeDefined();
    expect(refreshCookie).toBeDefined();

    // All cookies must have security flags
    [accessCookie, refreshCookie].forEach((cookie) => {
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("Secure");
      expect(cookie).toContain("SameSite=Strict");
    });
  });

  it("returns displayName and role on success", async () => {
    mockSignIn.mockResolvedValue({
      data: { session: VALID_SESSION, user: { id: "user-1" } },
      error: null,
    });
    mockGetProfile.mockResolvedValue({ data: ACTIVE_PROFILE, error: null });

    const res = await handler(makeEvent({ email: "user@example.com", password: "correctpass" }));
    const body = JSON.parse(res.body);
    expect(body.displayName).toBe("Jane Smith");
    expect(body.role).toBe("member");
  });

  it("returns 429 when rate limited", async () => {
    const { isRateLimited } = await import("../../netlify/functions/_shared/rate-limit.mjs");
    isRateLimited.mockResolvedValue(true);

    const res = await handler(makeEvent({ email: "user@example.com", password: "pass" }));
    expect(res.statusCode).toBe(429);
  });

  it("normalises email to lowercase", async () => {
    mockSignIn.mockResolvedValue({
      data: { session: VALID_SESSION, user: { id: "user-1" } },
      error: null,
    });
    mockGetProfile.mockResolvedValue({ data: ACTIVE_PROFILE, error: null });

    await handler(makeEvent({ email: "USER@EXAMPLE.COM", password: "correctpass" }));
    expect(mockSignIn).toHaveBeenCalledWith(
      expect.objectContaining({ email: "user@example.com" })
    );
  });
});
