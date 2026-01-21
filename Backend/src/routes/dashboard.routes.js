const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { getUserDashboard } = require("../controllers/dashboard.controller");

router.get("/user", protect, getUserDashboard);

module.exports = router;
