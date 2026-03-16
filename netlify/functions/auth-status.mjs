import { supabaseAdmin } from "./_shared/supabase.mjs";
import { parseCookies, accessCookie, refreshCookie } from "./_shared/cookies.mjs";
import { methodNotAllowed } from "./_shared/response.mjs";

const NOT_AUTHENTICATED = {
  statusCode: 200,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ authenticated: false }),
};

export const handler = async (event) => {
  if (event.httpMethod !== "GET") return methodNotAllowed();

  const cookies = parseCookies(event.headers.cookie);
  const accessToken = cookies.sb_access_token;
  const refreshToken = cookies.sb_refresh_token;

  // ── Try access token first ──────────────────────────────────
  if (accessToken) {
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (!error && data?.user) {
      const profile = await getProfile(data.user.id);
      if (profile && profile.status === "active") {
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authenticated: true,
            displayName: `${profile.first_name} ${profile.last_name}`,
            role: profile.role,
          }),
        };
      }
    }
  }

  // ── Access token missing/expired — try refresh ──────────────
  if (refreshToken) {
    const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token: refreshToken });
    if (!error && data?.session && data?.user) {
      const profile = await getProfile(data.user.id);
      if (profile && profile.status === "active") {
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          multiValueHeaders: {
            "Set-Cookie": [
              accessCookie(data.session.access_token),
              refreshCookie(data.session.refresh_token),
            ],
          },
          body: JSON.stringify({
            authenticated: true,
            displayName: `${profile.first_name} ${profile.last_name}`,
            role: profile.role,
          }),
        };
      }
    }
  }

  return NOT_AUTHENTICATED;
};

async function getProfile(userId) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("first_name, last_name, role, status")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data;
}
