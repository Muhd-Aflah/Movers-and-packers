const express = require("express");
const {
  createMove,
  getMyMoves,
  getAvailableMoves,
  acceptMove,
} = require("../controllers/move.controller");

const { protect } = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();

// USER
router.post("/", protect, allowRoles("user"), createMove); // New route to create a move
router.get("/my", protect, allowRoles("user"), getMyMoves);

// PROVIDER
router.get("/available", protect, allowRoles("provider"), getAvailableMoves);
router.patch("/:id/accept", protect, allowRoles("provider"), acceptMove);

module.exports = router;
