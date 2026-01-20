const express = require("express");
const {
  getMyMoves,
  getAvailableMoves,
  acceptMove,
} = require("../controllers/move.controller");

const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

// USER: My moves

router.get("/my", protect, allowRoles("user"), getMyMoves);

// PROVIDER: Available moves

router.get("/available", protect, allowRoles("provider"), getAvailableMoves);

// PROVIDER: Accept move

router.patch("/:id/accept", protect, allowRoles("provider"), acceptMove);

module.exports = router;
