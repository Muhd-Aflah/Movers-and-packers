const { getRecentNotifications } = require("../services/notification.service");

exports.getMyNotifications = async (req, res) => {
  if (!req.user || !["user", "mover"].includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  try {
    const notifications = await getRecentNotifications({ userId: req.user.id, role: req.user.role });
    return res.json({ notifications });
  } catch {
    return res.status(500).json({ message: "Could not fetch notifications" });
  }
};
