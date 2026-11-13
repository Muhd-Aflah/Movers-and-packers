const User = require("../models/User.model");

module.exports = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};

module.exports.requireApprovedMover = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("role moverApprovalStatus");
    if (!user) return res.status(401).json({ message: "Account no longer exists" });
    if (user.role !== "mover") {
      return res.status(403).json({ message: "Mover access is required" });
    }
    if (user.moverApprovalStatus !== "approved") {
      const status = user.moverApprovalStatus || "pending";
      return res.status(403).json({
        code: "MOVER_NOT_APPROVED",
        status,
        message: status === "rejected"
          ? "Mover application was rejected"
          : "Mover application is awaiting admin review",
      });
    }
    req.currentUser = user;
    return next();
  } catch {
    return res.status(500).json({ message: "Could not verify mover approval status" });
  }
};
