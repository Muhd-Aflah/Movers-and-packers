const { getRecentNotifications } = require("../services/notification.service");
const Notification = require("../models/notification.model");
const { emitToUser } = require("../realtime/socket");
const mongoose = require("mongoose");

exports.getMyNotifications = async (req, res) => {
  if (!req.user || !["user", "mover", "admin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  try {
    const notifications = await getRecentNotifications({ userId: req.user.id, role: req.user.role });
    return res.json({ notifications });
  } catch {
    return res.status(500).json({ message: "Could not fetch notifications" });
  }
};

exports.markNotificationRead = async (req, res) => {
  if (!req.user || !["user", "mover", "admin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid notification ID" });
  }
  try {
    const now = new Date();
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id, recipientRole: req.user.role, readAt: null },
      { $set: { readAt: now } },
      { new: true, runValidators: true },
    );
    if (notification) {
      const payload = { notificationId: String(notification._id), readAt: now.toISOString() };
      emitToUser(req.user.id, "notification:read", payload);
      return res.json({ notificationId: payload.notificationId, readAt: payload.readAt });
    }
    const existing = await Notification.findOne({ _id: req.params.id, recipient: req.user.id, recipientRole: req.user.role });
    if (!existing) return res.status(404).json({ message: "Notification not found" });
    return res.json({ notificationId: String(existing._id), readAt: existing.readAt?.toISOString() || null });
  } catch {
    return res.status(500).json({ message: "Could not update notification" });
  }
};
