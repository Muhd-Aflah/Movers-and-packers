const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const { getMyNotifications, markNotificationRead } = require("../controllers/notification.controller");

const router = express.Router();
const requireMoverApprovalWhenNeeded = (req, res, next) =>
  req.user?.role === "mover" ? allowRoles.requireApprovedMover(req, res, next) : next();

router.get("/customer", protect, allowRoles("user"), getMyNotifications);
router.get("/mover", protect, allowRoles("mover"), allowRoles.requireApprovedMover, getMyNotifications);
router.get("/admin", protect, allowRoles("admin"), getMyNotifications);
router.patch("/:id/read", protect, allowRoles("user", "admin", "mover"), requireMoverApprovalWhenNeeded, markNotificationRead);

module.exports = router;
