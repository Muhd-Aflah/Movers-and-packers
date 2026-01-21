const Move = require("../models/move.model");

// GET /api/provider/current-job
exports.getCurrentJob = async (req, res) => {
  try {
    const currentJob = await Move.findOne({
      provider: req.user.id,
      status: { $in: ["accepted", "in_progress"] },
    })
      .populate("user", "name email phone")
      .select("-__v");

    res.json(currentJob);
  } catch (error) {
    console.error("Error fetching current job for provider:", error);
    res.status(500).json({ message: "Failed to fetch current job" });
  }
};

// GET /api/provider/available-moves
exports.getAvailableMoves = async (req, res) => {
  try {
    const availableMoves = await Move.find({
      status: "requested",
      provider: null, // Not yet assigned
    })
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .select("-__v");

    res.json(availableMoves);
  } catch (error) {
    console.error("Error fetching available moves for provider:", error);
    res.status(500).json({ message: "Failed to fetch available moves" });
  }
};

// PUT /api/provider/moves/:id/accept
exports.acceptMove = async (req, res) => {
  try {
    const move = await Move.findById(req.params.id);

    if (!move) {
      return res.status(404).json({ message: "Move not found" });
    }

    if (move.status !== "requested" || move.provider !== null) {
      return res.status(400).json({ message: "Move cannot be accepted" });
    }

    move.provider = req.user.id;
    move.status = "accepted";
    await move.save();

    res.json({ message: "Move accepted successfully", move });
  } catch (error) {
    console.error("Error accepting move:", error);
    res.status(500).json({ message: "Failed to accept move" });
  }
};

// GET /api/provider/my-jobs
exports.getMyJobs = async (req, res) => {
  try {
    const myJobs = await Move.find({ provider: req.user.id })
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .select("-__v");

    res.json(myJobs);
  } catch (error) {
    console.error("Error fetching assigned jobs for provider:", error);
    res.status(500).json({ message: "Failed to fetch assigned jobs" });
  }
};

// PUT /api/provider/moves/:id/status
exports.updateMoveStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const move = await Move.findById(req.params.id);

    if (!move) {
      return res.status(404).json({ message: "Move not found" });
    }

    if (move.provider.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this move" });
    }

    // Add validation for status transitions if needed
    move.status = status;
    await move.save();

    res.json({ message: "Move status updated successfully", move });
  } catch (error) {
    console.error("Error updating move status:", error);
    res.status(500).json({ message: "Failed to update move status" });
  }
};