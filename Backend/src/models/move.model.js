const mongoose = require("mongoose");

const moveSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    pickup: {
      address: String,
      city: String,
    },
    dropoff: {
      address: String,
      city: String,
    },
    service: {
      type: String,
      enum: ["warehousing", "freight", "packaging", "delivery", "custom"],
    },
    serviceMode: {
      type: String,
      enum: ["transport_only", "full_service"],
      required: true,
      default: "transport_only",
    },
    vehicleType: {
      type: String,
      enum: ["three_wheeler_eeco", "tata_ace", "pickup_bolero", "tata_407_14ft", "truck_17ft", "truck_20_32ft"],
      required: true,
    },
    inventory: { type: mongoose.Schema.Types.Mixed, default: {} },
    packingMaterials: { type: mongoose.Schema.Types.Mixed, default: {} },
    workers: { type: mongoose.Schema.Types.Mixed, default: {} },
    weight: {
      type: Number,
      min: 0.001,
    },
    loadingRequired: {
      type: Boolean,
      default: false,
    },
    unloadingRequired: {
      type: Boolean,
      default: false,
    },
    moveDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["requested", "accepted", "in_progress", "completed", "cancelled"],
      default: "requested",
    },
    price: {
      type: Number,
      min: 0,
    },
    pricingStatus: {
      type: String,
      enum: ["unpriced", "manual_review", "pending_acceptance", "priced"],
      default: "unpriced",
    },
    // Server-generated route and transport baseline for an admin-priced move.
    pricingDraft: { type: mongoose.Schema.Types.Mixed, immutable: true },
    // Active server-calculated snapshot. Admin revisions are versioned in pricingAudit.
    pricing: { type: mongoose.Schema.Types.Mixed },
    pricingVersion: { type: Number, default: 0, min: 0 },
    pricingAcceptanceRequired: { type: Boolean, default: false },
    pricingAcceptedAt: { type: Date, default: null },
    pricingAcceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    acceptedPricingVersion: { type: Number, default: null },
    pricingAudit: [{
      admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      at: { type: Date, required: true },
      previousVersion: { type: Number, required: true },
      updatedVersion: { type: Number, required: true },
      previousEstimate: { type: mongoose.Schema.Types.Mixed, default: null },
      updatedEstimate: { type: mongoose.Schema.Types.Mixed, required: true },
    }],
    paid: {
      type: Boolean,
      default: false,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
    // Distributed lock serializing order creation and payment verification.
    // Hidden from API serialization because this is internal coordination data.
    paymentOrderLock: {
      token: { type: String, select: false },
      expiresAt: { type: Date, select: false },
    },
    review: {
      rating: Number,
      comment: String,
    },
  },
  { timestamps: true }
);

// Supports customer move history and the customer dashboard's stable sort.
moveSchema.index({ user: 1, createdAt: -1, _id: -1 });
// Supports the dashboard's paid-move count without scanning all customer moves.
moveSchema.index({ user: 1, paid: 1 });
// Supports admin move lists ordered by creation time.
moveSchema.index({ createdAt: -1, _id: -1 });
// Supports a mover's assigned-job history and current-job lookup.
moveSchema.index({ provider: 1, createdAt: -1, _id: -1 });
// Supports the available-move filter and its creation-time ordering.
moveSchema.index({ status: 1, provider: 1, paid: 1, pricingStatus: 1, createdAt: -1, _id: -1 });
// Supports the admin manual-estimate queue and its oldest-first ordering.
moveSchema.index({ serviceMode: 1, pricingStatus: 1, createdAt: 1, _id: 1 });
// Supports scheduled booking counts over a moving-date range.
moveSchema.index({ moveDate: 1 });

module.exports = mongoose.model("Move", moveSchema);
