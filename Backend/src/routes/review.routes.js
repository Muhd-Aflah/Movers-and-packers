const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");


router.post("/review", (req, res) => {
  res.json({ message: "Review submitted" });
});

module.exports = router;
