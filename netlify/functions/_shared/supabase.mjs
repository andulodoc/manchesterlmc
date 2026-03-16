import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  throw new Error(
    "Missing Supabase env vars: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY"
  );
}

const clientOpts = {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
};

/**
 * Admin client — uses service role key, bypasses RLS.
 * Use for: reading any profile, inserting audit_log rows, approving accounts.
 * Never expose this client's responses directly to the browser.
 */
export const supabaseAdmin = createClient(url, serviceKey, clientOpts);

/**
 * Anon client — uses public anon key, subject to RLS.
 * Use for: signInWithPassword, signUp, resetPasswordForEmail, refreshSession.
 */
export const supabaseAnon = createClient(url, anonKey, clientOpts);
