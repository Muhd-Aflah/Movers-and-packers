const mongoose = require("mongoose");

const paymentProcessingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  move: { type: mongoose.Schema.Types.ObjectId, ref: "Move", default: null, index: true },
  paymentOrder: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentOrder", default: null },
  gateway: { type: String, enum: ["razorpay"], default: "razorpay", required: true },
  razorpayOrderId: { type: String, required: true, index: true },
  razorpayPaymentId: { type: String, required: true, unique: true, index: true },
  amountMinorUnits: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
  source: { type: String, enum: ["checkout_verification", "webhook", "recovery"], required: true },
  webhookEventId: { type: String, default: null },
  status: { type: String, enum: ["processing", "credited", "reconciliation_required"], default: "processing", index: true },
  leaseToken: { type: String, select: false, default: null },
  leaseUntil: { type: Date, default: Date.now, index: true },
  attempts: { type: Number, default: 0, min: 0 },
  lastErrorCode: { type: String, default: null, maxlength: 80 },
  lastAttemptAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model("PaymentProcessing", paymentProcessingSchema);
