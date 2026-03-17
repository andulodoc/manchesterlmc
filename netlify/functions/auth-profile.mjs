import { supabaseAdmin } from "./_shared/supabase.mjs";
import { parseCookies } from "./_shared/cookies.mjs";
import { logEvent } from "./_shared/audit.mjs";
import { methodNotAllowed, badRequest, unauthorized, ok } from "./_shared/response.mjs";

export const handler = async (event) => {
  // GET — return current profile
  if (event.httpMethod === "GET") {
    const cookies = parseCookies(event.headers.cookie);
    const accessToken = cookies.sb_access_token;
    if (!accessToken) return unauthorized();

    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !data?.user) return unauthorized();

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("first_name, last_name, role_type, role, status")
      .eq("id", data.user.id)
      .single();

    if (profileErr || !profile) return unauthorized();
    if (profile.status !== "active") return unauthorized();

    return ok({
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: data.user.email,
      roleType: profile.role_type,
      role: profile.role,
    });
  }

  // POST — update name fields
  if (event.httpMethod === "POST") {
    const cookies = parseCookies(event.headers.cookie);
    const accessToken = cookies.sb_access_token;
    if (!accessToken) return unauthorized();

    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !data?.user) return unauthorized();

    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return badRequest("Invalid JSON body.");
    }

    const { firstName, lastName } = body;
    if (!firstName?.trim()) return badRequest("First name is required.");
    if (!lastName?.trim())  return badRequest("Last name is required.");

    const { error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update({ first_name: firstName.trim(), last_name: lastName.trim() })
      .eq("id", data.user.id);

    if (updateErr) {
      console.error("[auth-profile] update error:", updateErr.message);
      return { statusCode: 500, body: JSON.stringify({ error: "Failed to update profile." }) };
    }

    const ip = event.headers["x-forwarded-for"]?.split(",")[0]?.trim() || null;
    await logEvent("profile_update", data.user.id, ip);

    return ok({ ok: true, displayName: `${firstName.trim()} ${lastName.trim()}` });
  }

  return methodNotAllowed();
};
