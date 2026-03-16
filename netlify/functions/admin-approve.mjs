import { supabaseAdmin } from "./_shared/supabase.mjs";
import { requireAdmin } from "./_shared/require-admin.mjs";
import { logEvent } from "./_shared/audit.mjs";
import { methodNotAllowed, badRequest, ok } from "./_shared/response.mjs";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return methodNotAllowed();

  const auth = await requireAdmin(event);
  if (auth.statusCode) return auth;

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const { userId } = body;
  if (!userId || typeof userId !== "string") return badRequest("userId is required.");

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ status: "active" })
    .eq("id", userId);

  if (error) {
    console.error("[admin-approve] update error:", error.message);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to approve user." }) };
  }

  const ip = event.headers["x-forwarded-for"]?.split(",")[0]?.trim() || null;
  await logEvent("account_approved", userId, ip, { approved_by: auth.user.id });

  return ok({ ok: true });
};
