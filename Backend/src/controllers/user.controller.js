const User = require("../models/User.model");

const getUserById = async (req, res) => {
  if (req.user.id !== req.params.id) {
    return res.status(403).json({ message: "Access denied" });
  }

  const user = await User.findById(req.params.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json(user);
};

const updateUser = async (req, res) => {
  if (req.user.id !== req.params.id) {
    return res.status(403).json({ message: "Access denied" });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      phone: req.body.phone,
    },
    { new: true },
  ).select("-password");

  res.json(user);
};

module.exports = { getUserById, updateUser };
