const User = require("../models/User.model");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
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

const validateRegistration = (body) => {
  const { name, email, password } = body || {};
  if (
    typeof name !== "string" || !name.trim() ||
    name.trim().length > MAX_NAME_LENGTH ||
    typeof email !== "string" || !email.trim() || !validEmail(email.trim()) ||
    typeof password !== "string" || !password ||
    Buffer.byteLength(password, "utf8") > MAX_BCRYPT_PASSWORD_BYTES
  ) {
    return { error: "Enter a valid name, email, and password no longer than 72 UTF-8 bytes" };
  }
  return {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
  };
};

const createAccount = async (req, res, role) => {
  const requestId = crypto.randomUUID();
  let phase = "validate-input";
  try {
    const registration = validateRegistration(req.body);
    if (registration.error) return res.status(400).json({ message: registration.error });

    phase = "check-duplicate-email";
    const existingUser = await User.findOne({
      email: { $regex: `^${escapeRegExp(registration.email)}$`, $options: "i" },
    });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    phase = "create-account";
    const user = await User.create({
      ...registration,
      role,
      ...(role === "mover" ? { moverApprovalStatus: "pending" } : {}),
    });

    phase = "issue-token";
    const token = generateToken(user._id, user.role);
    return res.status(201).json({ token, user: publicUser(user) });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }
    if (error?.name === "ValidationError") {
      return res.status(400).json({ message: "Account details failed validation" });
    }

    // Log only a correlation ID, operation phase, error type and numeric code.
    // Never log request bodies, email, password, token, URI, or raw error text.
    console.error("Signup operation failed", {
      requestId,
      phase,
      errorName: typeof error?.name === "string" ? error.name : "Error",
      errorCode: Number.isInteger(error?.code) ? error.code : undefined,
    });
    return res.status(500).json({ message: "Signup failed", requestId });
  }
};

exports.signup = async (req, res) => {
  const requestedRole = req.body?.role;
  if (requestedRole !== undefined && requestedRole !== "user") {
    return res.status(400).json({
      message: "Public signup only creates customer accounts. Use the mover application form to apply as a mover.",
    });
  }
  return createAccount(req, res, "user");
};

exports.moverApplication = async (req, res) => {
  return createAccount(req, res, "mover");
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
