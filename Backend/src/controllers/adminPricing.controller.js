const mongoose = require("mongoose");
const crypto = require("crypto");
const Move = require("../models/move.model");
const PaymentOrder = require("../models/paymentOrder.model");
const PaymentOrderIntent = require("../models/paymentOrderIntent.model");
const PaymentReconciliation = require("../models/paymentReconciliation.model");
const { buildManualPricingSnapshot } = require("../services/manualPricing.service");
const { parsePagination, findPage, sendPaginated } = require("../utils/pagination");

const REVISION_LOCK_MS = 2 * 60 * 1000;

exports.getPendingPackingEstimates = async (req, res) => {
  let pagination;
  try { pagination = parsePagination(req.query); }
  catch (error) { return res.status(400).json({ message: error.message, code: error.code }); }
  try {
    const result = await findPage({
      Model: Move,
      filter: { serviceMode: "full_service", pricingStatus: { $in: ["manual_review", "pending_acceptance"] } },
      ...pagination,
      populate: [["user", "name email phone"]],
      sort: { createdAt: 1, _id: 1 },
    });
    return sendPaginated(res, result);
  } catch {
    return res.status(500).json({ message: "Failed to fetch pending packing estimates" });
  }
};

exports.submitPackingEstimate = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "A valid move ID is required" });
  }
  try {
    const move = await Move.findById(req.params.id);
    if (!move) return res.status(404).json({ message: "Move not found" });
    if (move.serviceMode !== "full_service" || !["manual_review", "pending_acceptance"].includes(move.pricingStatus) || move.paid) {
      return res.status(409).json({ message: "This move is not available for a packing estimate" });
    }
    const previousVersion = Number.isSafeInteger(move.pricingVersion) ? move.pricingVersion : 0;
    const updatedVersion = previousVersion + 1;
    const at = new Date();
    const updatedEstimate = buildManualPricingSnapshot(move.pricingDraft, req.body, at);
    const previousEstimate = move.pricing || null;
    const revisionLock = crypto.randomUUID();
    const lockedMove = await Move.findOneAndUpdate(
      {
        _id: move._id,
        serviceMode: "full_service",
        pricingStatus: { $in: ["manual_review", "pending_acceptance"] },
        pricingVersion: previousVersion,
        paid: { $ne: true },
        $or: [
          { "paymentOrderLock.expiresAt": { $exists: false } },
          { "paymentOrderLock.expiresAt": { $lte: at } },
        ],
      },
      {
        $set: {
          paymentOrderLock: {
            token: revisionLock,
            expiresAt: new Date(at.getTime() + REVISION_LOCK_MS),
          },
        },
      },
      { new: true, runValidators: true },
    );
    if (!lockedMove) return res.status(409).json({ message: "A payment or quote update is already processing; refresh and retry" });

    try {
      const potentiallyPayableOrder = await PaymentOrder.exists({
        move: move._id,
      });
      if (potentiallyPayableOrder) {
        return res.status(409).json({
          code: "PAYMENT_ORDER_MAY_STILL_BE_PAYABLE",
          message: "This estimate cannot be revised while a Razorpay order may still receive payment. Contact support to resolve the existing order first.",
        });
      }

      const paymentIntent = await PaymentOrderIntent.exists({
        move: move._id,
        status: { $in: ["initiated", "gateway_created", "completed", "reconciliation_required"] },
      });
      if (paymentIntent) {
        return res.status(409).json({
          code: "PAYMENT_ORDER_INTENT_UNRESOLVED",
          message: "A payment-order intent exists for this move. Resolve it through payment reconciliation before revising the estimate.",
        });
      }

      const pendingReconciliation = await PaymentReconciliation.exists({ move: move._id, status: "pending_review" });
      if (pendingReconciliation) {
        return res.status(409).json({
          code: "PAYMENT_RECONCILIATION_PENDING",
          message: "This estimate cannot be revised while a captured payment is under reconciliation.",
        });
      }

      const updated = await Move.findOneAndUpdate(
        {
          _id: move._id,
          serviceMode: "full_service",
          pricingStatus: { $in: ["manual_review", "pending_acceptance"] },
          pricingVersion: previousVersion,
          paid: { $ne: true },
          "paymentOrderLock.token": revisionLock,
        },
        {
        $set: {
          pricing: updatedEstimate,
          price: updatedEstimate.total,
          pricingStatus: "pending_acceptance",
          pricingAcceptanceRequired: true,
          pricingAcceptedAt: null,
          pricingAcceptedBy: null,
          acceptedPricingVersion: null,
          pricingVersion: updatedVersion,
          workers: updatedEstimate.workers,
        },
        $push: {
          pricingAudit: {
            admin: req.user.id,
            at,
            previousVersion,
            updatedVersion,
            previousEstimate,
            updatedEstimate,
          },
          },
        },
        { new: true, runValidators: true },
      );
      if (!updated) return res.status(409).json({ message: "The estimate changed concurrently; refresh and retry" });
      return res.json(updated);
    } finally {
      await Move.updateOne(
        { _id: move._id, "paymentOrderLock.token": revisionLock },
        { $unset: { paymentOrderLock: 1 } },
      );
    }
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ code: error.code, message: error.message });
    return res.status(500).json({ message: "Failed to save packing estimate" });
  }
};
