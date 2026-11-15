const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/User.model");
const Move = require("../models/move.model");
const Payment = require("../models/payment.model");
const PaymentOrder = require("../models/paymentOrder.model");
const PaymentOrderIntent = require("../models/paymentOrderIntent.model");
const PaymentReconciliation = require("../models/paymentReconciliation.model");
const PaymentWebhookEvent = require("../models/paymentWebhookEvent.model");
const PaymentProcessing = require("../models/paymentProcessing.model");
const { processCapturedPayment, recoverPendingCapturedPayments, RETRYABLE_CAPTURE_ERROR, toMinorUnits } = require("../services/capturedPayment.service");
const { parsePagination, findPage, sendPaginated } = require("../utils/pagination");

const PAYMENT_ORDER_LOCK_MS = 5 * 60 * 1000;
const pricingWasAccepted = (move) => move.pricingAcceptanceRequired !== true ||
  Boolean(move.pricingAcceptedAt && move.acceptedPricingVersion === move.pricingVersion);
const paymentOrderResponse = (order) => ({
  key_id: process.env.RAZORPAY_KEY_ID,
  order_id: order.id,
  amount: order.amount,
  currency: order.currency,
});

let razorpayClient;
const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    const error = new Error("Payment gateway is not configured");
    error.statusCode = 503;
    throw error;
  }
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayClient;
};

const validSignature = (orderId, paymentId, signature) => {
  if (typeof signature !== "string" || !/^[a-f\d]{64}$/i.test(signature)) return false;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest();
  const received = Buffer.from(signature, "hex");
  return received.length === expected.length && crypto.timingSafeEqual(expected, received);
};

const validWebhookSignature = (rawBody, signature) => {
  if (!Buffer.isBuffer(rawBody) || typeof signature !== "string" || !/^[a-f\d]{64}$/i.test(signature)) return false;
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest();
  const received = Buffer.from(signature, "hex");
  return received.length === expected.length && crypto.timingSafeEqual(expected, received);
};

