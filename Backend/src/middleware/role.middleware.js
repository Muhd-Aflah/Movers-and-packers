const User = require("../models/User.model");

module.exports = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (roles.includes("admin")) {
      if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });
      return (async () => {
        try {
          const user = await User.findById(req.user.id).select("role isActive moverApprovalStatus");
          if (!user) return res.status(401).json({ message: "Account no longer exists" });
          if (user.isActive === false) return res.status(401).json({ message: "Account is disabled" });
          if (!roles.includes(user.role)) return res.status(403).json({ message: "Access denied" });
          req.user = { id: String(user._id || req.user.id), role: user.role };
          req.currentUser = user;
          return next();
        } catch {
          return res.status(500).json({ message: "Could not verify account authorization" });
        }
      })();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};

module.exports.requireApprovedMover = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("role isActive moverApprovalStatus");
    if (!user) return res.status(401).json({ message: "Account no longer exists" });
    if (user.isActive === false) return res.status(401).json({ message: "Account is disabled" });
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
    req.user = { id: String(user._id || req.user.id), role: user.role };
    return next();
  } catch {
    return res.status(500).json({ message: "Could not verify mover approval status" });
  }
};
