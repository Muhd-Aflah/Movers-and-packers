import express from "express";
import { getUserById, updateUser } from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get user profile
router.get("/:id", protect, getUserById);

// Update user profile
router.put("/:id", protect, updateUser);

export default router;
