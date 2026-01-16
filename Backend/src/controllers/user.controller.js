import User from "../models/User.js";

export const getUserById = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { name } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
