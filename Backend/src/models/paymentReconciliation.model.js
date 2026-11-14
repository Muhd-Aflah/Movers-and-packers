const mongoose = require("mongoose");

const paymentReconciliationSchema = new mongoose.Schema(
  {
    gateway: { type: String, enum: ["razorpay"], default: "razorpay", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    move: { type: mongoose.Schema.Types.ObjectId, ref: "Move", default: null, index: true },
    paymentOrder: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentOrder", default: null, index: true },
    paymentOrderIntent: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentOrderIntent", default: null, index: true },
    razorpayOrderId: { type: String, required: true, index: true },
    razorpayPaymentId: { type: String, required: true, unique: true, index: true },
    amountMinorUnits: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
    gatewayPaymentStatus: { type: String, required: true },
    reason: { type: String, required: true, maxlength: 240 },
    source: { type: String, enum: ["checkout_verification", "webhook", "recovery"], required: true },
    quoteVersion: { type: Number, default: null },
    currentQuoteVersion: { type: Number, default: null },
    expectedAmountMinorUnits: { type: Number, default: null },
    expectedCurrency: { type: String, default: null },
    webhookEventId: { type: String, default: null },
    status: { type: String, enum: ["pending_review", "resolved", "refunded", "credited", "failed"], default: "pending_review" },
    receivedAt: { type: Date, required: true, default: Date.now },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewHistory: [{
      admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      at: { type: Date, required: true },
      action: { type: String, enum: ["review_note", "manual_resolution_reported"], required: true },
      reason: { type: String, required: true, maxlength: 1000 },
      externalReference: { type: String, default: null, maxlength: 240 },
    }],
  },
  { timestamps: true },
);

// The default/admin status-filtered review query sorts by receivedAt.
paymentReconciliationSchema.index({ status: 1, receivedAt: 1, _id: 1 });
// The status=all review view uses the same chronological order without a filter.
paymentReconciliationSchema.index({ receivedAt: 1, _id: 1 });

module.exports = mongoose.model("PaymentReconciliation", paymentReconciliationSchema);
