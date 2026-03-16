import { supabaseAnon, supabaseAdmin } from "./_shared/supabase.mjs";
import { accessCookie, refreshCookie } from "./_shared/cookies.mjs";
import { logEvent } from "./_shared/audit.mjs";
import { isRateLimited, hashKey } from "./_shared/rate-limit.mjs";
import {
  methodNotAllowed, badRequest, err, okWithCookies, tooManyRequests,
} from "./_shared/response.mjs";

const GENERIC_ERROR = "Invalid email or password.";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return methodNotAllowed();

  // ── Parse body ──────────────────────────────────────────────
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const { email, password } = body;
  const ip = event.headers["x-forwarded-for"]?.split(",")[0]?.trim() || null;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return badRequest("A valid email address is required.");
  }
  if (!password || typeof password !== "string" || password.length < 1) {
    return badRequest("Password is required.");
  }

  // ── Rate limit: 10 attempts per IP per 15 minutes ───────────
  const ipKey = `login:${hashKey(ip || "unknown")}`;
  if (await isRateLimited(ipKey, 10, 900)) {
    await logEvent("login_failed", null, ip, { reason: "rate_limited" });
    return tooManyRequests();
  }

  // ── Attempt sign-in ─────────────────────────────────────────
  const { data, error } = await supabaseAnon.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  });

  if (error || !data.session) {
    await logEvent("login_failed", null, ip, { email_hint: email.slice(0, 3) });
    return err(401, GENERIC_ERROR);
  }

  const { session, user } = data;

  // ── Check profile status ────────────────────────────────────
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("status, role, first_name, last_name")
    .eq("id", user.id)
    .single();

  if (profileErr || !profile) {
    // Authenticated user has no profile — account was not fully set up.
    await logEvent("login_failed", user.id, ip, { reason: "no_profile" });
    return err(403, "Your account is not fully set up. Please contact info@manchesterlmc.co.uk.");
  }

  if (profile.status === "pending") {
    await logEvent("login_failed", user.id, ip, { reason: "pending" });
    return err(403, "Your account is pending approval. You will be notified by email once it is activated.");
  }

  if (profile.status === "suspended") {
    await logEvent("login_failed", user.id, ip, { reason: "suspended" });
    return err(403, "Your account is not active. Please contact info@manchesterlmc.co.uk.");
  }

  // ── Check account lockout ───────────────────────────────────
  if (profile.lockout_until && new Date(profile.lockout_until) > new Date()) {
    await logEvent("login_failed", user.id, ip, { reason: "locked_out" });
    return err(403, "Your account is temporarily locked due to too many failed attempts. Please try again later.");
  }

  // ── Set cookies and return ──────────────────────────────────
  await logEvent("login", user.id, ip);

  return okWithCookies(
    {
      ok: true,
      displayName: `${profile.first_name} ${profile.last_name}`,
      role: profile.role,
    },
    [
      accessCookie(session.access_token),
      refreshCookie(session.refresh_token),
    ]
  );
};
