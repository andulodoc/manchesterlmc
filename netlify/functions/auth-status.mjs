import { supabaseAnon, supabaseAdmin } from "./_shared/supabase.mjs";
import { parseCookies, accessCookie, refreshCookie } from "./_shared/cookies.mjs";
import { methodNotAllowed } from "./_shared/response.mjs";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store, no-cache",
};

const NOT_AUTHENTICATED = {
  statusCode: 200,
  headers: JSON_HEADERS,
  body: JSON.stringify({ authenticated: false }),
};

export const handler = async (event) => {
  if (event.httpMethod !== "GET") return methodNotAllowed();

  const cookies = parseCookies(event.headers.cookie);
  const accessToken = cookies.sb_access_token;
  const refreshToken = cookies.sb_refresh_token;

  console.log("[auth-status] has access_token:", !!accessToken, "has refresh_token:", !!refreshToken);

  // ── Try access token first ──────────────────────────────────
  if (accessToken) {
    const { data, error } = await supabaseAnon.auth.getUser(accessToken);
    if (error) {
      console.log("[auth-status] getUser error:", error.message);
    } else if (data?.user) {
      const profile = await getProfile(data.user.id);
      if (profile && profile.status === "active") {
        return {
          statusCode: 200,
          headers: JSON_HEADERS,
          body: JSON.stringify({
            authenticated: true,
            displayName: `${profile.first_name} ${profile.last_name}`,
            role: profile.role,
          }),
        };
      }
      console.log("[auth-status] profile missing or inactive:", profile?.status);
    }
  }

  // ── Access token missing/expired — try refresh ──────────────
  if (refreshToken) {
    const { data, error } = await supabaseAnon.auth.refreshSession({ refresh_token: refreshToken });
    if (error) {
      console.log("[auth-status] refreshSession error:", error.message);
    } else if (data?.session && data?.user) {
      const profile = await getProfile(data.user.id);
      if (profile && profile.status === "active") {
        return {
          statusCode: 200,
          headers: JSON_HEADERS,
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
      console.log("[auth-status] refresh profile missing or inactive:", profile?.status);
    }
  }

  console.log("[auth-status] returning not authenticated");
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
