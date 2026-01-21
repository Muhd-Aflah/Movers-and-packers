const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const {
  getCurrentJob,
  getAvailableMoves,
  acceptMove,
  getMyJobs,
  updateMoveStatus,
} = require("../controllers/provider.controller");

// Provider Dashboard
router.get("/current-job", protect, allowRoles("mover"), getCurrentJob);
router.get("/available-moves", protect, allowRoles("mover"), getAvailableMoves);
router.get("/my-jobs", protect, allowRoles("mover"), getMyJobs);

router.put("/moves/:id/accept", protect, allowRoles("mover"), acceptMove);
router.put("/moves/:id/status", protect, allowRoles("mover"), updateMoveStatus);

module.exports = router;
