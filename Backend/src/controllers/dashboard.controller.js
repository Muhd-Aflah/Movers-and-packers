const Order = require("../models/order.model");
const Payment = require("../models/Payment.model");

exports.getUserDashboard = async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort("-createdAt");
  const payments = await Payment.find({ user: req.user.id }).sort("-createdAt");

  res.json({
    stats: {
      totalOrders: orders.length,
      paidOrders: orders.filter(o => o.status === "paid").length,
      totalSpent: payments.reduce((sum, p) => sum + p.amount, 0),
    },
    orders,
    payments,
  });
};
