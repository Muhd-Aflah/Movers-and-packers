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
      enum: ["unpriced", "priced"],
      default: "unpriced",
    },
    pricing: {
      currency: String,
      distanceKm: Number,
      routeProvider: String,
      pickupResolved: String,
      dropoffResolved: String,
      calculatedAt: Date,
      breakdown: {
        baseBookingCharge: Number,
        pricePerKilometre: Number,
        distanceCharge: Number,
        serviceCharge: Number,
        loadingCharge: Number,
        unloadingCharge: Number,
        subtotal: Number,
        minimumBookingCharge: Number,
        minimumAdjustment: Number,
        total: Number,
      },
    },
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

module.exports = mongoose.model("Move", moveSchema);
