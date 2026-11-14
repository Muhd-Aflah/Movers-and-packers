const mongoose = require("mongoose");

const paymentWebhookEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true, index: true },
  eventType: { type: String, required: true },
  razorpayOrderId: { type: String, default: null },
  razorpayPaymentId: { type: String, default: null },
  status: { type: String, enum: ["processing", "processed", "failed"], default: "processing", index: true },
  leaseToken: { type: String, select: false, default: null },
  leaseUntil: { type: Date, default: Date.now, index: true },
  attempts: { type: Number, default: 0, min: 0 },
  lastErrorCode: { type: String, default: null, maxlength: 80 },
  processedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model("PaymentWebhookEvent", paymentWebhookEventSchema);