exports.createOrder = async (req, res) => {
  let moveId;
  let lockToken;
  let intent;
  try {
    const razorpay = getRazorpay();
    ({ moveId } = req.body || {});
    if (!mongoose.Types.ObjectId.isValid(moveId)) {
      return res.status(400).json({ message: "A valid move ID is required" });
    }

    const move = await Move.findOne({ _id: moveId, user: req.user.id });
    if (!move) return res.status(404).json({ message: "Move not found" });
    if (move.paid) return res.status(409).json({ message: "This move is already paid" });
    if (
      move.pricingStatus !== "priced" ||
      !move.pricing?.currency ||
      !Number.isFinite(move.price) ||
      move.price <= 0 ||
      !pricingWasAccepted(move)
    ) {
      return res.status(409).json({ message: "This move has no valid backend-calculated price" });
    }

    // This conditional database update serializes order creation across API
    // processes. It also rechecks the price and paid state after the initial read.
    lockToken = crypto.randomUUID();
    const now = new Date();
    const lockedMove = await Move.findOneAndUpdate(
      {
        _id: move._id,
        user: req.user.id,
        paid: { $ne: true },
        pricingStatus: "priced",
        price: move.price,
        $and: [
          { $or: [
            { pricingAcceptanceRequired: { $ne: true } },
            { pricingAcceptedAt: { $ne: null }, acceptedPricingVersion: move.pricingVersion },
          ] },
          { $or: [
            { "paymentOrderLock.expiresAt": { $exists: false } },
            { "paymentOrderLock.expiresAt": { $lte: now } },
          ] },
        ],
      },
      {
        $set: {
          paymentOrderLock: {
            token: lockToken,
            expiresAt: new Date(now.getTime() + PAYMENT_ORDER_LOCK_MS),
          },
        },
      },
      { new: true, runValidators: true },
    );
    if (!lockedMove) {
      return res.status(409).json({ message: "A payment order is already being prepared for this move. Retry shortly." });
    }

    const currency = lockedMove.pricing.currency.toUpperCase();
    const pricingVersion = Number.isSafeInteger(lockedMove.pricingVersion) ? lockedMove.pricingVersion : 0;
    const amount = toMinorUnits(lockedMove.price, currency);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      await Move.updateOne(
        { _id: lockedMove._id, "paymentOrderLock.token": lockToken },
        { $unset: { paymentOrderLock: 1 } },
      );
      lockToken = null;
      return res.status(409).json({ message: "This move cannot be paid with the configured currency" });
    }

    const priorOrders = await PaymentOrder.find({ move: lockedMove._id }).sort({ createdAt: -1 });
    if (priorOrders.length > 1) {
      return res.status(409).json({ code: "MULTIPLE_PAYMENT_ORDERS_EXIST", message: "Multiple historical Razorpay orders require reconciliation before another payment attempt." });
    }
    if (priorOrders.length === 1) {
      const priorOrder = priorOrders[0];
      if (["paid", "reconciliation_required"].includes(priorOrder.status)) {
        return res.status(409).json({ message: "An existing payment order must be verified or reconciled before another order can be created." });
      }
      let existingOrder;
      try { existingOrder = await razorpay.orders.fetch(priorOrder.razorpayOrderId); }
      catch { return res.status(409).json({ code: "PAYMENT_ORDER_STATE_UNKNOWN", message: "The existing Razorpay order must be reconciled before another order can be created." }); }
      if (existingOrder.status === "paid") {
        return res.status(409).json({ message: "Payment was captured and is awaiting verification or reconciliation. A second order cannot be created." });
      }
      if (["created", "attempted"].includes(existingOrder.status)) {
        if (existingOrder.amount !== amount || existingOrder.currency !== currency ||
          (Number.isSafeInteger(priorOrder.pricingVersion) ? priorOrder.pricingVersion : 0) !== pricingVersion) {
          return res.status(409).json({ code: "OBSOLETE_PAYMENT_ORDER_EXISTS", message: "An existing Razorpay order may still be payable. Resolve it before creating an order for this quote." });
        }
        return res.json(paymentOrderResponse(existingOrder));
      }
      return res.status(409).json({ code: "PAYMENT_ORDER_STATE_UNKNOWN", message: "The existing Razorpay order must be reconciled before another order can be created." });
    }

    const unresolvedIntent = await PaymentOrderIntent.findOne({
      move: lockedMove._id,
      status: { $in: ["initiated", "gateway_created", "completed", "reconciliation_required"] },
    }).sort({ createdAt: -1 });
    if (unresolvedIntent) {
      if (unresolvedIntent.pricingVersion === pricingVersion && ["gateway_created", "completed"].includes(unresolvedIntent.status) && unresolvedIntent.razorpayOrderId) {
        let existingOrder;
        try { existingOrder = await razorpay.orders.fetch(unresolvedIntent.razorpayOrderId); }
        catch { return res.status(409).json({ code: "ORDER_INTENT_RECONCILIATION_REQUIRED", message: "A payment order is under reconciliation. Do not retry payment; contact support." }); }
        if (["created", "attempted"].includes(existingOrder.status) && existingOrder.amount === amount && existingOrder.currency === currency) {
          const paymentOrder = await PaymentOrder.findOneAndUpdate(
            { razorpayOrderId: existingOrder.id },
            { $setOnInsert: {
              user: unresolvedIntent.user, move: unresolvedIntent.move, amount: unresolvedIntent.amount,
              pricingVersion: unresolvedIntent.pricingVersion, currency: unresolvedIntent.currency,
              gateway: "razorpay", razorpayOrderId: existingOrder.id, status: "created",
            } },
            { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
          );
          if (String(paymentOrder.user) !== String(unresolvedIntent.user) || String(paymentOrder.move) !== String(unresolvedIntent.move) ||
            paymentOrder.amount !== unresolvedIntent.amount || paymentOrder.currency !== unresolvedIntent.currency || paymentOrder.pricingVersion !== unresolvedIntent.pricingVersion) {
            return res.status(409).json({ code: "ORDER_INTENT_RECONCILIATION_REQUIRED", message: "A payment-order record does not match its saved intent and requires admin review." });
          }
          await PaymentOrderIntent.updateOne(
            { _id: unresolvedIntent._id, razorpayOrderId: existingOrder.id },
            { $set: { status: "completed", paymentOrder: paymentOrder._id } },
          );
          return res.json(paymentOrderResponse(existingOrder));
        }
      }
      return res.status(409).json({ code: "ORDER_INTENT_RECONCILIATION_REQUIRED", message: "A prior payment-order attempt is unresolved. Do not retry payment; contact support." });
    }

    const acceptedPricingVersion = lockedMove.pricingAcceptanceRequired === true
      ? lockedMove.acceptedPricingVersion
      : null;
    const previouslyVerifiedAbsent = await PaymentOrderIntent.findOne({
      move: lockedMove._id,
      pricingVersion,
      status: "failed",
      failureCode: "admin_verified_no_gateway_order",
    }).sort({ requestedAt: -1 });
    const intentValues = {
      user: req.user.id,
      move: lockedMove._id,
      pricingVersion,
      acceptedPricingVersion,
      amount: lockedMove.price,
      currency,
      status: "initiated",
      receipt: `sm_${new mongoose.Types.ObjectId().toString()}`,
      requestedAt: new Date(),
      lastAttemptAt: null,
      failureCode: null,
    };
    if (previouslyVerifiedAbsent) {
      intent = await PaymentOrderIntent.findOneAndUpdate(
        {
          _id: previouslyVerifiedAbsent._id,
          status: "failed",
          failureCode: "admin_verified_no_gateway_order",
          razorpayOrderId: null,
          paymentOrder: null,
        },
        { $set: intentValues },
        { new: true, runValidators: true },
      );
      if (!intent) return res.status(409).json({ code: "ORDER_INTENT_EXISTS", message: "The reviewed order intent changed; refresh and retry." });
    } else {
      intent = new PaymentOrderIntent(intentValues);
      try {
        await intent.save();
      } catch (error) {
        if (error.code === 11000) return res.status(409).json({ code: "ORDER_INTENT_EXISTS", message: "A payment-order attempt already exists for this estimate. Contact support if it remains pending." });
        throw error;
      }
    }

    let order;
    try {
      order = await razorpay.orders.create({
        amount,
        currency,
        receipt: intent.receipt,
        notes: {
          moveId: String(lockedMove._id),
          userId: String(req.user.id),
          intentId: String(intent._id),
          pricingVersion: String(pricingVersion),
        },
      });
    } catch (error) {
      await PaymentOrderIntent.updateOne(
        { _id: intent._id, status: "initiated" },
        { $set: { status: "reconciliation_required", failureCode: Number.isSafeInteger(error?.statusCode) ? `gateway_http_${error.statusCode}` : "gateway_outcome_unknown", lastAttemptAt: new Date() } },
      );
      return res.status(502).json({ code: "ORDER_INTENT_RECONCILIATION_REQUIRED", message: "The gateway order result is uncertain. Do not retry payment; support must reconcile this request." });
    }

    if (!order?.id || order.amount !== amount || order.currency !== currency || !["created", "attempted"].includes(order.status)) {
      await PaymentOrderIntent.updateOne(
        { _id: intent._id, status: "initiated" },
        { $set: { status: "reconciliation_required", razorpayOrderId: order?.id || null, failureCode: "gateway_order_response_mismatch", lastAttemptAt: new Date() } },
      );
      return res.status(502).json({ code: "ORDER_INTENT_RECONCILIATION_REQUIRED", message: "The gateway order response could not be confirmed. Do not retry payment; contact support." });
    }

    await PaymentOrderIntent.updateOne(
      { _id: intent._id, status: "initiated" },
      { $set: { status: "gateway_created", razorpayOrderId: order.id, lastAttemptAt: new Date() } },
    );
    const localOrder = await PaymentOrder.findOneAndUpdate(
      { razorpayOrderId: order.id },
      { $setOnInsert: {
        user: req.user.id, move: lockedMove._id, amount: lockedMove.price, pricingVersion,
        currency, gateway: "razorpay", razorpayOrderId: order.id, status: "created",
      } },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
    );
    await PaymentOrderIntent.updateOne(
      { _id: intent._id, status: "gateway_created", razorpayOrderId: order.id },
      { $set: { status: "completed", paymentOrder: localOrder._id } },
    );

    return res.status(201).json(paymentOrderResponse(order));
  } catch (error) {
    if (moveId && lockToken) {
      try {
        await Move.updateOne(
          { _id: moveId, "paymentOrderLock.token": lockToken },
          { $unset: { paymentOrderLock: 1 } },
        );
      } catch {
        // The lock expires automatically if the database is unavailable here.
      }
    }
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    return res.status(502).json({ message: "Could not create a payment order" });
  } finally {
    if (moveId && lockToken) {
      try {
        await Move.updateOne({ _id: moveId, "paymentOrderLock.token": lockToken }, { $unset: { paymentOrderLock: 1 } });
      } catch {
        // The durable order intent remains the gate if transient-lock cleanup fails.
      }
    }
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const razorpay = getRazorpay();
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
    if (
      typeof orderId !== "string" || !orderId || orderId.length > 128 ||
      typeof paymentId !== "string" || !paymentId || paymentId.length > 128 ||
      typeof signature !== "string" || !signature
    ) {
      return res.status(400).json({ message: "Payment verification details are incomplete" });
    }
    if (!validSignature(orderId, paymentId, signature)) {
      return res.status(400).json({ message: "Payment signature is invalid" });
    }

    let paymentOrder = await PaymentOrder.findOne({ user: req.user.id, razorpayOrderId: orderId });
    const gatewayPayment = await razorpay.payments.fetch(paymentId);
    if (gatewayPayment.status !== "captured") {
      return res.status(409).json({ message: "Payment is not captured" });
    }
    let gatewayOrder = null;
    try {
      if (gatewayPayment.order_id) gatewayOrder = await razorpay.orders.fetch(gatewayPayment.order_id);
    } catch {
      // A saved local order proves ownership even if the gateway order lookup is unavailable.
    }
    if (gatewayPayment.order_id !== orderId) {
      const actualOwnedOrder = await PaymentOrder.findOne({ user: req.user.id, razorpayOrderId: gatewayPayment.order_id });
      if (actualOwnedOrder) paymentOrder = actualOwnedOrder;
    }
    if (!paymentOrder) {
      const intentId = gatewayOrder?.notes?.intentId;
      const ownedIntent = typeof intentId === "string" && /^[a-f\d]{24}$/i.test(intentId)
        ? await PaymentOrderIntent.findOne({ _id: intentId, user: req.user.id })
        : null;
      if (!ownedIntent) return res.status(404).json({ message: "Payment order not found" });
    }
    const result = await processCapturedPayment({
      paymentOrder,
      gatewayOrder,
      gatewayPayment,
      source: "checkout_verification",
      signature,
      signatureOrderId: orderId,
      signaturePaymentId: paymentId,
    });
    if (result.status === "reconciliation_required") {
      return res.status(409).json({
        code: "PAYMENT_RECONCILIATION_REQUIRED",
        message: "Payment was captured but does not match the current payable quote. It has been recorded for admin review; do not pay again.",
        reconciliationId: result.reconciliation._id,
      });
    }
    return res.json({ success: true, payment: { _id: result.payment._id, paymentStatus: result.payment.paymentStatus } });
  } catch (error) {
    if (error.code === RETRYABLE_CAPTURE_ERROR) return res.status(503).json({ message: "Payment capture is being processed; retry verification shortly" });
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    return res.status(502).json({ message: "Could not verify payment with the gateway" });
  }
};

