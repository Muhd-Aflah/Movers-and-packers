const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    move: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Move",
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentOrder",
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
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
      select: false,
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
      // Legacy application marker only; this does not reflect Razorpay fund
      // custody or settlement. No current controller marks funds released.
    },
  },
  { timestamps: true },
);

// Supports customer payment history and dashboard reads without a blocking sort.
paymentSchema.index({ user: 1, createdAt: -1, _id: -1 });
// Supports the admin payment list's stable newest-first ordering.
paymentSchema.index({ createdAt: -1, _id: -1 });
// Supports paid-revenue aggregation by currency for admin and customer dashboards.
paymentSchema.index({ paymentStatus: 1, currency: 1 });
paymentSchema.index({ user: 1, paymentStatus: 1, currency: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
