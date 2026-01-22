const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const paymentController = require("../controllers/payment.controller");

router.post("/create-order", protect, paymentController.createOrder);

router.post("/verify", protect, paymentController.verifyPayment);

router.get("/my", protect, paymentController.getMyPayments);

module.exports = router;
