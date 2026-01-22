const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    move: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Move",
      required: true,
      index: true,
    },

    // Amount in INR
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    gateway: {
      type: String,
      enum: ["razorpay", "cash"],
      default: "razorpay",
    },

    razorpayOrderId: {
      type: String,
      required: true,
      index: true,
    },

    razorpayPaymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    razorpaySignature: {
      type: String,
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["created", "paid", "failed", "refunded"],
      default: "paid",
    },
    releaseStatus: {
      type: String,
      enum: ["held", "released"],
      default: "held",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", paymentSchema);
