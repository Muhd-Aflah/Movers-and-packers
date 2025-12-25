const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  res.json({ message: "Service request created" });
});

module.exports = router;
