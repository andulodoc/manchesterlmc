import { supabaseAdmin } from "./_shared/supabase.mjs";
import { parseCookies, accessCookie, refreshCookie } from "./_shared/cookies.mjs";
import { logEvent } from "./_shared/audit.mjs";
import { methodNotAllowed, unauthorized } from "./_shared/response.mjs";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return methodNotAllowed();

  const cookies = parseCookies(event.headers.cookie);
  const refreshToken = cookies.sb_refresh_token;
  const ip = event.headers["x-forwarded-for"]?.split(",")[0]?.trim() || null;

  if (!refreshToken) return unauthorized();

  const { data, error } = await supabaseAdmin.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data?.session) {
    return unauthorized();
  }

  await logEvent("token_refresh", data.user?.id || null, ip);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    multiValueHeaders: {
      "Set-Cookie": [
        accessCookie(data.session.access_token),
        refreshCookie(data.session.refresh_token),
      ],
    },
    body: JSON.stringify({ ok: true }),
  };
};
