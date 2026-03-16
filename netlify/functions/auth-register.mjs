import { supabaseAnon, supabaseAdmin } from "./_shared/supabase.mjs";
import { isRateLimited, hashKey } from "./_shared/rate-limit.mjs";
import { methodNotAllowed, badRequest, ok, tooManyRequests } from "./_shared/response.mjs";

const VALID_ROLE_TYPES = [
  "locum_gp", "portfolio_gp", "practice_staff", "gp_partner", "salaried_gp", "other",
];

// Map display values from the form to DB role_type slugs
const ROLE_TYPE_MAP = {
  "Locum GP": "locum_gp",
  "Portfolio GP": "portfolio_gp",
  "GP Registrar (not at member practice)": "other",
  "Retired GP": "other",
  "Other": "other",
};

const GENERIC_SUCCESS = {
  ok: true,
  message:
    "Registration received. Please check your email to verify your address. " +
    "Your account will be activated within one working day of payment being confirmed.",
};

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return methodNotAllowed();

  // ── Parse body ──────────────────────────────────────────────
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const { firstname, lastname, email, gmc, role, password, password2 } = body;

  // ── Validate ────────────────────────────────────────────────
  if (!firstname?.trim()) return badRequest("First name is required.");
  if (!lastname?.trim())  return badRequest("Last name is required.");

  if (!email || !email.includes("@")) return badRequest("A valid email address is required.");

  if (!gmc || !/^\d{7}$/.test(gmc.trim())) {
    return badRequest("A valid 7-digit GMC number is required.");
  }

  if (!role || !ROLE_TYPE_MAP[role]) {
    return badRequest("Please select a valid role.");
  }

  if (!password || password.length < 8) {
    return badRequest("Password must be at least 8 characters.");
  }

  if (password !== password2) {
    return badRequest("Passwords do not match.");
  }

  // ── Rate limit: 3 registrations per IP per hour ─────────────
  const ip = event.headers["x-forwarded-for"]?.split(",")[0]?.trim() || null;
  const ipKey = `register:${hashKey(ip || "unknown")}`;
  if (await isRateLimited(ipKey, 3, 3600)) {
    return tooManyRequests();
  }

  // ── Create auth user (triggers verification email) ──────────
  const { data, error: signUpError } = await supabaseAnon.auth.signUp({
    email: email.toLowerCase().trim(),
    password,
    options: {
      // Redirect user to the reset-password page after clicking the link
      emailRedirectTo: `${process.env.URL || ""}/members/`,
    },
  });

  if (signUpError) {
    console.error("[auth-register] signUp error:", signUpError.message);
    // Return generic success to prevent user enumeration
    return ok(GENERIC_SUCCESS);
  }

  // ── Insert profile row (service role bypasses RLS) ──────────
  if (data.user) {
    const roleType = ROLE_TYPE_MAP[role];
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: data.user.id,
      first_name: firstname.trim(),
      last_name: lastname.trim(),
      gmc_number: gmc.trim(),
      role_type: roleType,
      status: "pending",
      role: "member",
    });

    if (profileError) {
      console.error("[auth-register] profile insert error:", profileError.message);
      // Auth user was created but profile failed — non-fatal for UX,
      // but admin will need to create profile manually.
    }
  }

  // Always return the same generic success message.
  return ok(GENERIC_SUCCESS);
};
