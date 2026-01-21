const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/Payment.model");
const Order = require("../models/order.model");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
  console.log("createOrder function called");
  try {
    const { amount, notes } = req.body; // Expect notes to contain orderId
    const { orderId } = notes;

    if (!amount || amount <= 0 || !orderId) {
      console.log("Invalid data for Razorpay order creation:", { amount, orderId });
      return res.status(400).json({ message: "Invalid amount or missing orderId" });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: { orderId }, // Pass orderId to Razorpay notes
    });

    console.log("Razorpay Order created:", razorpayOrder);

    // Update our internal Order model with the Razorpay Order ID
    await Order.findByIdAndUpdate(orderId, { razorpayOrderId: razorpayOrder.id });

    res.status(200).json({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (err) {
    console.error("Create Order Error:", err);
    res.status(500).json({ message: "Failed to create Razorpay order" });
  }
};

exports.verifyPayment = async (req, res) => { // Made async
  console.log("verifyPayment function called");
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.log("Missing payment data:", { razorpay_order_id, razorpay_payment_id, razorpay_signature });
      return res.status(400).json({ message: "Missing payment data" });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    console.log("Signature body:", body);

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    console.log("Expected signature:", expectedSignature);
    console.log("Received signature:", razorpay_signature);

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // Payment is verified! Now, update our database
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });

    if (!order) {
      console.error("Order not found for Razorpay Order ID:", razorpay_order_id);
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Create a new Payment record
    const newPayment = new Payment({
      user: req.user.id,
      order: order._id,
      amount: order.price,
      gateway: "razorpay",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentStatus: "paid",
      releaseStatus: "held", // Default to held, can be released later by admin
    });

    await newPayment.save();

    // Update the Order status
    order.status = "paid";
    await order.save();

    res.status(200).json({ success: true, message: "Payment verified and recorded" });
  } catch (err) {
    console.error("Verify Payment Error:", err);
    res.status(500).json({ message: "Verification failed" });
  }
};

exports.webhook = (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    const expected = crypto
      .createHmac("sha256", secret)
      .update(req.body)
      .digest("hex");

    if (signature !== expected) {
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    const event = JSON.parse(req.body.toString());

    console.log("Webhook event:", event.event);

    // TODO: Handle different webhook events (e.g., payment.captured, payment.failed)
    // You might want to update paymentStatus and order.status here as well

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook Error:", err);
    res.status(500).json({ message: "Webhook failed" });
  }
};
