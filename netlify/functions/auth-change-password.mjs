import { supabaseAnon, supabaseAdmin } from "./_shared/supabase.mjs";
import { parseCookies } from "./_shared/cookies.mjs";
import { logEvent } from "./_shared/audit.mjs";
import { methodNotAllowed, badRequest, unauthorized, ok } from "./_shared/response.mjs";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return methodNotAllowed();

  const cookies = parseCookies(event.headers.cookie);
  const accessToken = cookies.sb_access_token;
  if (!accessToken) return unauthorized();

  // Identify the user
  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(accessToken);
  if (userErr || !userData?.user) return unauthorized();

  const user = userData.user;

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const { currentPassword, newPassword, newPassword2 } = body;

  if (!currentPassword) return badRequest("Current password is required.");
  if (!newPassword || newPassword.length < 8) return badRequest("New password must be at least 8 characters.");
  if (newPassword !== newPassword2) return badRequest("New passwords do not match.");
  if (currentPassword === newPassword) return badRequest("New password must be different from your current password.");

  // Verify current password by re-authenticating
  const { error: signInErr } = await supabaseAnon.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInErr) {
    return badRequest("Current password is incorrect.");
  }

  // Update to new password via admin client
  const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );

  if (updateErr) {
    console.error("[auth-change-password] update error:", updateErr.message);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to update password." }) };
  }

  const ip = event.headers["x-forwarded-for"]?.split(",")[0]?.trim() || null;
  await logEvent("password_change", user.id, ip);

  return ok({ ok: true });
};
