module.exports = (req, res, next) => {
  const startedAt = process.hrtime.bigint();

  res.once("finish", () => {
    const routePath = req.route?.path;
    const route = routePath ? `${req.baseUrl}${routePath}` : "unmatched";
    const durationMs = Number((process.hrtime.bigint() - startedAt) / 1_000_000n);

    // Route templates, status, and duration are sufficient for latency analysis;
    // do not log query strings, request bodies, headers, or user identifiers.
    console.info(JSON.stringify({
      type: "http_request",
      method: req.method,
      route,
      status: res.statusCode,
      durationMs,
    }));
  });

  next();
};
