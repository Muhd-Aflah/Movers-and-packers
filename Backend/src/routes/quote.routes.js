const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { name, phone, pickup, drop, moveDate } = req.body;

    if (!name || !phone || !pickup || !drop || !moveDate) {
      return res.status(400).json({ message: "All fields required" });
    }

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
