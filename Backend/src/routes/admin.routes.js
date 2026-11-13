const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const {
  getAllUsers,
  getAllMoves,
  getAdminDashboardStats,
  getAllProviders,
  getAllPayments,
  getMoversByApprovalStatus,
  getMoverApplication,
  approveMover,
  rejectMover,
} = require("../controllers/admin.controller");

// ADMIN: health check
router.get("/check", protect, allowRoles("admin"), (req, res) => {
  res.json({ message: "Admin route working" });
});

// ADMIN: get dashboard stats
router.get("/dashboard/stats", protect, allowRoles("admin"), getAdminDashboardStats);

// ADMIN: get all users
router.get("/users", protect, allowRoles("admin"), getAllUsers);

// ADMIN: get all moves
router.get("/moves", protect, allowRoles("admin"), getAllMoves);

// ADMIN: get all providers
router.get("/providers", protect, allowRoles("admin"), getAllProviders);

router.get("/movers", protect, allowRoles("admin"), getMoversByApprovalStatus);
router.get("/movers/:id", protect, allowRoles("admin"), getMoverApplication);
router.put("/movers/:id/approve", protect, allowRoles("admin"), approveMover);
router.put("/movers/:id/reject", protect, allowRoles("admin"), rejectMover);

// ADMIN: get all payments
router.get("/payments", protect, allowRoles("admin"), getAllPayments);

module.exports = router;
