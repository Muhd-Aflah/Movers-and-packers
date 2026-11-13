const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const { requireApprovedMover } = allowRoles;

const {
  getCurrentJob,
  getAvailableMoves,
  acceptMove,
  getMyJobs,
  updateMoveStatus,
} = require("../controllers/provider.controller");

// Provider Dashboard
router.get("/current-job", protect, allowRoles("mover"), requireApprovedMover, getCurrentJob);
router.get("/available-moves", protect, allowRoles("mover"), requireApprovedMover, getAvailableMoves);
router.get("/my-jobs", protect, allowRoles("mover"), requireApprovedMover, getMyJobs);

router.put("/moves/:id/accept", protect, allowRoles("mover"), requireApprovedMover, acceptMove);
router.put("/moves/:id/status", protect, allowRoles("mover"), requireApprovedMover, updateMoveStatus);

module.exports = router;
