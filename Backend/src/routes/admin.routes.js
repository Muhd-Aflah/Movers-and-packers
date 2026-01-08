const express = require("express");
const router = express.Router();

const { protect, admin } = require("../middleware/auth.middleware");

router.get("/check", protect, admin, (req, res) => {
  res.json({ message: "Admin route working" });
});

module.exports = router;
