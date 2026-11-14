const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const {
  getPendingPackingEstimates,
  submitPackingEstimate,
} = require("../controllers/adminPricing.controller");
const paymentController = require("../controllers/payment.controller");

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
router.get("/moves/manual-estimates", protect, allowRoles("admin"), getPendingPackingEstimates);
router.put("/moves/:id/packing-estimate", protect, allowRoles("admin"), submitPackingEstimate);

// ADMIN: get all providers
router.get("/providers", protect, allowRoles("admin"), getAllProviders);

router.get("/movers", protect, allowRoles("admin"), getMoversByApprovalStatus);
router.get("/movers/:id", protect, allowRoles("admin"), getMoverApplication);
router.put("/movers/:id/approve", protect, allowRoles("admin"), approveMover);
router.put("/movers/:id/reject", protect, allowRoles("admin"), rejectMover);

// ADMIN: get all payments
router.get("/payments", protect, allowRoles("admin"), getAllPayments);
router.get("/payments/reconciliation", protect, allowRoles("admin"), paymentController.getReconciliations);
router.post("/payments/reconciliation/:id/review", protect, allowRoles("admin"), paymentController.reviewReconciliation);
router.get("/payments/reconciliation/order-intents", protect, allowRoles("admin"), paymentController.getOrderIntentReviews);
router.post("/payments/reconciliation/order-intents/:id/review", protect, allowRoles("admin"), paymentController.reviewOrderIntent);

module.exports = router;
