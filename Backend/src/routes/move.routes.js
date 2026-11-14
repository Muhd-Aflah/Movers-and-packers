const express = require("express");
const {
  createMove,
  getMyMoves,
  getMyMove,
  acceptMovePricing,
} = require("../controllers/move.controller");

const { protect } = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();

// USER
router.post("/", protect, allowRoles("user"), createMove); 
router.get("/my", protect, allowRoles("user"), getMyMoves);
router.post("/:id/accept-pricing", protect, allowRoles("user"), acceptMovePricing);
router.get("/:id", protect, allowRoles("user"), getMyMove);

module.exports = router;
