import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockGetProfile = vi.fn();
const mockUpdate = vi.fn();

vi.mock("../../netlify/functions/_shared/supabase.mjs", () => ({
  supabaseAdmin: {
    auth: { getUser: mockGetUser },
    from: (table) => {
      if (table === "profiles") {
        return {
          select: () => ({ eq: () => ({ single: mockGetProfile }) }),
          update: () => ({ eq: mockUpdate }),
        };
      }
      return { insert: vi.fn().mockReturnValue({ error: null }) };
    },
  },
}));

vi.mock("../../netlify/functions/_shared/audit.mjs", () => ({
  logEvent: vi.fn(),
}));

const { handler } = await import("../../netlify/functions/admin-approve.mjs");

function makeEvent(body = {}, cookies = "sb_access_token=admin.token") {
  return {
    httpMethod: "POST",
    headers: { cookie: cookies, "x-forwarded-for": "1.2.3.4" },
    body: JSON.stringify(body),
  };
}

const ADMIN_USER = { id: "admin-1", email: "admin@lmc.co.uk" };
const ADMIN_PROFILE = { role: "lmc_admin", status: "active", first_name: "Admin", last_name: "User" };

describe("admin-approve", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects unauthenticated requests (no cookie)", async () => {
    const res = await handler(makeEvent({}, ""));
    expect(res.statusCode).toBe(401);
  });

  it("returns 403 when caller is not lmc_admin", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER }, error: null });
    mockGetProfile.mockResolvedValue({
      data: { ...ADMIN_PROFILE, role: "member" },
      error: null,
    });

    const res = await handler(makeEvent({ userId: "target-user" }));
    expect(res.statusCode).toBe(403);
  });

  it("approves a user when called by lmc_admin", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER }, error: null });
    mockGetProfile.mockResolvedValue({ data: ADMIN_PROFILE, error: null });
    mockUpdate.mockResolvedValue({ error: null });

    const res = await handler(makeEvent({ userId: "target-user" }));
    expect(res.statusCode).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith("id", "target-user");
  });

  it("returns 400 when userId is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER }, error: null });
    mockGetProfile.mockResolvedValue({ data: ADMIN_PROFILE, error: null });

    const res = await handler(makeEvent({}));
    expect(res.statusCode).toBe(400);
  });
});
