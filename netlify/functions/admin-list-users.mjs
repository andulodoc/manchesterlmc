import { supabaseAdmin } from "./_shared/supabase.mjs";
import { requireAdmin } from "./_shared/require-admin.mjs";
import { methodNotAllowed, ok } from "./_shared/response.mjs";

export const handler = async (event) => {
  if (event.httpMethod !== "GET") return methodNotAllowed();

  const auth = await requireAdmin(event);
  if (auth.statusCode) return auth;

  // Fetch all profiles
  const { data: profiles, error: profilesErr } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (profilesErr) {
    console.error("[admin-list-users] profiles error:", profilesErr.message);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to fetch users." }) };
  }

  // Fetch auth users to get emails + verification status
  const { data: { users: authUsers }, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  });

  if (authErr) {
    console.error("[admin-list-users] auth users error:", authErr.message);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to fetch auth users." }) };
  }

  const authMap = Object.fromEntries(authUsers.map((u) => [u.id, u]));

  const merged = profiles.map((p) => {
    const authUser = authMap[p.id];
    return {
      id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      email: authUser?.email || "(unknown)",
      role_type: p.role_type,
      role: p.role,
      status: p.status,
      email_confirmed: !!authUser?.email_confirmed_at,
      created_at: p.created_at,
    };
  });

  return ok({ users: merged });
};