exports.handleWebhook = async (req, res) => {
  const eventId = req.get("x-razorpay-event-id");
  const signature = req.get("x-razorpay-signature");
  if (!eventId || eventId.length > 128 || !validWebhookSignature(req.rawBody, signature)) {
    return res.status(400).json({ message: "Webhook signature or event ID is invalid" });
  }
  const eventType = req.body?.event;
  const entity = eventType === "payment.captured" ? req.body?.payload?.payment?.entity : null;
  if (eventType === "payment.captured" && (!entity?.id || !entity?.order_id)) {
    return res.status(400).json({ message: "Captured payment event is incomplete" });
  }
  const eventOrderId = entity?.order_id || null;
  const eventPaymentId = entity?.id || null;
  const now = new Date();
  const leaseToken = crypto.randomUUID();
  let eventRecord;
  try {
    try {
      eventRecord = await PaymentWebhookEvent.findOneAndUpdate(
        { eventId },
        { $setOnInsert: {
          eventId,
          eventType: String(eventType || "unknown"),
          razorpayOrderId: eventOrderId,
          razorpayPaymentId: eventPaymentId,
          status: "processing",
          leaseUntil: new Date(0),
          attempts: 0,
        } },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
      eventRecord = await PaymentWebhookEvent.findOne({ eventId });
      if (!eventRecord) throw error;
    }
    if (eventRecord.eventType !== String(eventType || "unknown") ||
      eventRecord.razorpayOrderId !== eventOrderId || eventRecord.razorpayPaymentId !== eventPaymentId) {
      return res.status(409).json({ message: "Webhook event ID was already received with different event details" });
    }
    if (eventRecord.status === "processed") return res.json({ received: true, duplicate: true });
    const claimed = await PaymentWebhookEvent.findOneAndUpdate(
      { eventId, status: { $ne: "processed" }, leaseUntil: { $lte: now } },
      { $set: { status: "processing", leaseToken, leaseUntil: new Date(now.getTime() + 60_000), lastErrorCode: null }, $inc: { attempts: 1 } },
      { new: true },
    );
    if (!claimed) return res.status(503).json({ message: "Webhook event processing is already in progress; retry delivery" });

    let result = "ignored";
    if (eventType === "payment.captured") {
      const razorpay = getRazorpay();
      const gatewayPayment = await razorpay.payments.fetch(entity.id);
      if (gatewayPayment.id !== entity.id || gatewayPayment.status !== "captured") {
        const error = new Error("Gateway capture details are not confirmed");
        error.code = RETRYABLE_CAPTURE_ERROR;
        throw error;
      }
      const paymentOrder = await PaymentOrder.findOne({ razorpayOrderId: gatewayPayment.order_id || entity.order_id });
      let gatewayOrder = null;
      if (gatewayPayment.order_id) gatewayOrder = await razorpay.orders.fetch(gatewayPayment.order_id).catch(() => null);
      const captureResult = await processCapturedPayment({
        paymentOrder,
        gatewayOrder,
        gatewayPayment,
        source: "webhook",
        eventId,
        signedEventPayment: entity,
      });
      result = captureResult.status;
    }
    await PaymentWebhookEvent.updateOne(
      { eventId, leaseToken },
      { $set: { status: "processed", processedAt: new Date() }, $unset: { leaseToken: 1 } },
    );
    return res.json({ received: true, outcome: result });
  } catch (error) {
    if (eventRecord?._id) {
      await PaymentWebhookEvent.updateOne(
        { _id: eventRecord._id, leaseToken },
        { $set: { status: "failed", leaseUntil: new Date(0), lastErrorCode: error.code === RETRYABLE_CAPTURE_ERROR ? "capture_processing_retry" : "webhook_processing_failed" }, $unset: { leaseToken: 1 } },
      ).catch(() => {});
    }
    if (error.code === RETRYABLE_CAPTURE_ERROR) return res.status(503).json({ message: "Payment capture is being processed; retry webhook" });
    return res.status(502).json({ message: "Webhook could not be processed; retry delivery" });
  }
};

exports.getReconciliations = async (req, res) => {
  let pagination;
  try { pagination = parsePagination(req.query); }
  catch (error) { return res.status(400).json({ message: error.message, code: error.code }); }
  try {
    const requestedStatus = req.query.status || "pending_review";
    const statuses = ["pending_review", "resolved", "refunded", "credited", "failed"];
    if (requestedStatus !== "all" && !statuses.includes(requestedStatus)) {
      return res.status(400).json({ message: "Invalid reconciliation status filter" });
    }
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 120) : "";
    const filter = requestedStatus === "all" ? {} : { status: requestedStatus };
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { razorpayPaymentId: { $regex: escaped, $options: "i" } },
        { razorpayOrderId: { $regex: escaped, $options: "i" } },
        { reason: { $regex: escaped, $options: "i" } },
      ];
      if (mongoose.Types.ObjectId.isValid(search)) filter.$or.push({ move: search }, { user: search });
    }
    const result = await findPage({
      Model: PaymentReconciliation,
      filter,
      ...pagination,
      populate: [
        ["user", "name email"],
        ["move", "status price pricingStatus pricingVersion serviceMode"],
        ["paymentOrder", "razorpayOrderId amount currency pricingVersion status"],
        ["reviewedBy", "name email"],
        ["reviewHistory.admin", "name email"],
      ],
      sort: { receivedAt: 1, _id: 1 },
    });
    return res.json({
      items: result.data,
      total: result.pagination.total,
      page: result.pagination.page,
      limit: result.pagination.limit,
      pagination: result.pagination,
    });
  } catch {
    return res.status(500).json({ message: "Failed to fetch payment reconciliations" });
  }
};

