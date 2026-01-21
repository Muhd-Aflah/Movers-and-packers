const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/order.model");
const Payment = require("../models/Payment.model");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// CREATE ORDER (Razorpay + Mongo)
exports.createOrder = async (req, res) => {
  const { bookingData } = req.body;

  // 1. Create DB Order
  const order = await Order.create({
    user: req.user.id,
    pickup: bookingData.origin,
    dropoff: bookingData.destination,
    service: bookingData.service,
    moveDate: bookingData.moveDate,
    price: bookingData.price,
  });

  // 2. Create Razorpay Order
  const rpOrder = await razorpay.orders.create({
    amount: bookingData.price * 100,
    currency: "INR",
    receipt: `order_${order._id}`,
  });

  // 3. Create Payment record
  await Payment.create({
    user: req.user.id,
    order: order._id,
    razorpayOrderId: rpOrder.id,
    amount: bookingData.price,
  });

  res.json(rpOrder);
};

// VERIFY PAYMENT
exports.verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expected !== razorpay_signature) {
    return res.status(400).json({ message: "Invalid signature" });
  }

  // Update Payment
  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId: razorpay_order_id },
    {
      razorpayPaymentId: razorpay_payment_id,
      status: "paid",
    },
    { new: true }
  );

  // Update Order
  await Order.findByIdAndUpdate(payment.order, {
    status: "paid",
  });

  res.json({ success: true });
};
