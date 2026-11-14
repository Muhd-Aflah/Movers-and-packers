const Move = require("../models/move.model");
const mongoose = require("mongoose");
const { parsePagination, findPage, sendPaginated } = require("../utils/pagination");
const {
  getBookingPriceQuote,
  getManualReviewQuote,
  requiresManualEstimate,
  normalizeBookingInput,
} = require("../services/pricing.service");

const customerMove = (move) => {
  const result = move.toObject ? move.toObject() : { ...move };
  delete result.pricingAudit;
  return result;
};

// POST /api/moves
const createMove = async (req, res) => {
  try {
    const { moveDate } = req.body;
    const parsedMoveDate = new Date(moveDate);
    if (!moveDate || !Number.isFinite(parsedMoveDate.getTime())) {
      return res.status(400).json({ message: "Enter a valid move date" });
    }

    const booking = normalizeBookingInput(req.body);
    let quote;
    let manualReview = false;
    try {
      quote = await getBookingPriceQuote(booking);
    } catch (error) {
      if (booking.serviceMode !== "full_service" || !requiresManualEstimate(error)) throw error;
      quote = await getManualReviewQuote(booking);
      manualReview = true;
    }

    const newMove = new Move({
      user: req.user.id,
      pickup: { address: quote.pickupResolved },
      dropoff: { address: quote.dropoffResolved },
      moveDate: parsedMoveDate,
      service: "delivery",
      serviceMode: booking.serviceMode,
      vehicleType: booking.vehicleType,
      inventory: booking.inventory,
      packingMaterials: booking.materials,
      workers: quote.workers,
      loadingRequired: booking.loadingWorkers > 0,
      unloadingRequired: booking.unloadingWorkers > 0,
      ...(manualReview ? {} : { price: quote.total }),
      pricingStatus: manualReview ? "manual_review" : "priced",
      pricingAcceptanceRequired: manualReview,
      ...(manualReview ? { pricingDraft: quote.pricingDraft } : { pricing: {
        serviceMode: quote.serviceMode,
        currency: quote.currency,
        distanceKm: quote.distanceKm,
        routeProvider: "geoapify",
        pickupResolved: quote.pickupResolved,
        dropoffResolved: quote.dropoffResolved,
        calculatedAt: new Date(),
        vehicle: quote.vehicle,
        inventory: quote.inventory,
        materials: quote.materials,
        workers: quote.workers,
        breakdown: quote.breakdown,
      } }),
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
  let pagination;
  try {
    pagination = parsePagination(req.query);
  } catch (error) {
    return res.status(400).json({ message: error.message, code: error.code });
  }
  try {
    const result = await findPage({
      Model: Move,
      filter: { user: req.user.id },
      ...pagination,
      sort: { createdAt: -1, _id: -1 },
    });
    return sendPaginated(res, { ...result, data: result.data.map(customerMove) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch moves" });
  }
};

const getMyMove = async (req, res) => {
  try {
    const move = await Move.findOne({ _id: req.params.id, user: req.user.id })
      .populate("user", "name email phone");
    if (!move) return res.status(404).json({ message: "Move not found" });
    return res.json(customerMove(move));
  } catch (error) {
    return res.status(400).json({ message: "Invalid move ID" });
  }
};

const acceptMovePricing = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "A valid move ID is required" });
  }
  try {
    const move = await Move.findOne({ _id: req.params.id, user: req.user.id });
    if (!move) return res.status(404).json({ message: "Move not found" });
    if (
      move.pricingStatus !== "pending_acceptance" ||
      move.pricingAcceptanceRequired !== true ||
      !Number.isSafeInteger(move.pricingVersion) ||
      !Number.isFinite(move.price) ||
      move.pricing?.total !== move.price
    ) {
      return res.status(409).json({ message: "There is no pending estimate available to accept" });
    }
    const acceptedAt = new Date();
    const updated = await Move.findOneAndUpdate(
      {
        _id: move._id,
        user: req.user.id,
        serviceMode: "full_service",
        pricingStatus: "pending_acceptance",
        pricingAcceptanceRequired: true,
        pricingVersion: move.pricingVersion,
        price: move.price,
        "pricing.total": move.price,
        paid: { $ne: true },
      },
      {
        $set: {
          pricingStatus: "priced",
          pricingAcceptedAt: acceptedAt,
          pricingAcceptedBy: req.user.id,
          acceptedPricingVersion: move.pricingVersion,
        },
      },
      { new: true, runValidators: true },
    );
    if (!updated) return res.status(409).json({ message: "The estimate changed; refresh and review it again" });
    return res.json(customerMove(updated));
  } catch {
    return res.status(500).json({ message: "Could not accept this estimate" });
  }
};

module.exports = {
  createMove,
  getMyMoves,
  getMyMove,
  acceptMovePricing,
};
