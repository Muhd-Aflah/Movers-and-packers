const User = require("../models/User.model");
const Move = require("../models/move.model");
const Payment = require("../models/payment.model");
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

    const totalRevenueResult = await Payment.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalRevenue =
      totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    // For support tickets, assuming no dedicated model yet. Setting to 0.
    const supportTickets = 0; 

        res.json({
      totalUsers,
      totalProviders,
      totalMoves,
      activeMoves,
      todaysBookings,
      totalRevenue,
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

// GET /api/admin/payments
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("user", "name email")
      .populate("order", "service price")
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
};
