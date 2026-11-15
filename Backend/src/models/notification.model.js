const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipientRole: { type: String, enum: ["user", "mover", "admin"], required: true },
  eventKey: { type: String, required: true, maxlength: 240 },
  type: { type: String, required: true, maxlength: 80 },
  title: { type: String, required: true, maxlength: 120 },
  message: { type: String, required: true, maxlength: 500 },
  relatedMove: { type: mongoose.Schema.Types.ObjectId, ref: "Move", default: null },
  sourceTrackingEvent: { type: String, maxlength: 80, default: null },
  readAt: { type: Date, default: null },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, eventKey: 1 }, { unique: true });
notificationSchema.index({ recipient: 1, createdAt: -1, _id: -1 });
notificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
