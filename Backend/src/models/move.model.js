const mongoose = require("mongoose");
const { PROPERTY_TYPES_BY_MOVE } = require("../services/bookingMetadata.service");

const approximateSizeSchema = new mongoose.Schema({
  value: { type: Number, min: 0 },
  unit: { type: String, enum: ["bhk", "sq_ft"] },
}, { _id: false });

const trackingEventSchema = new mongoose.Schema({
  event: {
    type: String,
    enum: [
      "booking_requested",
      "payment_confirmed",
      "booking_confirmed",
      "mover_assigned",
      "pickup_started",
      "in_transit",
      "delivery_completed",
    ],
    required: true,
  },
  at: { type: Date, required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  actorRole: { type: String, enum: ["user", "mover", "admin", "system"], required: true },
});

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
    // Optional for legacy moves; the booking creation contract validates and
    // persists all three fields together for new wizard requests.
    moveType: { type: String, enum: ["home_move", "office_move"] },
    propertyType: { type: String, enum: ["house", "apartment_flat", "office", "shop_commercial"] },
    approximateSize: { type: approximateSizeSchema, default: undefined },
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
    // Legacy moves keep an empty history. Events are appended only by the
    // server handlers that perform the corresponding authorized action.
    trackingEvents: { type: [trackingEventSchema], default: [] },
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

moveSchema.pre("validate", function validateBookingMetadata(next) {
  const hasMoveType = this.moveType !== undefined && this.moveType !== null;
  const hasPropertyType = this.propertyType !== undefined && this.propertyType !== null;
  const hasSize = this.approximateSize !== undefined && this.approximateSize !== null;
  const hasMetadata = hasMoveType || hasPropertyType || hasSize;
  if (!hasMetadata) return next();

  if (!hasMoveType || !hasPropertyType || !hasSize ||
    this.approximateSize.value === undefined || this.approximateSize.unit === undefined) {
    this.invalidate("moveType", "Move metadata fields must be provided together");
    return next();
  }
  if (!PROPERTY_TYPES_BY_MOVE[this.moveType]?.includes(this.propertyType)) {
    this.invalidate("propertyType", "Property type does not match the selected move type");
  }
  const { value, unit } = this.approximateSize;
  const expectedUnit = this.moveType === "home_move" ? "bhk" : "sq_ft";
  if (!Number.isFinite(value) || value <= 0) {
    this.invalidate("approximateSize.value", "Approximate size must be a positive finite number");
  } else if (unit !== expectedUnit) {
    this.invalidate("approximateSize.unit", `Approximate size unit must be ${expectedUnit}`);
  } else if (unit === "bhk" && !Number.isSafeInteger(value)) {
    this.invalidate("approximateSize.value", "BHK size must be a positive whole number");
  }
  return next();
});

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
