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
    const eventAt = new Date();
    const move = await Move.findOneAndUpdate(
      {
        _id: req.params.id,
        status: "requested",
        provider: null,
        paid: true,
        pricingStatus: "priced",
        price: { $type: "number", $gt: 0 },
      },
      {
        $set: { provider: req.user.id, status: "accepted" },
        $push: { trackingEvents: { $each: [
          { event: "booking_confirmed", at: eventAt, actor: req.user.id, actorRole: "mover" },
          { event: "mover_assigned", at: eventAt, actor: req.user.id, actorRole: "mover" },
        ] } },
      },
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
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid move ID" });
  }
  try {
    const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
    if (Object.keys(body).some((key) => !["status", "milestone"].includes(key))) {
      return res.status(400).json({ message: "Only a status or tracking milestone may be submitted" });
    }
    if (body.status !== undefined && body.milestone !== undefined) {
      return res.status(400).json({ message: "Invalid move status" });
    }
    const event = body.milestone === "pickup_started" || body.status === "in_progress"
      ? "pickup_started"
      : body.milestone === "in_transit"
        ? "in_transit"
        : body.status === "completed"
          ? "delivery_completed"
          : null;
    if (!event) return res.status(400).json({ message: "Invalid move status or tracking milestone" });

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

    const trackingEvents = Array.isArray(move.trackingEvents) ? move.trackingEvents : [];
    const hasEvent = (name) => trackingEvents.some((entry) => entry.event === name);
    if (hasEvent(event)) {
      return res.status(409).json({ message: "This tracking milestone has already been recorded" });
    }

    let nextStatus = move.status;
    let requiredPreviousEvent = null;
    if (event === "pickup_started") {
      if (move.status !== "accepted") {
        return res.status(400).json({ message: "Pickup can only be recorded for an accepted move" });
      }
      nextStatus = "in_progress";
    } else if (event === "in_transit") {
      if (move.status !== "in_progress") {
        return res.status(400).json({ message: "The move must be in progress before transit can be recorded" });
      }
      // Older in_progress moves predate event history. Their pickup time is
      // unknowable, so allow a real transit action without fabricating pickup.
    } else {
      if (move.status !== "in_progress") {
        return res.status(400).json({ message: "Only an in-progress move can be completed" });
      }
      requiredPreviousEvent = "in_transit";
      if (!hasEvent(requiredPreviousEvent)) {
        return res.status(409).json({ message: "Record the move in transit before completing delivery" });
      }
      nextStatus = "completed";
    }

    const eventAt = new Date();
    const updatedMove = await Move.findOneAndUpdate(
      {
        _id: move._id,
        provider: req.user.id,
        paid: true,
        status: move.status,
        $and: [
          { "trackingEvents.event": { $ne: event } },
          ...(requiredPreviousEvent ? [{ trackingEvents: { $elemMatch: { event: requiredPreviousEvent } } }] : []),
        ],
      },
      {
        $set: { status: nextStatus },
        $push: { trackingEvents: { event, at: eventAt, actor: req.user.id, actorRole: "mover" } },
      },
      { new: true, runValidators: true },
    ).populate("user", "name email phone").populate("trackingEvents.actor", "name role");
    if (!updatedMove) {
      return res.status(409).json({ message: "Move status changed; refresh and try again" });
    }

    res.json({ message: "Move status updated successfully", move: updatedMove });
  } catch (error) {
    console.error("Error updating move status:", error);
    res.status(500).json({ message: "Failed to update move status" });
  }
};