exports.getOrderIntentReviews = async (req, res) => {
  let pagination;
  try { pagination = parsePagination(req.query); }
  catch (error) { return res.status(400).json({ message: error.message, code: error.code }); }
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 120) : "";
    const filter = { status: { $in: ["initiated", "gateway_created", "reconciliation_required"] } };
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { razorpayOrderId: { $regex: escaped, $options: "i" } },
        { receipt: { $regex: escaped, $options: "i" } },
      ];
      if (mongoose.Types.ObjectId.isValid(search)) filter.$or.push({ move: search }, { user: search });
    }
    const result = await findPage({
      Model: PaymentOrderIntent,
      filter,
      ...pagination,
      populate: [
        ["user", "name email"],
        ["move", "status price pricingStatus pricingVersion serviceMode"],
        ["paymentOrder", "razorpayOrderId amount currency status"],
        ["reviewedBy", "name email"],
        ["reviewHistory.admin", "name email"],
      ],
      sort: { requestedAt: 1, _id: 1 },
    });
    return res.json({
      items: result.data,
      total: result.pagination.total,
      page: result.pagination.page,
      limit: result.pagination.limit,
      pagination: result.pagination,
    });
  } catch {
    return res.status(500).json({ message: "Failed to fetch payment-order intent reviews" });
  }
};

