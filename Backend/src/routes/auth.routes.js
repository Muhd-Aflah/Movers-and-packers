const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

// Public routes
router.post("/signup", authController.signup);
router.post("/login", authController.login);

// Protected routes
router.get("/profile", protect, authController.profile);
router.get("/check-user", protect, role("user", "admin"), authController.checkUser);
router.get("/check-admin", protect, role("admin"), authController.checkAdmin);

module.exports = router;
