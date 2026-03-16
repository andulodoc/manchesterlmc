import { supabaseAdmin } from "./supabase.mjs";

/**
 * Check whether a rate limit key is over its threshold.
 * Uses an atomic Postgres function to avoid race conditions.
 *
 * @param {string} key            - Unique key, e.g. "login:1.2.3.4" or "reset:abc"
 * @param {number} maxCount       - Max allowed requests in the window
 * @param {number} windowSeconds  - Window size in seconds
 * @returns {Promise<boolean>}    - true = over limit (block), false = allow
 */
export async function isRateLimited(key, maxCount, windowSeconds) {
  const { data, error } = await supabaseAdmin.rpc("check_rate_limit", {
    p_key: key,
    p_max_count: maxCount,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    // Fail open — log but don't block legitimate requests due to DB errors
    console.error("[rate-limit] check failed:", error.message);
    return false;
  }

  return data === true;
}

/**
 * Hash a value (IP address, email) for use as a rate limit key.
 * Prevents storing raw PII in the rate_limits table.
 */
import { createHmac } from "crypto";

export function hashKey(value) {
  const secret = process.env.SESSION_SECRET || "fallback";
  return createHmac("sha256", secret).update(String(value)).digest("hex").slice(0, 24);
}
