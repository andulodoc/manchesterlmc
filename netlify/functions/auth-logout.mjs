import { supabaseAdmin } from "./_shared/supabase.mjs";
import { parseCookies, clearCookies } from "./_shared/cookies.mjs";
import { logEvent } from "./_shared/audit.mjs";
import { methodNotAllowed } from "./_shared/response.mjs";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return methodNotAllowed();

  const cookies = parseCookies(event.headers.cookie);
  const accessToken = cookies.sb_access_token;
  const ip = event.headers["x-forwarded-for"]?.split(",")[0]?.trim() || null;

  // Determine the user ID before revoking (best effort)
  let userId = null;
  if (accessToken) {
    const { data } = await supabaseAdmin.auth.getUser(accessToken);
    userId = data?.user?.id || null;
  }

  // Revoke the session server-side (invalidates the refresh token)
  if (accessToken) {
    // Use admin client with the user's access token to sign out their specific session
    const { error } = await supabaseAdmin.auth.admin.signOut(accessToken, "local");
    if (error) {
      console.error("[auth-logout] signOut error:", error.message);
    }
  }

  await logEvent("logout", userId, ip);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    multiValueHeaders: { "Set-Cookie": clearCookies() },
    body: JSON.stringify({ ok: true }),
  };
};