const validateReviewInput = (body, { allowManualResolution = true, allowVerifiedAbsent = false } = {}) => {
  const allowed = allowManualResolution
    ? ["review_note", "mark_failed", "manual_resolution_reported"]
    : allowVerifiedAbsent ? ["review_note", "verified_absent_manual"] : ["review_note"];
  const action = body?.action;
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  const externalReference = typeof body?.externalReference === "string" ? body.externalReference.trim() : "";
  if (!allowed.includes(action) || reason.length < 5 || reason.length > 1000 || externalReference.length > 240) return null;
  if (action === "manual_resolution_reported" && !externalReference) return null;
  return { action, reason, externalReference: externalReference || null };
};

exports.reviewReconciliation = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid reconciliation ID" });
  const review = validateReviewInput(req.body);
  if (!review) return res.status(400).json({ message: "Enter a valid review action, reason, and required external reference" });
  try {
    const now = new Date();
    const set = { reviewedAt: now, reviewedBy: req.user.id };
    if (review.action === "mark_failed") set.status = "failed";
    if (review.action === "manual_resolution_reported") set.status = "resolved";
    const filter = { _id: req.params.id };
    if (review.action !== "review_note") filter.status = { $in: ["pending_review", "failed"] };
    const record = await PaymentReconciliation.findOneAndUpdate(
      filter,
      { $set: set, $push: { reviewHistory: { admin: req.user.id, at: now, ...review } } },
      { new: true, runValidators: true },
    );
    if (!record) return res.status(404).json({ message: "Pending or failed reconciliation record not found" });
    return res.json({
      record,
      message: review.action === "manual_resolution_reported"
        ? "Manual outcome recorded by admin. SwiftMove did not verify or execute a refund or credit."
        : "Review action recorded. The payment remains uncredited unless the verified payment processor completes it.",
    });
  } catch {
    return res.status(500).json({ message: "Failed to record reconciliation review" });
  }
};

