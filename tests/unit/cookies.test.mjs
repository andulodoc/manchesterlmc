import { describe, it, expect } from "vitest";
import {
  parseCookies,
  accessCookie,
  refreshCookie,
  clearCookies,
} from "../../netlify/functions/_shared/cookies.mjs";

describe("parseCookies", () => {
  it("returns empty object for empty string", () => {
    expect(parseCookies("")).toEqual({});
  });

  it("returns empty object for undefined", () => {
    expect(parseCookies(undefined)).toEqual({});
  });

  it("parses a single cookie", () => {
    expect(parseCookies("foo=bar")).toEqual({ foo: "bar" });
  });

  it("parses multiple cookies", () => {
    expect(parseCookies("a=1; b=2; c=3")).toEqual({ a: "1", b: "2", c: "3" });
  });

  it("trims whitespace around names and values", () => {
    expect(parseCookies(" foo = bar ")).toEqual({ foo: "bar" });
  });

  it("correctly splits on first = only (JWT-like values)", () => {
    const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.signature";
    const result = parseCookies(`sb_access_token=${jwt}`);
    expect(result.sb_access_token).toBe(jwt);
  });

  it("parses both auth cookies together", () => {
    const access = "eyJhbGc.eyJzdWI.sig1";
    const refresh = "some-refresh-token-value";
    const result = parseCookies(`sb_access_token=${access}; sb_refresh_token=${refresh}`);
    expect(result.sb_access_token).toBe(access);
    expect(result.sb_refresh_token).toBe(refresh);
  });
});

describe("accessCookie", () => {
  it("sets the correct cookie name", () => {
    expect(accessCookie("tok")).toContain("sb_access_token=tok");
  });

  it("includes Secure flag", () => {
    expect(accessCookie("tok")).toContain("Secure");
  });

  it("includes HttpOnly flag", () => {
    expect(accessCookie("tok")).toContain("HttpOnly");
  });

  it("includes SameSite=Strict", () => {
    expect(accessCookie("tok")).toContain("SameSite=Strict");
  });

  it("includes Path=/", () => {
    expect(accessCookie("tok")).toContain("Path=/");
  });

  it("expires in 15 minutes (900 seconds)", () => {
    expect(accessCookie("tok")).toContain("Max-Age=900");
  });
});

describe("refreshCookie", () => {
  it("sets the correct cookie name", () => {
    expect(refreshCookie("tok")).toContain("sb_refresh_token=tok");
  });

  it("includes Secure flag", () => {
    expect(refreshCookie("tok")).toContain("Secure");
  });

  it("includes HttpOnly flag", () => {
    expect(refreshCookie("tok")).toContain("HttpOnly");
  });

  it("expires in 7 days (604800 seconds)", () => {
    expect(refreshCookie("tok")).toContain("Max-Age=604800");
  });
});

describe("clearCookies", () => {
  it("returns an array of two Set-Cookie strings", () => {
    const result = clearCookies();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
  });

  it("expires the access token immediately", () => {
    const result = clearCookies();
    const accessClear = result.find((c) => c.includes("sb_access_token"));
    expect(accessClear).toContain("Max-Age=0");
  });

  it("expires the refresh token immediately", () => {
    const result = clearCookies();
    const refreshClear = result.find((c) => c.includes("sb_refresh_token"));
    expect(refreshClear).toContain("Max-Age=0");
  });

  it("retains security flags when clearing", () => {
    const result = clearCookies();
    result.forEach((cookie) => {
      expect(cookie).toContain("Secure");
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("SameSite=Strict");
    });
  });
});
