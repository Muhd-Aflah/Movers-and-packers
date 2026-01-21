const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
  console.log("createOrder function called");
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      console.log("Invalid amount:", amount);
      return res.status(400).json({ message: "Invalid amount" });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    console.log("Razorpay Order created:", order);

    res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error("Create Order Error:", err);
    res.status(500).json({ message: "Failed to create order" });
  }
};

exports.verifyPayment = (req, res) => {
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

    res.status(200).json({ success: true });
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

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook Error:", err);
    res.status(500).json({ message: "Webhook failed" });
  }
};