exports.reviewOrderIntent = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid order-intent ID" });
  const review = req.body?.action === "verified_absent_manual"
    ? validateReviewInput(req.body, { allowManualResolution: false, allowVerifiedAbsent: true }) &&
      req.body.confirmNoGatewayOrder === true &&
      typeof req.body.externalReference === "string" && req.body.externalReference.trim()
      ? { action: "verified_absent_manual", reason: req.body.reason.trim(), externalReference: req.body.externalReference.trim() }
      : null
    : validateReviewInput(req.body, { allowManualResolution: false });
  if (!review) return res.status(400).json({ message: "Enter a review note, or confirm a verified absent gateway order with a reason and external evidence reference" });
  try {
    const now = new Date();
    const verifiedAbsent = review.action === "verified_absent_manual";
    const intent = await PaymentOrderIntent.findOneAndUpdate(
      {
        _id: req.params.id,
        status: { $in: ["initiated", "reconciliation_required"] },
        ...(verifiedAbsent ? { razorpayOrderId: null, paymentOrder: null } : {}),
      },
      {
        $set: {
          status: verifiedAbsent ? "failed" : "reconciliation_required",
          ...(verifiedAbsent ? { failureCode: "admin_verified_no_gateway_order" } : {}),
          reviewedAt: now,
          reviewedBy: req.user.id,
        },
        $push: { reviewHistory: { admin: req.user.id, at: now, ...review } },
      },
      { new: true, runValidators: true },
    );
    if (!intent) return res.status(404).json({ message: "Unresolved order intent not found" });
    return res.json({ intent, message: verifiedAbsent
      ? "Admin-attested gateway absence recorded. The next order request may reuse this audited intent with a fresh receipt."
      : "Review note saved. The intent still blocks new orders and estimate revisions; no cancellation or release was performed." });
  } catch {
    return res.status(500).json({ message: "Failed to record order-intent review" });
  }
};

