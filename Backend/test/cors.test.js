const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const cors = require("cors");
const http = require("node:http");
const { createCorsOptions, resolveCorsConfig } = require("../src/config/cors");

const STAGING = "https://swiftmove-staging.vercel.app";
const PRODUCTION = "https://swiftmove-movers-and-packers.vercel.app";

test("staging CORS accepts the approved staging origin and rejects production", () => {
  const config = resolveCorsConfig({ APP_ENV: "staging", CORS_ORIGINS: STAGING });
  assert.deepEqual(config.origins, [STAGING]);
  assert.throws(() => resolveCorsConfig({ APP_ENV: "staging", CORS_ORIGINS: `${STAGING},${PRODUCTION}` }), /approved staging/);
  const options = createCorsOptions(config);
  assert.deepEqual(options.exposedHeaders, ["X-Pagination"]);
  options.origin(STAGING, (error, allowed) => { assert.equal(error, null); assert.equal(allowed, true); });
  options.origin(PRODUCTION, (error, allowed) => { assert.equal(error, null); assert.equal(allowed, false); });
});

test("production CORS accepts an approved production origin and excludes staging", () => {
  const config = resolveCorsConfig({ APP_ENV: "production", CORS_ORIGINS: PRODUCTION });
  assert.deepEqual(config.origins, [PRODUCTION]);
  assert.throws(() => resolveCorsConfig({ APP_ENV: "production", CORS_ORIGINS: `${PRODUCTION},${STAGING}` }), /approved production/);
});

test("CORS rejects wildcard, malformed and unapproved origins", () => {
  assert.throws(() => resolveCorsConfig({ APP_ENV: "staging", CORS_ORIGINS: "*" }), /wildcard/);
  assert.throws(() => resolveCorsConfig({ APP_ENV: "staging", CORS_ORIGINS: `${STAGING}/dashboard` }), /bare origins/);
  const options = createCorsOptions(resolveCorsConfig({ APP_ENV: "staging", CORS_ORIGINS: STAGING }));
  options.origin("https://unknown.example", (error, allowed) => { assert.equal(error, null); assert.equal(allowed, false); });
});

test("staging CORS responds to an approved OPTIONS preflight and omits headers for rejected origins", async (t) => {
  const app = express();
  app.use(cors(createCorsOptions(resolveCorsConfig({ APP_ENV: "staging", CORS_ORIGINS: STAGING }))));
  app.put("/resource", (_req, res) => res.json({ ok: true }));
  const server = app.listen(0, "127.0.0.1");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await new Promise((resolve) => server.once("listening", resolve));
  const port = server.address().port;
  const request = (origin) => new Promise((resolve, reject) => {
    const call = http.request({
      host: "127.0.0.1",
      port,
      method: "OPTIONS",
      path: "/resource",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": "PUT",
        "Access-Control-Request-Headers": "content-type,authorization",
      },
    }, (response) => {
      response.resume();
      response.on("end", () => resolve(response));
    });
    call.on("error", reject);
    call.end();
  });

  const approved = await request(STAGING);
  assert.equal(approved.statusCode, 204);
  assert.equal(approved.headers["access-control-allow-origin"], STAGING);
  assert.equal(approved.headers["access-control-allow-credentials"], "true");
  assert.match(approved.headers["access-control-allow-headers"], /authorization/i);

  const rejected = await request(PRODUCTION);
  assert.equal(rejected.headers["access-control-allow-origin"], undefined);
});
