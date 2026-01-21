const express = require("express");
const { getUserById, updateUser } = require("../controllers/user.controller");
const { protect } = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();

// Get logged-in user profile
router.get("/:id", protect, getUserById);

// Update user profile
router.put("/:id", protect, updateUser);

module.exports = router;
