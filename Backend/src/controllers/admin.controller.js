const User = require("../models/User.model");
const Move = require("../models/move.model");

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// GET /api/admin/moves
const getAllMoves = async (req, res) => {
  try {
    const moves = await Move.find()
      .populate("user", "name email role")
      .populate("provider", "name email")
      .sort({ createdAt: -1 });

    res.json(moves);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch moves" });
  }
};

module.exports = {
  getAllUsers,
  getAllMoves,
};
