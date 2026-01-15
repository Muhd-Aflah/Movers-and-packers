const express = require("express");
const router = express.Router();

// POST /api/quotes
router.post("/quotes", async (req, res, next) => {
  try {
    const { name, phone, pickup, drop, moveDate } = req.body;

    if (!name || !phone || !pickup || !drop || !moveDate) {
      return res.status(400).json({ message: "All fields required" });
    }

    // 🔹 For now just log (DB later)
    console.log("New Quote:", req.body);

    res.status(201).json({
      success: true,
      message: "Quote submitted successfully",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
