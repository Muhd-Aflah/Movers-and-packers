const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

// DEBUG (TEMPORARY – DO NOT SKIP)
console.log("protect:", typeof protect);
console.log("profile:", typeof authController.profile);
console.log("checkUser:", typeof authController.checkUser);
console.log("checkAdmin:", typeof authController.checkAdmin);

router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.get("/profile", protect, authController.profile);
router.get(
  "/check-user",
  protect,
  role("user", "admin"),
  authController.checkUser
);
router.get(
  "/check-admin",
  protect,
  role("admin"),
  authController.checkAdmin
);

module.exports = router;
