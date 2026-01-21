const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const {
  createOrder,
  verifyPayment,
} = require("../controllers/payment.controller");

router.post("/create-order", protect, createOrder);
router.post("/verify", protect, verifyPayment);

module.exports = router;
