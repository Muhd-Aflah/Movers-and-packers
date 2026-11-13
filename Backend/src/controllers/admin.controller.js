const User = require("../models/User.model");
const Move = require("../models/move.model");
const Payment = require("../models/payment.model");
const mongoose = require("mongoose");

const MOVER_APPROVAL_STATUSES = ["pending", "approved", "rejected"];
const MOVER_REVIEW_SELECT =
  "name email phone role moverApprovalStatus moverReviewedBy moverReviewedAt moverReviewReason createdAt updatedAt";

const formatMover = (mover) => {
  const result = mover.toObject ? mover.toObject() : { ...mover };
  if (!result.moverApprovalStatus) result.moverApprovalStatus = "pending";
  return result;
};
// GET /api/admin/dashboard/stats
const getAdminDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProviders = await User.countDocuments({ role: "mover" });
    const totalMoves = await Move.countDocuments();
    const activeMoves = await Move.countDocuments({
      status: { $in: ["accepted", "in_progress"] },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysBookings = await Move.countDocuments({
      moveDate: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    const revenueByCurrency = await Payment.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: { $ifNull: ["$currency", "UNKNOWN"] }, amount: { $sum: "$amount" } } },
      { $sort: { _id: 1 } },
    ]);

    // For support tickets, assuming no dedicated model yet. Setting to 0.
    const supportTickets = 0; 

    res.json({
      totalUsers,
      totalProviders,
      totalMoves,
      activeMoves,
      todaysBookings,
      revenueByCurrency: revenueByCurrency.map((entry) => ({
        currency: entry._id,
        amount: entry.amount,
      })),
      supportTickets,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
};

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

// GET /api/admin/providers
const getAllProviders = async (req, res) => {
  try {
    const providers = await User.find({ role: "mover" }).select("-password");
    res.json(providers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch providers" });
  }
};

// GET /api/admin/movers?status=pending|approved|rejected
const getMoversByApprovalStatus = async (req, res) => {
  const status = req.query.status || "pending";
  if (!MOVER_APPROVAL_STATUSES.includes(status)) {
    return res.status(400).json({ message: "Status must be pending, approved, or rejected" });
  }

  try {
    const filter = { role: "mover" };
    if (status === "pending") {
      // Missing approval fields are legacy movers; access middleware already
      // treats them as pending, so they remain reviewable before migration.
      filter.$or = [
        { moverApprovalStatus: "pending" },
        { moverApprovalStatus: { $exists: false } },
      ];
    } else {
      filter.moverApprovalStatus = status;
    }
    const movers = await User.find(filter)
      .select(MOVER_REVIEW_SELECT)
      .populate("moverReviewedBy", "name email")
      .sort({ createdAt: -1 });
    return res.json(movers.map(formatMover));
  } catch {
    return res.status(500).json({ message: "Failed to fetch mover applications" });
  }
};

// GET /api/admin/movers/:id
const getMoverApplication = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid mover ID" });
  }
  try {
    const mover = await User.findOne({ _id: req.params.id, role: "mover" })
      .select(MOVER_REVIEW_SELECT)
      .populate("moverReviewedBy", "name email");
    if (!mover) return res.status(404).json({ message: "Mover application not found" });
    return res.json(formatMover(mover));
  } catch {
    return res.status(500).json({ message: "Failed to fetch mover application" });
  }
};

const decideMoverApplication = (decision) => async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid mover ID" });
  }
  const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
  if (decision === "rejected" && (!reason || reason.length > 500)) {
    return res.status(400).json({ message: "A rejection reason between 1 and 500 characters is required" });
  }
  if (reason.length > 500) {
    return res.status(400).json({ message: "Review reason must be no longer than 500 characters" });
  }
  if (String(req.user.id) === String(req.params.id)) {
    return res.status(403).json({ message: "Admins cannot review their own mover account" });
  }

  try {
    const existing = await User.findOne({ _id: req.params.id, role: "mover" })
      .select(MOVER_REVIEW_SELECT);
    if (!existing) return res.status(404).json({ message: "Mover application not found" });

    if (existing.moverApprovalStatus === decision) {
      return res.json({ message: `Mover is already ${decision}`, mover: formatMover(existing) });
    }
    if (existing.moverApprovalStatus && existing.moverApprovalStatus !== "pending") {
      return res.status(409).json({ message: "This mover application has already been reviewed" });
    }

    const updated = await User.findOneAndUpdate(
      {
        _id: existing._id,
        role: "mover",
        $or: [
          { moverApprovalStatus: "pending" },
          { moverApprovalStatus: { $exists: false } },
        ],
      },
      {
        $set: {
          moverApprovalStatus: decision,
          moverReviewedBy: req.user.id,
          moverReviewedAt: new Date(),
          moverReviewReason: reason,
        },
      },
      { new: true, runValidators: true },
    )
      .select(MOVER_REVIEW_SELECT)
      .populate("moverReviewedBy", "name email");

    if (updated) {
      return res.json({ message: `Mover ${decision}`, mover: formatMover(updated) });
    }

    // A concurrent admin may have made the same decision. Treat that retry as
    // idempotent; a conflicting decision remains a 409.
    const current = await User.findOne({ _id: existing._id, role: "mover" })
      .select(MOVER_REVIEW_SELECT)
      .populate("moverReviewedBy", "name email");
    if (current?.moverApprovalStatus === decision) {
      return res.json({ message: `Mover is already ${decision}`, mover: formatMover(current) });
    }
    return res.status(409).json({ message: "Mover application was reviewed by another admin; refresh and retry" });
  } catch {
    return res.status(500).json({ message: "Failed to update mover approval" });
  }
};

const approveMover = decideMoverApplication("approved");
const rejectMover = decideMoverApplication("rejected");

// GET /api/admin/payments
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("user", "name email")
      .populate("move", "pickup dropoff moveDate service price status")
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch payments" });
  }
};

module.exports = {
  getAllUsers,
  getAllMoves,
  getAdminDashboardStats,
  getAllProviders,
  getAllPayments,
  getMoversByApprovalStatus,
  getMoverApplication,
  approveMover,
  rejectMover,
};
