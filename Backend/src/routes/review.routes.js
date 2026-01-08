const express = require("express");
const router = express.Router();

router.post("/review", (req, res) => {
  res.json({ message: "Review submitted" });
});

module.exports = router;
