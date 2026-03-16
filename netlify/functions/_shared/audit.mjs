import { createHmac } from "crypto";
import { supabaseAdmin } from "./supabase.mjs";

/**
 * Write a security event to the audit_log table.
 *
 * @param {string} action   - One of the constrained action values in the DB.
 * @param {string|null} userId    - auth.users UUID (null for pre-auth events).
 * @param {string|null} ipAddress - Raw IP from the request (will be HMAC-hashed).
 * @param {object} metadata - Additional context; never include passwords or tokens.
 */
export async function logEvent(action, userId, ipAddress, metadata = {}) {
  const secret = process.env.SESSION_SECRET;
  const ipHash = ipAddress && secret
    ? createHmac("sha256", secret).update(ipAddress).digest("hex").slice(0, 16)
    : null;

  const { error } = await supabaseAdmin.from("audit_log").insert({
    user_id: userId || null,
    action,
    ip_hash: ipHash,
    metadata,
  });

  // Log failures are non-fatal — don't throw, just warn.
  if (error) {
    console.error("[audit] failed to write log entry:", error.message);
  }
}
