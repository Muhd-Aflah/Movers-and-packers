const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const { getMyNotifications } = require("../controllers/notification.controller");

const router = express.Router();

router.get("/customer", protect, allowRoles("user"), getMyNotifications);
router.get("/mover", protect, allowRoles("mover"), allowRoles.requireApprovedMover, getMyNotifications);

module.exports = router;
