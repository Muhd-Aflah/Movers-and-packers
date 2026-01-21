const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    pickup: { type: String, required: true },
    dropoff: { type: String, required: true },
    moveDate: { type: Date },

    service: {
      type: String,
      enum: ["warehousing", "freight", "packaging", "delivery", "custom"],
      required: true,
    },

    price: { type: Number, required: true },

    status: {
      type: String,
      enum: ["pending", "paid", "assigned", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
