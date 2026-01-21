const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");

// Public routes
router.post("/signup", authController.signup);
router.post("/login", authController.login);

// Protected route
router.get("/profile", protect, authController.profile);

module.exports = router;
