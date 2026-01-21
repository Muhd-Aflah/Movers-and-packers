const Razorpay = require("razorpay");
const crypto = require("crypto");
const Move = require("../models/move.model");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// CREATE ORDER
exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Order creation failed" });
  }
};

// VERIFY PAYMENT + CREATE MOVE
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingData,
    } = req.body;

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    // CREATE MOVE
    await Move.create({
      user: req.user.id,
      pickup: bookingData.origin,
      dropoff: bookingData.destination,
      moveDate: bookingData.moveDate,
      price: bookingData.price,
      paid: true,
      status: "accepted",
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Verification failed" });
  }
};
