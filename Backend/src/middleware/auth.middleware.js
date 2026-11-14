const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
      req.authenticatedId = decoded.id;
    } catch {
      return res.status(401).json({ message: "Not authorized, token invalid" });
    }

    try {
      const user = await User.findById(req.authenticatedId).select("role isActive moverApprovalStatus");
      if (!user) return res.status(401).json({ message: "Account no longer exists" });
      // Legacy documents without isActive remain active. Explicit false is the
      // only disabled value, so existing accounts are not locked out.
      if (user.isActive === false) return res.status(401).json({ message: "Account is disabled" });
      req.user = { id: String(user._id || req.authenticatedId), role: user.role };
      req.currentUser = user;
      return next();
    } catch {
      return res.status(503).json({ message: "Could not verify account authorization" });
    }
  }

  return res.status(401).json({ message: "Not authorized, no token" });
};

module.exports = { protect };
