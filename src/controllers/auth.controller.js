const User = require("../models/User.model");
const jwt = require("jsonwebtoken");

// helper to generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

// Signup
exports.signup = async (req, res) => {
  const { name, email, password, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id),
  });
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id),
  });
};

// Profile (JWT protected)
exports.profile = (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
};

// Check user role
exports.checkUser = (req, res) => {
  res.json({ message: "User access verified" });
};

// Check admin role
exports.checkAdmin = (req, res) => {
  res.json({ message: "Admin access verified" });
};
