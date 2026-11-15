
const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const cors = require("cors");
const http = require("node:http");

const {
  createCorsOptions,
  resolveCorsConfig,
} = require("../src/config/cors");

const STAGING = "https://swiftmove-staging.vercel.app";
const PRODUCTION = "https://swiftmove-movers-and-packers.vercel.app";
const ANDROID = "https://localhost";

// 1. Staging accepts the website and Android origins, but rejects production.
test("staging CORS accepts staging and Android origins and rejects production", () => {
  const config = resolveCorsConfig({
    APP_ENV: "staging",
    CORS_ORIGINS: `${STAGING},${ANDROID}`,
  });

  assert.deepEqual(config.origins, [STAGING, ANDROID]);

  assert.throws(
    () =>
      resolveCorsConfig({
        APP_ENV: "staging",
        CORS_ORIGINS: `${STAGING},${ANDROID},${PRODUCTION}`,
      }),
    /approved staging/
  );

  const options = createCorsOptions(config);

  assert.deepEqual(options.exposedHeaders, ["X-Pagination"]);

  options.origin(STAGING, (error, allowed) => {
    assert.equal(error, null);
    assert.equal(allowed, true);
  });

  options.origin(ANDROID, (error, allowed) => {
    assert.equal(error, null);
    assert.equal(allowed, true);
  });

  options.origin(PRODUCTION, (error, allowed) => {
    assert.equal(error, null);
    assert.equal(allowed, false);
  });
});

// 2. Production accepts only the approved production website.
test("production CORS accepts production and rejects staging and Android", () => {
  const config = resolveCorsConfig({
    APP_ENV: "production",
    CORS_ORIGINS: PRODUCTION,
  });

  assert.deepEqual(config.origins, [PRODUCTION]);

  assert.throws(
    () =>
      resolveCorsConfig({
        APP_ENV: "production",
        CORS_ORIGINS: `${PRODUCTION},${STAGING}`,
      }),
    /approved production/
  );

  assert.throws(
    () =>
      resolveCorsConfig({
        APP_ENV: "production",
        CORS_ORIGINS: `${PRODUCTION},${ANDROID}`,
      }),
    /approved production/
  );

  const options = createCorsOptions(config);

  options.origin(ANDROID, (error, allowed) => {
    assert.equal(error, null);
    assert.equal(allowed, false);
  });
});

// 3. Reject wildcard, malformed and unapproved origins.
test("CORS rejects wildcard, malformed and unapproved origins", () => {
  assert.throws(
    () =>
      resolveCorsConfig({
        APP_ENV: "staging",
        CORS_ORIGINS: "*",
      }),
    /wildcard/
  );

  assert.throws(
    () =>
      resolveCorsConfig({
        APP_ENV: "staging",
        CORS_ORIGINS: `${STAGING}/dashboard`,
      }),
    /bare origins/
  );

  const options = createCorsOptions(
    resolveCorsConfig({
      APP_ENV: "staging",
      CORS_ORIGINS: `${STAGING},${ANDROID}`,
    })
  );

  options.origin("https://unknown.example", (error, allowed) => {
    assert.equal(error, null);
    assert.equal(allowed, false);
  });
});

// 4. Reject duplicate origins.
test("CORS rejects duplicate origins", () => {
  assert.throws(
    () =>
      resolveCorsConfig({
        APP_ENV: "staging",
        CORS_ORIGINS: `${STAGING},${STAGING}`,
      }),
    /duplicate/
  );
});

// 5. Requests without an Origin header are allowed.
test("CORS allows requests without an Origin header", () => {
  const options = createCorsOptions(
    resolveCorsConfig({
      APP_ENV: "staging",
      CORS_ORIGINS: `${STAGING},${ANDROID}`,
    })
  );

  options.origin(undefined, (error, allowed) => {
    assert.equal(error, null);
    assert.equal(allowed, true);
  });
});

// 6. Staging responds correctly to website and Android preflight requests.
test("staging CORS responds to approved OPTIONS preflight requests", async (t) => {
  const app = express();

  const config = resolveCorsConfig({
    APP_ENV: "staging",
    CORS_ORIGINS: `${STAGING},${ANDROID}`,
  });

  app.use(cors(createCorsOptions(config)));

  app.put("/resource", (_req, res) => {
    res.json({ ok: true });
  });

  const server = app.listen(0, "127.0.0.1");

  t.after(() => new Promise((resolve) => server.close(resolve)));

  await new Promise((resolve) => server.once("listening", resolve));

  const port = server.address().port;

  const request = (origin) =>
    new Promise((resolve, reject) => {
      const call = http.request(
        {
          host: "127.0.0.1",
          port,
          method: "OPTIONS",
          path: "/resource",
          headers: {
            Origin: origin,
            "Access-Control-Request-Method": "PUT",
            "Access-Control-Request-Headers": "content-type,authorization",
          },
        },
        (response) => {
          response.resume();
          response.on("end", () => resolve(response));
        }
      );

      call.on("error", reject);
      call.end();
    });

  for (const origin of [STAGING, ANDROID]) {
    const response = await request(origin);

    assert.equal(response.statusCode, 204);
    assert.equal(
      response.headers["access-control-allow-origin"],
      origin
    );
    assert.equal(
      response.headers["access-control-allow-credentials"],
      "true"
    );
    assert.match(
      response.headers["access-control-allow-headers"],
      /authorization/i
    );
  }

  const rejected = await request(PRODUCTION);

  assert.equal(
    rejected.headers["access-control-allow-origin"],
    undefined
  );
});
