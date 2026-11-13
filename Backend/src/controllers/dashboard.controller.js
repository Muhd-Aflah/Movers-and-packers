const Move = require("../models/move.model");
const Payment = require("../models/payment.model");
exports.getUserDashboard = async (req, res) => {
  try {
    const moves = await Move.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    const payments = await Payment.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    const spentByCurrency = payments
      .filter((payment) => payment.paymentStatus === "paid")
      .reduce((totals, payment) => {
        const currency = payment.currency || "UNKNOWN";
        totals.set(currency, (totals.get(currency) || 0) + payment.amount);
        return totals;
      }, new Map());

    res.json({
      stats: {
        totalMoves: moves.length,
        paidMoves: moves.filter((move) => move.paid).length,
        totalSpentByCurrency: [...spentByCurrency.entries()].map(([currency, amount]) => ({
          currency,
          amount,
        })),
      },
      orders: moves,  
      payments,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
};
