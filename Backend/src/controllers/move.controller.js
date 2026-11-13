const Move = require("../models/move.model");
const {
  getBookingPriceQuote,
  normalizeBookingInput,
} = require("../services/pricing.service");

// POST /api/moves
const createMove = async (req, res) => {
  try {
    const { moveDate } = req.body;
    const parsedMoveDate = new Date(moveDate);
    if (!moveDate || !Number.isFinite(parsedMoveDate.getTime())) {
      return res.status(400).json({ message: "Enter a valid move date" });
    }

    const booking = normalizeBookingInput(req.body);
    const quote = await getBookingPriceQuote(booking);

    const newMove = new Move({
      user: req.user.id,
      pickup: { address: quote.pickupResolved },
      dropoff: { address: quote.dropoffResolved },
      moveDate: parsedMoveDate,
      service: booking.service,
      weight: booking.weight,
      loadingRequired: booking.loadingRequired,
      unloadingRequired: booking.unloadingRequired,
      price: quote.total,
      pricingStatus: "priced",
      pricing: {
        currency: quote.currency,
        distanceKm: quote.distanceKm,
        routeProvider: "geoapify",
        pickupResolved: quote.pickupResolved,
        dropoffResolved: quote.dropoffResolved,
        calculatedAt: new Date(),
        breakdown: quote.breakdown,
      },
    });

    const savedMove = await newMove.save();
    return res.status(201).json(savedMove);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      });
    }
    return res.status(500).json({ message: "Failed to create move" });
  }
};

const getMyMoves = async (req, res) => {
  try {
    const moves = await Move.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    res.json(moves);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch moves" });
  }
};

const getMyMove = async (req, res) => {
  try {
    const move = await Move.findOne({ _id: req.params.id, user: req.user.id })
      .populate("user", "name email phone");
    if (!move) return res.status(404).json({ message: "Move not found" });
    return res.json(move);
  } catch (error) {
    return res.status(400).json({ message: "Invalid move ID" });
  }
};

module.exports = {
  createMove,
  getMyMoves,
  getMyMove,
};
