const Move = require("../models/move.model");
const mongoose = require("mongoose");
const { parsePagination, findPage, sendPaginated } = require("../utils/pagination");

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
  let pagination;
  try { pagination = parsePagination(req.query); }
  catch (error) { return res.status(400).json({ message: error.message, code: error.code }); }
  try {
    const result = await findPage({
      Model: Move,
      filter: {
        status: "requested",
        provider: null,
        paid: true,
        price: { $type: "number", $gt: 0 },
        pricingStatus: "priced",
      },
      ...pagination,
      populate: [["user", "name email phone"]],
      sort: { createdAt: -1, _id: -1 },
      select: "-__v",
    });
    return sendPaginated(res, result);
  } catch (error) {
    console.error("Error fetching available moves for provider:", error);
    res.status(500).json({ message: "Failed to fetch available moves" });
  }
};

// PUT /api/provider/moves/:id/accept
exports.acceptMove = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid move ID" });
  }
  try {
    const move = await Move.findOneAndUpdate(
      {
        _id: req.params.id,
        status: "requested",
        provider: null,
        paid: true,
        pricingStatus: "priced",
        price: { $type: "number", $gt: 0 },
      },
      { $set: { provider: req.user.id, status: "accepted" } },
      { new: true, runValidators: true },
    );
    if (!move) {
      return res.status(409).json({ message: "Move is unavailable or already assigned" });
    }

    res.json({ message: "Move accepted successfully", move });
  } catch (error) {
    console.error("Error accepting move:", error);
    res.status(500).json({ message: "Failed to accept move" });
  }
};

// GET /api/provider/my-jobs
exports.getMyJobs = async (req, res) => {
  let pagination;
  try { pagination = parsePagination(req.query); }
  catch (error) { return res.status(400).json({ message: error.message, code: error.code }); }
  try {
    const result = await findPage({
      Model: Move,
      filter: { provider: req.user.id },
      ...pagination,
      populate: [["user", "name email phone"]],
      sort: { createdAt: -1, _id: -1 },
      select: "-__v",
    });
    return sendPaginated(res, result);
  } catch (error) {
    console.error("Error fetching assigned jobs for provider:", error);
    res.status(500).json({ message: "Failed to fetch assigned jobs" });
  }
};

// PUT /api/provider/moves/:id/status
exports.updateMoveStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const transitions = {
      accepted: ["in_progress"],
      in_progress: ["completed"],
    };
    if (!["in_progress", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid move status" });
    }
    const move = await Move.findById(req.params.id);

    if (!move) {
      return res.status(404).json({ message: "Move not found" });
    }

    if (!move.provider || move.provider.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this move" });
    }

    if (!move.paid) {
      return res.status(409).json({ message: "The move must be paid before service can begin" });
    }

    if (!transitions[move.status]?.includes(status)) {
      return res.status(400).json({ message: "Move status transition is not allowed" });
    }

    const updatedMove = await Move.findOneAndUpdate(
      { _id: move._id, provider: req.user.id, status: move.status },
      { $set: { status } },
      { new: true, runValidators: true },
    ).populate("user", "name email phone");
    if (!updatedMove) {
      return res.status(409).json({ message: "Move status changed; refresh and try again" });
    }

    res.json({ message: "Move status updated successfully", move: updatedMove });
  } catch (error) {
    console.error("Error updating move status:", error);
    res.status(500).json({ message: "Failed to update move status" });
  }
};
