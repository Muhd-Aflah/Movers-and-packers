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
      default: null,
    },

    paid: {
      type: Boolean,
      default: false,
    },

    review: {
      rating: Number,
      comment: String,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Move", moveSchema);
