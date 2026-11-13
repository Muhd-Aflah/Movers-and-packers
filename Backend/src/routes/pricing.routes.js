const express = require("express");
const { createQuote } = require("../controllers/pricing.controller");
const { createRateLimiter } = require("../middleware/rateLimit.middleware");

const router = express.Router();
const quoteRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many quote requests. Try again later.",
});

router.post("/quote", quoteRateLimit, createQuote);

module.exports = router;
