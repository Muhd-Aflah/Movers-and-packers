const Move = require("../models/move.model");
const Payment = require("../models/payment.model");
exports.getUserDashboard = async (req, res) => {
  try {
    const moves = await Move.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    const payments = await Payment.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      stats: {
        totalMoves: moves.length,
        paidMoves: moves.filter(m => m.isPaid).length,
        totalSpent: payments.reduce((sum, p) => sum + p.amount, 0),
      },
      orders: moves,  
      payments,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
};
