const Move = require("../models/move.model");
const Payment = require("../models/payment.model");
const mongoose = require("mongoose");
const { parsePagination, paginationMetadata } = require("../utils/pagination");

exports.getUserDashboard = async (req, res) => {
  let pagination;
  try { pagination = parsePagination(req.query); }
  catch (error) { return res.status(400).json({ message: error.message, code: error.code }); }
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const userFilter = { user: userId };
    const [orders, totalMoves, paidMoves, payments, totalPayments, spentByCurrency] = await Promise.all([
      Move.find(userFilter).sort({ createdAt: -1, _id: -1 }).skip(pagination.skip).limit(pagination.limit),
      Move.countDocuments(userFilter),
      Move.countDocuments({ ...userFilter, paid: true }),
      Payment.find(userFilter).sort({ createdAt: -1, _id: -1 }).skip(pagination.skip).limit(pagination.limit),
      Payment.countDocuments(userFilter),
      Payment.aggregate([
        { $match: { ...userFilter, paymentStatus: "paid" } },
        { $group: { _id: { $ifNull: ["$currency", "UNKNOWN"] }, amount: { $sum: "$amount" } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return res.json({
      stats: {
        totalMoves,
        paidMoves,
        totalSpentByCurrency: spentByCurrency.map((entry) => ({ currency: entry._id, amount: entry.amount })),
      },
      orders,
      payments,
      ordersPagination: paginationMetadata(pagination, totalMoves),
      paymentsPagination: paginationMetadata(pagination, totalPayments),
    });
  } catch (error) {
    console.error("Dashboard Error:", error?.name || "Error");
    return res.status(500).json({ message: "Failed to load dashboard" });
  }
};
