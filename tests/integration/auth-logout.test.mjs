import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockSignOut = vi.fn();

vi.mock("../../netlify/functions/_shared/supabase.mjs", () => ({
  supabaseAdmin: {
    auth: {
      getUser: mockGetUser,
      admin: { signOut: mockSignOut },
    },
  },
}));

vi.mock("../../netlify/functions/_shared/audit.mjs", () => ({
  logEvent: vi.fn(),
}));

const { handler } = await import("../../netlify/functions/auth-logout.mjs");

function makeEvent(cookies = "") {
  return {
    httpMethod: "POST",
    headers: { cookie: cookies, "x-forwarded-for": "1.2.3.4" },
    body: "",
  };
}

describe("auth-logout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects non-POST requests", async () => {
    const res = await handler({ httpMethod: "GET", headers: {}, body: "" });
    expect(res.statusCode).toBe(405);
  });

  it("returns 200 even when no cookie present (idempotent logout)", async () => {
    const res = await handler(makeEvent(""));
    // Logout is intentionally idempotent — always clears cookies and succeeds
    expect(res.statusCode).toBe(200);
    const cookies = res.multiValueHeaders["Set-Cookie"];
    expect(cookies.some((c) => c.includes("Max-Age=0"))).toBe(true);
  });

  it("clears both cookies on successful logout", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSignOut.mockResolvedValue({ error: null });

    const res = await handler(makeEvent("sb_access_token=eyJ.access.token"));
    expect(res.statusCode).toBe(200);

    const cookies = res.multiValueHeaders["Set-Cookie"];
    const accessClear = cookies.find((c) => c.includes("sb_access_token"));
    const refreshClear = cookies.find((c) => c.includes("sb_refresh_token"));
    expect(accessClear).toContain("Max-Age=0");
    expect(refreshClear).toContain("Max-Age=0");
  });

  it("still clears cookies even if Supabase signOut fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSignOut.mockResolvedValue({ error: { message: "Token not found" } });

    const res = await handler(makeEvent("sb_access_token=eyJ.access.token"));
    // Should still succeed — cookie clearing is what matters
    expect(res.statusCode).toBe(200);
    const cookies = res.multiValueHeaders["Set-Cookie"];
    expect(cookies.some((c) => c.includes("Max-Age=0"))).toBe(true);
  });
});
