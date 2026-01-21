const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    gateway: {
      type: String,
      enum: ["razorpay", "cash"],
      default: "razorpay",
    },

    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,

    paymentStatus: {
      type: String,
      enum: ["created", "paid", "failed", "refunded"],
      default: "created",
    },

    releaseStatus: {
      type: String,
      enum: ["held", "released"],
      default: "held", // escrow-ready
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
