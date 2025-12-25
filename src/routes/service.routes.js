const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Services list working" });
});

module.exports = router;