exports.getMyPayments = async (req, res) => {
  let pagination;
  try { pagination = parsePagination(req.query); }
  catch (error) { return res.status(400).json({ message: error.message, code: error.code }); }
  try {
    const result = await findPage({
      Model: Payment,
      filter: { user: req.user.id },
      ...pagination,
      populate: [["move"]],
      sort: { createdAt: -1, _id: -1 },
    });
    const receiptEligibleIds = new Set();
    const candidates = result.data.filter((payment) =>
      payment.paymentStatus === "paid" && payment.gateway === "razorpay" &&
      payment.order && payment.razorpayPaymentId,
    );
    if (candidates.length) {
      try {
        const [processingRecords, orders] = await Promise.all([
          PaymentProcessing.find({
            user: req.user.id,
            status: "credited",
            razorpayPaymentId: { $in: candidates.map((payment) => payment.razorpayPaymentId) },
          }).select("user move paymentOrder razorpayPaymentId amountMinorUnits currency status completedAt").lean(),
          PaymentOrder.find({
            user: req.user.id,
            status: "paid",
            _id: { $in: candidates.map((payment) => payment.order) },
          }).select("_id user move amount currency razorpayPaymentId status").lean(),
        ]);
        const processingByPaymentId = new Map(processingRecords.map((record) => [record.razorpayPaymentId, record]));
        const orderById = new Map(orders.map((order) => [String(order._id), order]));
        for (const payment of candidates) {
          const move = payment.move?.toObject ? payment.move.toObject() : payment.move;
          const processing = processingByPaymentId.get(payment.razorpayPaymentId);
          const order = orderById.get(String(payment.order));
          if (receiptStateIsEligible({ payment, processing, order, move, userId: req.user.id })) {
            receiptEligibleIds.add(String(payment._id));
          }
        }
      } catch {
        // Receipt actions stay hidden if the optional eligibility lookup fails;
        // the payment history itself remains available.
      }
    }
    return sendPaginated(res, {
      ...result,
      data: result.data.map((payment) => {
        const record = payment.toObject ? payment.toObject() : { ...payment };
        return { ...record, receiptEligible: receiptEligibleIds.has(String(record._id)) };
      }),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch payment history" });
  }
};

const sameId = (left, right) => left != null && right != null && String(left) === String(right);
const referenceId = (value) => value && typeof value === "object" && value._id ? value._id : value;

const receiptStateIsEligible = ({ payment, processing, order, move, userId }) => {
  if (!payment || !processing || !order || !move || !userId ||
    payment.paymentStatus !== "paid" || payment.gateway !== "razorpay" ||
    !payment.razorpayPaymentId || !payment.order || !Number.isFinite(payment.amount) ||
    typeof payment.currency !== "string" || !/^[A-Z]{3}$/.test(payment.currency) ||
    processing.status !== "credited" || !processing.completedAt ||
    order.status !== "paid" || move.paid !== true) return false;

  let expectedMinorUnits;
  try { expectedMinorUnits = toMinorUnits(payment.amount, payment.currency); }
  catch { return false; }
  return sameId(payment.user, userId) && sameId(referenceId(payment.move), move._id) &&
    sameId(payment.order, processing.paymentOrder) && sameId(payment.order, order._id) &&
    sameId(payment.razorpayPaymentId, processing.razorpayPaymentId) &&
    sameId(payment.razorpayPaymentId, order.razorpayPaymentId) &&
    sameId(processing.user, userId) && sameId(processing.move, move._id) &&
    sameId(order.user, userId) && sameId(order.move, move._id) &&
    sameId(move.payment, payment._id) &&
    order.amount === payment.amount && order.currency === payment.currency &&
    processing.amountMinorUnits === expectedMinorUnits && processing.currency === payment.currency;
};

exports.getPaymentReceipt = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.paymentId)) {
    return res.status(404).json({ message: "Receipt unavailable" });
  }
  try {
    const payment = await Payment.findOne({ _id: req.params.paymentId, user: req.user.id })
      .select("user move order amount currency gateway razorpayPaymentId paymentStatus createdAt");
    if (!payment || payment.paymentStatus !== "paid" || payment.gateway !== "razorpay" ||
      !payment.razorpayPaymentId || !payment.order || !Number.isFinite(payment.amount) ||
      typeof payment.currency !== "string" || !/^[A-Z]{3}$/.test(payment.currency)) {
      return res.status(404).json({ message: "Receipt unavailable" });
    }

    const [processing, order, move, customer] = await Promise.all([
      PaymentProcessing.findOne({
        razorpayPaymentId: payment.razorpayPaymentId,
        user: req.user.id,
        move: payment.move,
        paymentOrder: payment.order,
        status: "credited",
      }).select("user move paymentOrder amountMinorUnits currency status completedAt"),
      PaymentOrder.findOne({
        _id: payment.order,
        user: req.user.id,
        move: payment.move,
        razorpayPaymentId: payment.razorpayPaymentId,
        status: "paid",
      }).select("user move amount currency razorpayPaymentId status"),
      Move.findOne({ _id: payment.move, user: req.user.id, paid: true, payment: payment._id })
        .select("pickup dropoff moveDate serviceMode vehicleType paid payment"),
      User.findById(req.user.id).select("name email"),
    ]);

    if (!customer || !receiptStateIsEligible({ payment, processing, order, move, userId: req.user.id })) {
      return res.status(404).json({ message: "Receipt unavailable" });
    }

    const receiptReference = `SM-RCP-${crypto.createHash("sha256")
      .update(payment.razorpayPaymentId)
      .digest("hex")
      .slice(0, 24)
      .toUpperCase()}`;
    return res.json({
      receiptId: receiptReference,
      company: { name: "SwiftMove" },
      customer: {
        ...(customer.name ? { name: customer.name } : {}),
        ...(customer.email ? { email: customer.email } : {}),
      },
      move: {
        id: String(move._id),
        ...(move.pickup?.address ? { pickup: move.pickup.address } : {}),
        ...(move.dropoff?.address ? { destination: move.dropoff.address } : {}),
        ...(move.moveDate ? { moveDate: move.moveDate } : {}),
        ...(move.serviceMode ? { serviceMode: move.serviceMode } : {}),
        ...(move.vehicleType ? { vehicleType: move.vehicleType } : {}),
      },
      payment: {
        id: String(payment._id),
        gatewayPaymentId: payment.razorpayPaymentId,
        ...(payment.createdAt ? { paidAt: payment.createdAt } : {}),
        amount: payment.amount,
        currency: payment.currency,
        status: payment.paymentStatus,
      },
    });
  } catch {
    return res.status(500).json({ message: "Could not retrieve receipt" });
  }
};

exports.startPaymentRecoveryWorker = () => {
  const timer = setInterval(async () => {
    try {
      await recoverPendingCapturedPayments(getRazorpay());
    } catch (error) {
      // Keep the worker alive while recording safe diagnostic metadata only.
      console.error("Payment recovery worker pass failed", {
        errorName: typeof error?.name === "string" ? error.name.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 60) : "Error",
        errorCode: Number.isSafeInteger(error?.code)
          ? error.code
          : typeof error?.code === "string" && /^[A-Z0-9_-]{1,60}$/.test(error.code)
            ? error.code
            : null,
      });
    }
  }, 30_000);
  timer.unref();
  return timer;
};
