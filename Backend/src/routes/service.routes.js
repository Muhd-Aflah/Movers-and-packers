const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");


router.get("/", (req, res) => {
  res.json({ message: "Services list working" });
});

module.exports = router;
