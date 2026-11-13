const User = require("../models/User.model");
const jwt = require("jsonwebtoken");
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_BCRYPT_PASSWORD_BYTES = 72;

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  ...(user.role === "mover"
    ? {
        moverApprovalStatus: user.moverApprovalStatus || "pending",
        moverReviewReason: user.moverApprovalStatus === "rejected" ? user.moverReviewReason || "" : undefined,
      }
    : {}),
});

const validEmail = (email) =>
  email.length <= MAX_EMAIL_LENGTH && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const generateToken = (id, role) => {
  if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET) < 32) {
    throw new Error("JWT signing is not configured");
  }
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
    algorithm: "HS256",
  });
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (
      typeof name !== "string" || !name.trim() ||
      name.trim().length > MAX_NAME_LENGTH ||
      typeof email !== "string" || !email.trim() || !validEmail(email.trim()) ||
      typeof password !== "string" || !password ||
      Buffer.byteLength(password, "utf8") > MAX_BCRYPT_PASSWORD_BYTES
    ) {
      return res.status(400).json({ message: "Enter a valid name, email, and password no longer than 72 UTF-8 bytes" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({
      email: { $regex: `^${escapeRegExp(normalizedEmail)}$`, $options: "i" },
    });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // "mover" is the persisted provider role used by the User schema.
    // Admin accounts must be provisioned out of band, never through signup.
    const allowedRoles = ["user", "mover"];
    const safeRole = allowedRoles.includes(role) ? role : "user";

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: safeRole,
      ...(safeRole === "mover" ? { moverApprovalStatus: "pending" } : {}),
    });

    res.status(201).json({
      token: generateToken(user._id, user.role),
      user: publicUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Signup failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (
      typeof email !== "string" || !email.trim() || !validEmail(email.trim()) ||
      typeof password !== "string" || !password ||
      Buffer.byteLength(password, "utf8") > MAX_BCRYPT_PASSWORD_BYTES
    ) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.trim();
    const user = await User.findOne({
      email: { $regex: `^${escapeRegExp(normalizedEmail)}$`, $options: "i" },
    });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      token: generateToken(user._id, user.role),
      user: publicUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
};

exports.profile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name email role phone moverApprovalStatus moverReviewReason",
    );
    if (!user) return res.status(404).json({ message: "Account not found" });
    return res.json({ success: true, user: publicUser(user) });
  } catch {
    return res.status(500).json({ message: "Could not fetch account profile" });
  }
};
