const buckets = new Map();
let requestCount = 0;
let nextLimiterId = 1;

const createRateLimiter = ({ windowMs, max, message = "Too many requests. Try again later." }) => {
  const limiterId = nextLimiterId++;
  return (req, res, next) => {
    const now = Date.now();
    const address = req.ip || req.socket?.remoteAddress || "unknown";
    const key = `${limiterId}:${address}`;
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      if (++requestCount % 256 === 0) {
        for (const [address, entry] of buckets) {
          if (entry.resetAt <= now) buckets.delete(address);
        }
      }

      // Bound memory use if clients can present a large number of source IPs.
      if (!bucket && buckets.size >= 10000) {
        for (const [address, entry] of buckets) {
          if (entry.resetAt <= now) buckets.delete(address);
        }
        if (buckets.size >= 10000) {
          return res.status(503).json({ message: "Request capacity is temporarily limited" });
        }
      }

      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    if (bucket.count >= max) {
      res.set("Retry-After", String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
      return res.status(429).json({ message });
    }

    bucket.count += 1;
    return next();
  };
};

module.exports = { createRateLimiter };
