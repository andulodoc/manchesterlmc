import { supabaseAdmin } from "./supabase.mjs";
import { parseCookies } from "./cookies.mjs";
import { unauthorized, forbidden } from "./response.mjs";

/**
 * Verify the request carries a valid lmc_admin session.
 * Returns { user, profile } on success, or a ready-to-return error response.
 *
 * Usage:
 *   const result = await requireAdmin(event);
 *   if (result.statusCode) return result;   // it's an error response
 *   const { user, profile } = result;
 */
export async function requireAdmin(event) {
  const cookies = parseCookies(event.headers.cookie);
  const accessToken = cookies.sb_access_token;

  if (!accessToken) return unauthorized();

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data?.user) return unauthorized();

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("id, first_name, last_name, role, status")
    .eq("id", data.user.id)
    .single();

  if (profileErr || !profile) return unauthorized();
  if (profile.role !== "lmc_admin") return forbidden();
  if (profile.status !== "active") return forbidden();

  return { user: data.user, profile };
}
