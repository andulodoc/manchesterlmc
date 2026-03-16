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

  // Prevent admins suspending themselves
  if (userId === auth.user.id) {
    return badRequest("You cannot suspend your own account.");
  }

  // Revoke all active sessions for this user
  await supabaseAdmin.auth.admin.signOut(userId, "global").catch((e) => {
    console.error("[admin-suspend] signOut error:", e.message);
  });

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ status: "suspended" })
    .eq("id", userId);

  if (error) {
    console.error("[admin-suspend] update error:", error.message);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to suspend user." }) };
  }

  const ip = event.headers["x-forwarded-for"]?.split(",")[0]?.trim() || null;
  await logEvent("account_suspended", userId, ip, { suspended_by: auth.user.id });

  return ok({ ok: true });
};
