import { supabaseAnon, supabaseAdmin } from "./_shared/supabase.mjs";
import { logEvent } from "./_shared/audit.mjs";
import { isRateLimited, hashKey } from "./_shared/rate-limit.mjs";
import { methodNotAllowed, badRequest, ok, tooManyRequests } from "./_shared/response.mjs";

// Generic message prevents user enumeration on both steps
const GENERIC_RESET_SENT = {
  ok: true,
  message:
    "If an account exists for that email address, a password reset link has been sent. " +
    "The link expires in 1 hour.",
};

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return methodNotAllowed();

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const ip = event.headers["x-forwarded-for"]?.split(",")[0]?.trim() || null;

  // ── Step 1: request a reset link ────────────────────────────
  if (body.email !== undefined) {
    const { email } = body;

    if (!email || !email.includes("@")) {
      return badRequest("A valid email address is required.");
    }

    // Rate limit: 3 reset requests per email per hour
    const emailKey = `reset:${hashKey(email.toLowerCase().trim())}`;
    if (await isRateLimited(emailKey, 3, 3600)) {
      // Still return the generic message — don't reveal the limit was hit
      return ok(GENERIC_RESET_SENT);
    }

    await supabaseAnon.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo: `${process.env.URL || ""}/members/reset-password/`,
    });

    await logEvent("password_reset_request", null, ip, {
      email_hint: email.slice(0, 3),
    });

    // Always return the same response regardless of whether the email exists
    return ok(GENERIC_RESET_SENT);
  }

  // ── Step 2: confirm new password via token ───────────────────
  if (body.token !== undefined && body.password !== undefined) {
    const { token, password } = body;

    if (!token || typeof token !== "string" || token.length < 10) {
      return badRequest("Invalid or missing reset token.");
    }

    if (!password || password.length < 8) {
      return badRequest("Password must be at least 8 characters.");
    }

    let userId = null;

    // Try token_hash flow first (query param / newer Supabase flow)
    const { data: verifyData, error: verifyError } = await supabaseAnon.auth.verifyOtp({
      token_hash: token,
      type: "recovery",
    });

    if (!verifyError && verifyData?.user) {
      userId = verifyData.user.id;
    } else {
      // Fall back: treat token as an access_token from the URL hash (implicit flow)
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
      if (userError || !userData?.user) {
        return badRequest("This reset link is invalid or has expired. Please request a new one.");
      }
      userId = userData.user.id;
    }

    // Set the new password via admin client
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password }
    );

    if (updateError) {
      console.error("[auth-reset-password] update error:", updateError.message);
      return badRequest("Unable to update password. Please request a new reset link.");
    }

    await logEvent("password_reset_complete", userId, ip);

    return ok({ ok: true, message: "Your password has been updated. You can now log in." });
  }

  return badRequest("Request must include either { email } or { token, password }.");
};
