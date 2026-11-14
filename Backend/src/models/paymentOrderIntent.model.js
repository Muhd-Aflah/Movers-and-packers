const mongoose = require("mongoose");

const paymentOrderIntentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  move: { type: mongoose.Schema.Types.ObjectId, ref: "Move", required: true, index: true },
  paymentOrder: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentOrder", default: null },
  pricingVersion: { type: Number, required: true, min: 0 },
  acceptedPricingVersion: { type: Number, default: null },
  amount: { type: Number, required: true, min: 0.01 },
  currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
  gateway: { type: String, enum: ["razorpay"], default: "razorpay" },
    status: {
    type: String,
    enum: ["initiated", "gateway_created", "completed", "failed", "reconciliation_required"],
    default: "initiated",
  },
  receipt: { type: String, required: true, unique: true },
  razorpayOrderId: { type: String, default: null, index: true },
  failureCode: { type: String, default: null, maxlength: 80 },
  requestedAt: { type: Date, required: true, default: Date.now },
  lastAttemptAt: { type: Date, default: null },
  reviewedAt: { type: Date, default: null },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reviewHistory: [{
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    at: { type: Date, required: true },
    action: { type: String, enum: ["review_note", "manual_resolution_reported", "verified_absent_manual"], required: true },
    reason: { type: String, required: true, maxlength: 1000 },
    externalReference: { type: String, default: null, maxlength: 240 },
  }],
}, { timestamps: true });

paymentOrderIntentSchema.index({ move: 1, pricingVersion: 1 }, { unique: true });
// Supports the admin unresolved-intent status filter and oldest-first order.
paymentOrderIntentSchema.index({ status: 1, requestedAt: 1, _id: 1 });

module.exports = mongoose.model("PaymentOrderIntent", paymentOrderIntentSchema);
