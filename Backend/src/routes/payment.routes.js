const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const paymentController = require("../controllers/payment.controller");

/* NORMAL JSON ROUTES */
router.post("/create-order", protect, paymentController.createOrder);
router.post("/verify", protect, paymentController.verifyPayment);

/* WEBHOOK — RAW BODY, ISOLATED */
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentController.webhook
);

module.exports = router;
