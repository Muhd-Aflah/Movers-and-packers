const mongoose = require("mongoose");

const serviceRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    serviceType: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["created", "connected", "stored", "shipped", "delivered"],
      default: "created"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceRequest", serviceRequestSchema);
