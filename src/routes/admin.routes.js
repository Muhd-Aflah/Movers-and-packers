const express = require("express");
const router = express.Router();

router.get("/check", (req, res) => {
  res.json({ message: "Admin route working" });
});

module.exports = router;
