import { supabaseAdmin } from "./_shared/supabase.mjs";
import { requireAdmin } from "./_shared/require-admin.mjs";
import { methodNotAllowed, ok } from "./_shared/response.mjs";

export const handler = async (event) => {
  if (event.httpMethod !== "GET") return methodNotAllowed();

  const auth = await requireAdmin(event);
  if (auth.statusCode) return auth;

  const limit = Math.min(parseInt(event.queryStringParameters?.limit || "100"), 500);
  const offset = parseInt(event.queryStringParameters?.offset || "0");

  const { data, error } = await supabaseAdmin
    .from("audit_log")
    .select("id, user_id, action, ip_hash, metadata, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[admin-audit-log] error:", error.message);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to fetch audit log." }) };
  }

  // Enrich with email where possible (best-effort)
  const userIds = [...new Set(data.map((e) => e.user_id).filter(Boolean))];
  let emailMap = {};

  if (userIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", userIds);

    if (profiles) {
      emailMap = Object.fromEntries(
        profiles.map((p) => [p.id, `${p.first_name} ${p.last_name}`])
      );
    }
  }

  const enriched = data.map((entry) => ({
    ...entry,
    user_name: entry.user_id ? (emailMap[entry.user_id] || "Unknown") : "System",
  }));

  return ok({ entries: enriched, total: enriched.length });
};
