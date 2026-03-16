const JSON_HEADERS = { "Content-Type": "application/json" };

export const ok = (body, extraHeaders = {}) => ({
  statusCode: 200,
  headers: { ...JSON_HEADERS, ...extraHeaders },
  body: JSON.stringify(body),
});

export const okWithCookies = (body, cookies) => ({
  statusCode: 200,
  headers: JSON_HEADERS,
  multiValueHeaders: { "Set-Cookie": cookies },
  body: JSON.stringify(body),
});

export const err = (statusCode, message, extraHeaders = {}) => ({
  statusCode,
  headers: { ...JSON_HEADERS, ...extraHeaders },
  body: JSON.stringify({ ok: false, error: message }),
});

export const methodNotAllowed = () => err(405, "Method Not Allowed");
export const badRequest = (msg) => err(400, msg);
export const unauthorized = () => err(401, "Unauthorized");
export const forbidden = () => err(403, "Forbidden");
export const tooManyRequests = () => err(429, "Too many requests. Please wait and try again.");
