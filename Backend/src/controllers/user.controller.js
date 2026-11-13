const User = require("../models/User.model");

const getUserById = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
};

const updateUser = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updates = {};
    if (typeof req.body.name === "string") updates.name = req.body.name.trim();
    if (typeof req.body.phone === "string") updates.phone = req.body.phone.trim();
    if (updates.name !== undefined && !updates.name) {
      return res.status(400).json({ message: "Name cannot be empty" });
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update profile" });
  }
};

module.exports = { getUserById, updateUser };
