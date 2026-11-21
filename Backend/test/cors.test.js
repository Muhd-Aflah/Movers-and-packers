
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
const LOCAL = "http://localhost:5173";

// 1. Staging accepts the exact documented origins and rejects production.
test("exact three-origin staging configuration is accepted", () => {
  const config = resolveCorsConfig({
    APP_ENV: "staging",
    CORS_ORIGINS: `${LOCAL},${STAGING},${ANDROID}`,
  });

  assert.deepEqual(config.origins, [LOCAL, STAGING, ANDROID]);

  assert.throws(
    () =>
      resolveCorsConfig({
        APP_ENV: "staging",
        CORS_ORIGINS: `${LOCAL},${STAGING},${ANDROID},${PRODUCTION}`,
      }),
    /approved staging/
  );

  assert.throws(
    () => resolveCorsConfig({
      APP_ENV: "staging",
      CORS_ORIGINS: `${LOCAL},${STAGING},${ANDROID},https://untrusted.example`,
    }),
    { code: "INVALID_CORS_CONFIG" },
  );

  const options = createCorsOptions(config);

  assert.deepEqual(options.exposedHeaders, ["X-Pagination"]);

  options.origin(STAGING, (error, allowed) => {
    assert.equal(error, null);
    assert.equal(allowed, true);
  });

  options.origin(LOCAL, (error, allowed) => {
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
      CORS_ORIGINS: `${LOCAL},${STAGING},${ANDROID}`,
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
      CORS_ORIGINS: `${LOCAL},${STAGING},${ANDROID}`,
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
    CORS_ORIGINS: `${LOCAL},${STAGING},${ANDROID}`,
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

  for (const origin of [LOCAL, STAGING, ANDROID]) {
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
    assert.match(
      response.headers["access-control-allow-methods"],
      /POST/i
    );
    assert.equal(response.headers["access-control-allow-credentials"], "true");
  }

  const rejected = await request(PRODUCTION);

  assert.equal(
    rejected.headers["access-control-allow-origin"],
    undefined
  );
});

test("pricing quote CORS supports allowed preflights, POSTs, and error responses", async (t) => {
  const pricingService = require("../src/services/pricing.service");
  t.mock.method(pricingService, "getBookingPriceQuote", async (booking) => {
    if (booking.invalid) {
      const error = new Error("Invalid quote input");
      error.statusCode = 400;
      throw error;
    }
    return { total: 1234, currency: "INR" };
  });
  const app = express();
  const config = resolveCorsConfig({
    APP_ENV: "staging",
    CORS_ORIGINS: `${LOCAL},${STAGING},${ANDROID}`,
  });
  app.use(cors(createCorsOptions(config)));
  app.use(express.json());
  app.use("/api/pricing", require("../src/routes/pricing.routes"));
  app.use((err, _req, res, _next) => res.status(500).json({ message: "Server Error" }));

  const server = app.listen(0, "127.0.0.1");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await new Promise((resolve) => server.once("listening", resolve));
  const port = server.address().port;
  const request = (origin, method, body) => new Promise((resolve, reject) => {
    const call = http.request({
      host: "127.0.0.1",
      port,
      method,
      path: "/api/pricing/quote",
      headers: {
        Origin: origin,
        ...(method === "OPTIONS" ? {
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "content-type,authorization",
        } : { "Content-Type": "application/json" }),
      },
    }, (response) => {
      let content = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { content += chunk; });
      response.on("end", () => resolve({
        statusCode: response.statusCode,
        headers: response.headers,
        body: content,
      }));
    });
    call.on("error", reject);
    if (body) call.write(JSON.stringify(body));
    call.end();
  });

  for (const origin of [LOCAL, STAGING]) {
    const preflight = await request(origin, "OPTIONS");
    assert.equal(preflight.statusCode, 204);
    assert.equal(preflight.headers["access-control-allow-origin"], origin);
    assert.equal(preflight.headers["access-control-allow-credentials"], "true");
    assert.match(preflight.headers["access-control-allow-methods"], /POST/);
    assert.match(preflight.headers["access-control-allow-headers"], /content-type/i);

    const success = await request(origin, "POST", { pickup: "Origin" });
    assert.equal(success.statusCode, 200);
    assert.equal(success.headers["access-control-allow-origin"], origin);
    assert.deepEqual(JSON.parse(success.body), {
      pricingAvailable: true,
      total: 1234,
      currency: "INR",
    });

    const failure = await request(origin, "POST", { invalid: true });
    assert.equal(failure.statusCode, 400);
    assert.equal(failure.headers["access-control-allow-origin"], origin);
  }

  const untrustedPreflight = await request(PRODUCTION, "OPTIONS");
  assert.equal(untrustedPreflight.headers["access-control-allow-origin"], undefined);
});
