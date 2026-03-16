const BASE = "Secure; HttpOnly; SameSite=Strict; Path=/";

/** Parse a Cookie header string into a plain object. */
export function parseCookies(header = "") {
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").map((c) => {
      const eq = c.indexOf("=");
      if (eq === -1) return [c.trim(), ""];
      return [c.slice(0, eq).trim(), decodeURIComponent(c.slice(eq + 1).trim())];
    })
  );
}

/** Set-Cookie string for the short-lived access token (15 min). */
export function accessCookie(token) {
  return `sb_access_token=${token}; ${BASE}; Max-Age=900`;
}

/** Set-Cookie string for the rolling refresh token (7 days). */
export function refreshCookie(token) {
  return `sb_refresh_token=${token}; ${BASE}; Max-Age=604800`;
}

/** Array of Set-Cookie strings that expire both cookies immediately. */
export function clearCookies() {
  return [
    `sb_access_token=; ${BASE}; Max-Age=0`,
    `sb_refresh_token=; ${BASE}; Max-Age=0`,
  ];
}
