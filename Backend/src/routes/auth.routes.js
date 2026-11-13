const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const { createRateLimiter } = require("../middleware/rateLimit.middleware");

const signupRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many signup attempts. Try again later.",
});
const loginRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many login attempts. Try again later.",
});

// Public routes
router.post("/signup", signupRateLimit, authController.signup);
router.post("/mover-application", signupRateLimit, authController.moverApplication);
router.post("/login", loginRateLimit, authController.login);

// Protected route
router.get("/profile", protect, authController.profile);

module.exports = router;
