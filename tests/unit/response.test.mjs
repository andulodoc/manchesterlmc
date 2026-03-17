import { describe, it, expect } from "vitest";
import {
  ok,
  okWithCookies,
  err,
  methodNotAllowed,
  badRequest,
  unauthorized,
  forbidden,
  tooManyRequests,
} from "../../netlify/functions/_shared/response.mjs";

describe("ok", () => {
  it("returns 200 status", () => {
    expect(ok({}).statusCode).toBe(200);
  });

  it("serialises the body to JSON", () => {
    const res = ok({ foo: "bar" });
    expect(JSON.parse(res.body)).toEqual({ foo: "bar" });
  });

  it("sets Content-Type: application/json", () => {
    expect(ok({}).headers["Content-Type"]).toBe("application/json");
  });
});

describe("okWithCookies", () => {
  it("returns 200 status", () => {
    expect(okWithCookies({}, ["c=v"]).statusCode).toBe(200);
  });

  it("sets cookies via multiValueHeaders", () => {
    const cookies = ["sb_access_token=abc; HttpOnly", "sb_refresh_token=xyz; HttpOnly"];
    const res = okWithCookies({ ok: true }, cookies);
    expect(res.multiValueHeaders["Set-Cookie"]).toEqual(cookies);
  });
});

describe("err", () => {
  it("includes the error message in the body", () => {
    const res = err(400, "Bad input");
    expect(JSON.parse(res.body).error).toBe("Bad input");
  });

  it("uses the supplied status code", () => {
    expect(err(422, "x").statusCode).toBe(422);
  });
});

describe("methodNotAllowed", () => {
  it("returns 405", () => {
    expect(methodNotAllowed().statusCode).toBe(405);
  });
});

describe("badRequest", () => {
  it("returns 400", () => {
    expect(badRequest("oops").statusCode).toBe(400);
  });

  it("includes the message", () => {
    const res = badRequest("Invalid email");
    expect(JSON.parse(res.body).error).toBe("Invalid email");
  });
});

describe("unauthorized", () => {
  it("returns 401", () => {
    expect(unauthorized().statusCode).toBe(401);
  });
});

describe("forbidden", () => {
  it("returns 403", () => {
    expect(forbidden().statusCode).toBe(403);
  });
});

describe("tooManyRequests", () => {
  it("returns 429", () => {
    expect(tooManyRequests().statusCode).toBe(429);
  });
});
