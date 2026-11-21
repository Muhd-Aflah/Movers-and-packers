
const PRODUCTION_ORIGINS = new Set([
  "https://swiftmove-movers-and-packers.vercel.app",
]);

const STAGING_ORIGINS = new Set([
  "http://localhost:5173",
  "https://swiftmove-staging.vercel.app",
  "https://localhost",
]);

const invalidCorsConfig = (message) =>
  Object.assign(new Error(message), {
    code: "INVALID_CORS_CONFIG",
  });

const parseOrigins = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    throw invalidCorsConfig(
      "CORS_ORIGINS must contain at least one explicitly approved origin"
    );
  }

  const origins = value.split(",").map((entry) => entry.trim()).filter(Boolean);

  if (origins.length === 0 || origins.some((origin) => origin === "*")) {
    throw invalidCorsConfig(
      "CORS_ORIGINS must not be empty or contain a wildcard"
    );
  }

  const normalized = origins.map((origin) => {
    let parsed;

    try {
      parsed = new URL(origin);
    } catch {
      throw invalidCorsConfig(
        "CORS_ORIGINS must contain valid origin URLs"
      );
    }

    if (
      parsed.origin !== origin ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      throw invalidCorsConfig(
        "CORS_ORIGINS entries must be bare origins without paths or credentials"
      );
    }

    return origin;
  });

  if (new Set(normalized).size !== normalized.length) {
    throw invalidCorsConfig(
      "CORS_ORIGINS must not contain duplicate origins"
    );
  }

  return normalized;
};

const resolveCorsConfig = (env = process.env) => {
  const environment =
    env.APP_ENV ||
    (env.NODE_ENV === "production" ? "production" : "development");

  if (!["staging", "production", "development"].includes(environment)) {
    throw invalidCorsConfig(
      "APP_ENV must be staging, production, or development"
    );
  }

  const origins = parseOrigins(env.CORS_ORIGINS);

  if (environment === "staging") {
    if (origins.some((origin) => !STAGING_ORIGINS.has(origin))) {
      throw invalidCorsConfig(
        "Staging CORS_ORIGINS may contain approved staging origins only"
      );
    }
  } else if (environment === "production") {
    if (origins.some((origin) => !PRODUCTION_ORIGINS.has(origin))) {
      throw invalidCorsConfig(
        "Production CORS_ORIGINS may contain approved production origins only"
      );
    }
  } else if (
    origins.some((origin) => {
      try {
        const parsed = new URL(origin);

        return (
          parsed.protocol !== "http:" ||
          !["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname)
        );
      } catch {
        return true;
      }
    })
  ) {
    throw invalidCorsConfig(
      "Development CORS_ORIGINS may contain explicitly configured localhost HTTP origins only"
    );
  }

  return { environment, origins };
};

const createCorsOptions = (config) => ({
  origin(origin, callback) {
    // Allow requests without an Origin header (e.g. server-to-server).
    if (!origin) {
      return callback(null, true);
    }

    if (config.origins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Razorpay-Signature",
    "X-Razorpay-Event-Id",
  ],

  exposedHeaders: ["X-Pagination"],
});

module.exports = {
  createCorsOptions,
  resolveCorsConfig,
};
