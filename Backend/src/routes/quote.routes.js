const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { name, phone, pickup, drop, moveDate } = req.body;

    if (!name || !phone || !pickup || !drop || !moveDate) {
      return res.status(400).json({ message: "All fields required" });
    }

    res.status(201).json({
      success: true,
      message: "Quote submitted successfully",
    });
  } catch {
    res.status(500).json({ message: "Failed to submit quote" });
  }
});

module.exports = router;
