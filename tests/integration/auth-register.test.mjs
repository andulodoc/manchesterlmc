import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSignUp = vi.fn();
const mockInsert = vi.fn();

vi.mock("../../netlify/functions/_shared/supabase.mjs", () => ({
  supabaseAnon: {
    auth: { signUp: mockSignUp },
  },
  supabaseAdmin: {
    from: () => ({
      insert: mockInsert,
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

const { handler } = await import("../../netlify/functions/auth-register.mjs");

function makeEvent(body = {}) {
  return {
    httpMethod: "POST",
    headers: { "x-forwarded-for": "1.2.3.4" },
    body: JSON.stringify(body),
  };
}

// role must be the display label that the form submits, not the slug
const VALID_BODY = {
  firstname: "Jane",
  lastname: "Smith",
  email: "jane@example.com",
  gmc: "1234567",
  role: "Locum GP",
  password: "SecurePass1!",
  password2: "SecurePass1!",
};

describe("auth-register", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { isRateLimited } = await import("../../netlify/functions/_shared/rate-limit.mjs");
    isRateLimited.mockResolvedValue(false);
  });

  it("rejects non-POST requests", async () => {
    const res = await handler({ httpMethod: "GET", headers: {}, body: "" });
    expect(res.statusCode).toBe(405);
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await handler(makeEvent({ email: "test@example.com" }));
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when passwords do not match", async () => {
    const res = await handler(makeEvent({ ...VALID_BODY, password2: "DifferentPass1!" }));
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when password is too short", async () => {
    const res = await handler(makeEvent({ ...VALID_BODY, password: "short", password2: "short" }));
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for invalid GMC number format", async () => {
    const res = await handler(makeEvent({ ...VALID_BODY, gmc: "123" })); // must be 7 digits
    expect(res.statusCode).toBe(400);
  });

  it("returns generic success even when Supabase signUp fails (enumeration resistance)", async () => {
    mockSignUp.mockResolvedValue({ data: { user: null }, error: { message: "User already exists" } });

    const res = await handler(makeEvent(VALID_BODY));
    // Must NOT reveal whether the email is already registered
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
  });

  it("returns 429 when rate limited", async () => {
    const { isRateLimited } = await import("../../netlify/functions/_shared/rate-limit.mjs");
    isRateLimited.mockResolvedValue(true);

    const res = await handler(makeEvent(VALID_BODY));
    expect(res.statusCode).toBe(429);
  });

  it("does not set any auth cookies on registration", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: "new-user" } },
      error: null,
    });
    mockInsert.mockResolvedValue({ error: null });

    const res = await handler(makeEvent(VALID_BODY));
    // Registration should never log the user in automatically
    expect(res.multiValueHeaders?.["Set-Cookie"]).toBeUndefined();
    expect(res.headers?.["Set-Cookie"]).toBeUndefined();
  });
});
