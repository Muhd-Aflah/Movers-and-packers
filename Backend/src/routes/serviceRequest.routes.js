const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");


router.post("/", (req, res) => {
  res.json({ message: "Service request created" });
});

module.exports = router;
