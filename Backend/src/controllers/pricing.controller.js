const { getBookingPriceQuote } = require("../services/pricing.service");

exports.createQuote = async (req, res) => {
  try {
    const quote = await getBookingPriceQuote(req.body);
    return res.json({ pricingAvailable: true, ...quote });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      pricingAvailable: false,
      code: error.code || "PRICING_ERROR",
      message: error.statusCode ? error.message : "Unable to calculate a price right now",
      ...(error.details ? { details: error.details } : {}),
    });
  }
};
