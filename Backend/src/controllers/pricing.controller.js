const {
  getBookingPriceQuote,
  getManualReviewQuote,
  requiresManualEstimate,
} = require("../services/pricing.service");

exports.createQuote = async (req, res) => {
  try {
    const quote = await getBookingPriceQuote(req.body);
    return res.json({ pricingAvailable: true, ...quote });
  } catch (error) {
    if (req.body?.serviceMode === "full_service" && requiresManualEstimate(error)) {
      try {
        const review = await getManualReviewQuote(req.body);
        return res.json({
          pricingAvailable: false,
          manualEstimateRequired: true,
          pricingStatus: "manual_review",
          message: "An administrator must prepare your packing estimate before payment.",
          ...review,
        });
      } catch (reviewError) {
        error = reviewError;
      }
    }
    return res.status(error.statusCode || 500).json({
      pricingAvailable: false,
      code: error.code || "PRICING_ERROR",
      message: error.statusCode ? error.message : "Unable to calculate a price right now",
      ...(error.details ? { details: error.details } : {}),
    });
  }
};
