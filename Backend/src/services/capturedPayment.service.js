const crypto = require("crypto");
const Move = require("../models/move.model");
const Payment = require("../models/payment.model");
const PaymentOrder = require("../models/paymentOrder.model");
const PaymentReconciliation = require("../models/paymentReconciliation.model");
const PaymentProcessing = require("../models/paymentProcessing.model");
const PaymentWebhookEvent = require("../models/paymentWebhookEvent.model");
const PaymentOrderIntent = require("../models/paymentOrderIntent.model");
const { publishPaymentSuccessSafely } = require("./notification.service");

const RETRYABLE_CAPTURE_ERROR = "CAPTURE_PROCESSING_RETRY";
const PAYMENT_LOCK_MS = 5 * 60 * 1000;
const PROCESSING_LEASE_MS = 60 * 1000;

const logRecoveryFailure = (stage, paymentId, error) => {
  const safePaymentId = typeof paymentId === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(paymentId)
    ? paymentId
    : null;
  const errorCode = Number.isSafeInteger(error?.code)
    ? error.code
    : typeof error?.code === "string" && /^[A-Z0-9_-]{1,60}$/.test(error.code)
      ? error.code
      : null;
  console.error("Payment recovery attempt failed", {
    stage,
    razorpayPaymentId: safePaymentId,
    errorCode,
  });
};

const toMinorUnits = (amount, currency) => {
  const fractionDigits = new Intl.NumberFormat("en", {
    style: "currency",
    currency,
  }).resolvedOptions().maximumFractionDigits;
  return Math.round(amount * 10 ** fractionDigits);
};

const pricingWasAccepted = (move) => move.pricingAcceptanceRequired !== true ||
  Boolean(move.pricingAcceptedAt && move.acceptedPricingVersion === move.pricingVersion);

const paymentMismatchReason = ({ paymentOrder, gatewayOrder, gatewayPayment, move, signatureOrderId, signaturePaymentId, signedEventPayment }) => {
  if (!gatewayPayment || gatewayPayment.status !== "captured") return "gateway_payment_not_captured";
  if (!paymentOrder) return "local_payment_order_not_found";
  if (signaturePaymentId && signaturePaymentId !== gatewayPayment.id) return "gateway_payment_id_mismatch";
  if (signedEventPayment && (
    signedEventPayment.id !== gatewayPayment.id ||
    signedEventPayment.order_id !== gatewayPayment.order_id ||
    signedEventPayment.amount !== gatewayPayment.amount ||
    signedEventPayment.currency !== gatewayPayment.currency ||
    signedEventPayment.status !== gatewayPayment.status
  )) return "signed_webhook_payload_mismatch";
  if (!gatewayOrder || gatewayOrder.id !== gatewayPayment.order_id || gatewayOrder.id !== paymentOrder.razorpayOrderId || (signatureOrderId && signatureOrderId !== gatewayPayment.order_id)) return "gateway_order_mismatch";
  if (paymentOrder.gateway !== "razorpay") return "gateway_mismatch";
  if (paymentOrder.status === "reconciliation_required") return paymentOrder.reconciliationReason || "payment_order_already_reconciled";
  const expectedMinorUnits = toMinorUnits(paymentOrder.amount, paymentOrder.currency);
  if (gatewayPayment.amount !== expectedMinorUnits || gatewayOrder.amount !== expectedMinorUnits) return "amount_mismatch";
  if (gatewayPayment.currency !== paymentOrder.currency || gatewayOrder.currency !== paymentOrder.currency) return "currency_mismatch";
  if (gatewayOrder.status !== "paid") return "gateway_order_not_paid";
  if (!move) return "move_not_found";
  if (String(move.user) !== String(paymentOrder.user)) return "move_owner_mismatch";
  if (move.pricingStatus !== "priced" || move.price !== paymentOrder.amount || move.pricing?.currency !== paymentOrder.currency) return "move_quote_mismatch";
  if (move.pricingVersion !== paymentOrder.pricingVersion) return "obsolete_quote_version";
  if (!pricingWasAccepted(move)) return "quote_not_accepted";
  return null;
};

const recordReconciliation = async ({ paymentOrder, paymentOrderIntent, gatewayOrder, gatewayPayment, source, eventId, reason, move }) => {
  const paymentId = gatewayPayment?.id;
  if (typeof paymentId !== "string" || !paymentId) {
    throw new Error("Captured payment is missing its gateway payment ID");
  }
  const expectedAmountMinorUnits = paymentOrder
    ? toMinorUnits(paymentOrder.amount, paymentOrder.currency)
    : paymentOrderIntent
      ? toMinorUnits(paymentOrderIntent.amount, paymentOrderIntent.currency)
      : null;
  const setOnInsert = {
    gateway: "razorpay",
    user: paymentOrder?.user || paymentOrderIntent?.user || null,
    move: paymentOrder?.move || paymentOrderIntent?.move || move?._id || null,
    paymentOrder: paymentOrder?._id || null,
    paymentOrderIntent: paymentOrderIntent?._id || null,
    razorpayOrderId: gatewayPayment.order_id || gatewayOrder?.id || "unknown",
    razorpayPaymentId: paymentId,
    amountMinorUnits: Number.isSafeInteger(gatewayPayment.amount) ? gatewayPayment.amount : 0,
    currency: typeof gatewayPayment.currency === "string" ? gatewayPayment.currency : "INR",
    gatewayPaymentStatus: String(gatewayPayment.status || "unknown"),
    reason,
    source,
    quoteVersion: paymentOrder?.pricingVersion ?? paymentOrderIntent?.pricingVersion ?? null,
    currentQuoteVersion: move?.pricingVersion ?? null,
    expectedAmountMinorUnits,
    expectedCurrency: paymentOrder?.currency || paymentOrderIntent?.currency || null,
    webhookEventId: eventId || null,
    receivedAt: new Date(),
  };
  const update = { $setOnInsert: setOnInsert };
  let reconciliation;
  try {
    reconciliation = await PaymentReconciliation.findOneAndUpdate(
      { razorpayPaymentId: paymentId },
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    reconciliation = await PaymentReconciliation.findOne({ razorpayPaymentId: paymentId });
    if (!reconciliation) throw error;
  }
  if (paymentOrder?._id) {
    await PaymentOrder.updateOne(
      { _id: paymentOrder._id, status: { $ne: "paid" } },
      { $set: { status: "reconciliation_required", razorpayPaymentId: paymentId, reconciliationReason: reason } },
    );
  }
  if (paymentOrderIntent?._id) {
    await PaymentOrderIntent.updateOne(
      { _id: paymentOrderIntent._id, status: { $ne: "completed" } },
      { $set: {
        status: "reconciliation_required",
        failureCode: reason.slice(0, 80),
        ...(gatewayOrder?.id && gatewayOrder.notes?.intentId === String(paymentOrderIntent._id) ? { razorpayOrderId: gatewayOrder.id } : {}),
        lastAttemptAt: new Date(),
      } },
    );
  }
  await PaymentProcessing.updateOne(
    { razorpayPaymentId: paymentId, status: "processing" },
    { $set: { status: "reconciliation_required", completedAt: new Date() }, $unset: { leaseToken: 1 } },
  );
  if (eventId) {
    await PaymentWebhookEvent.updateOne(
      { eventId, status: { $ne: "processed" } },
      { $set: { status: "processed", processedAt: new Date() }, $unset: { leaseToken: 1 } },
    );
  }
  return reconciliation;
};

const resolvePaymentOrderFromGateway = async ({ gatewayOrder, gatewayPayment }) => {
  if (!gatewayOrder?.id || gatewayOrder.id !== gatewayPayment?.order_id) return null;
  const existing = await PaymentOrder.findOne({ razorpayOrderId: gatewayOrder.id });
  if (existing) return existing;
  const intentId = gatewayOrder.notes?.intentId;
  if (typeof intentId !== "string" || !/^[a-f\d]{24}$/i.test(intentId)) return null;
  const intent = await PaymentOrderIntent.findById(intentId);
  if (!intent ||
    (intent.razorpayOrderId && intent.razorpayOrderId !== gatewayOrder.id) ||
    gatewayOrder.notes?.moveId !== String(intent.move) ||
    gatewayOrder.notes?.userId !== String(intent.user) ||
    gatewayOrder.notes?.pricingVersion !== String(intent.pricingVersion) ||
    gatewayOrder.amount !== toMinorUnits(intent.amount, intent.currency) ||
    gatewayPayment.amount !== gatewayOrder.amount ||
    gatewayOrder.currency !== intent.currency || gatewayPayment.currency !== intent.currency ||
    !["created", "attempted", "paid"].includes(gatewayOrder.status)) return null;

  const localOrder = await PaymentOrder.findOneAndUpdate(
    { razorpayOrderId: gatewayOrder.id },
    { $setOnInsert: {
      user: intent.user,
      move: intent.move,
      amount: intent.amount,
      pricingVersion: intent.pricingVersion,
      currency: intent.currency,
      gateway: "razorpay",
      razorpayOrderId: gatewayOrder.id,
      status: "created",
    } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );
  if (String(localOrder.user) !== String(intent.user) || String(localOrder.move) !== String(intent.move) ||
    localOrder.amount !== intent.amount || localOrder.currency !== intent.currency || localOrder.pricingVersion !== intent.pricingVersion) return null;
  await PaymentOrderIntent.updateOne(
    { _id: intent._id, razorpayOrderId: { $in: [null, gatewayOrder.id] }, status: { $ne: "completed" } },
    { $set: { status: "completed", razorpayOrderId: gatewayOrder.id, paymentOrder: localOrder._id, lastAttemptAt: new Date() } },
  );
  return localOrder;
};

const finishProcessing = async ({ paymentId, lockToken, eventId, status }) => {
  await PaymentProcessing.updateOne(
    { razorpayPaymentId: paymentId, status: "processing", leaseToken: lockToken },
    { $set: { status, completedAt: new Date() }, $unset: { leaseToken: 1 } },
  );
  if (eventId) {
    await PaymentWebhookEvent.updateOne(
      { eventId, status: { $ne: "processed" } },
      { $set: { status: "processed", processedAt: new Date() }, $unset: { leaseToken: 1 } },
    );
  }
};

const markMovePaid = async ({ move, payment, paymentOrder, lockToken }) => Move.findOneAndUpdate(
  {
    _id: move._id,
    user: paymentOrder.user,
    paid: { $ne: true },
    pricingStatus: "priced",
    price: paymentOrder.amount,
    pricingVersion: paymentOrder.pricingVersion,
    "paymentOrderLock.token": lockToken,
    $or: [
      { pricingAcceptanceRequired: { $ne: true } },
      { pricingAcceptedAt: { $ne: null }, acceptedPricingVersion: paymentOrder.pricingVersion },
    ],
  },
  {
    $set: { paid: true, payment: payment._id },
    $push: { trackingEvents: {
      event: "payment_confirmed",
      at: new Date(),
      actor: null,
      actorRole: "system",
    } },
  },
  { new: true, runValidators: true },
);

const processCapturedPayment = async ({ paymentOrder, gatewayOrder, gatewayPayment, source, eventId, signature, signatureOrderId, signaturePaymentId, signedEventPayment }) => {
  if (!gatewayPayment?.id || !Number.isSafeInteger(gatewayPayment.amount) || !gatewayPayment.currency || !gatewayPayment.order_id) {
    throw new Error("Canonical captured payment details are incomplete");
  }
  if (!paymentOrder && gatewayOrder) paymentOrder = await resolvePaymentOrderFromGateway({ gatewayOrder, gatewayPayment });
  let paymentOrderIntent = null;
  if (!paymentOrder && typeof gatewayOrder?.notes?.intentId === "string" && /^[a-f\d]{24}$/i.test(gatewayOrder.notes.intentId)) {
    paymentOrderIntent = await PaymentOrderIntent.findById(gatewayOrder.notes.intentId);
  }
  const paymentId = gatewayPayment.id;
  const now = new Date();
  const processingSeed = {
    user: paymentOrder?.user || paymentOrderIntent?.user || null,
    move: paymentOrder?.move || paymentOrderIntent?.move || null,
    paymentOrder: paymentOrder?._id || null,
    gateway: "razorpay",
    razorpayOrderId: gatewayPayment.order_id,
    razorpayPaymentId: paymentId,
    amountMinorUnits: gatewayPayment.amount,
    currency: gatewayPayment.currency,
    source,
    webhookEventId: eventId || null,
    status: "processing",
    leaseUntil: new Date(0),
  };
  let processing;
  try {
    processing = await PaymentProcessing.findOneAndUpdate(
      { razorpayPaymentId: paymentId },
      { $setOnInsert: processingSeed },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    processing = await PaymentProcessing.findOne({ razorpayPaymentId: paymentId });
    if (!processing) throw error;
  }
  if (processing.status === "credited") {
    const priorPayment = await Payment.findOne({ razorpayPaymentId: paymentId });
    if (priorPayment) {
      if (eventId) await PaymentWebhookEvent.updateOne({ eventId, status: { $ne: "processed" } }, { $set: { status: "processed", processedAt: new Date() }, $unset: { leaseToken: 1 } });
      return { status: "paid", payment: priorPayment, idempotent: true };
    }
    const error = new Error("Credited payment record needs recovery");
    error.code = RETRYABLE_CAPTURE_ERROR;
    throw error;
  }
  if (processing.status === "reconciliation_required") {
    const reconciliation = await PaymentReconciliation.findOne({ razorpayPaymentId: paymentId });
    if (reconciliation) {
      if (eventId) await PaymentWebhookEvent.updateOne({ eventId, status: { $ne: "processed" } }, { $set: { status: "processed", processedAt: new Date() }, $unset: { leaseToken: 1 } });
      return { status: "reconciliation_required", reconciliation };
    }
    const error = new Error("Payment reconciliation record is missing");
    error.code = RETRYABLE_CAPTURE_ERROR;
    throw error;
  }

  const processingToken = crypto.randomUUID();
  const claimed = await PaymentProcessing.findOneAndUpdate(
    {
      razorpayPaymentId: paymentId,
      status: "processing",
      $or: [{ leaseUntil: { $lte: now } }, { leaseUntil: { $exists: false } }],
    },
    { $set: { leaseToken: processingToken, leaseUntil: new Date(now.getTime() + PROCESSING_LEASE_MS), lastAttemptAt: now }, $inc: { attempts: 1 } },
    { new: true },
  );
  if (!claimed) {
    const error = new Error("Captured payment processing is already claimed");
    error.code = RETRYABLE_CAPTURE_ERROR;
    throw error;
  }

  let move;
  let moveLockToken;
  try {
    move = paymentOrder?._id
      ? await Move.findOne({ _id: paymentOrder.move, user: paymentOrder.user })
      : paymentOrderIntent?._id
        ? await Move.findOne({ _id: paymentOrderIntent.move, user: paymentOrderIntent.user })
        : null;
    const reason = paymentMismatchReason({ paymentOrder, gatewayOrder, gatewayPayment, move, signatureOrderId, signaturePaymentId, signedEventPayment });
    if (reason) {
      const reconciliation = await recordReconciliation({ paymentOrder, paymentOrderIntent, gatewayOrder, gatewayPayment, source, eventId, reason, move });
      return { status: "reconciliation_required", reconciliation };
    }

    const alreadyRecorded = await Payment.findOne({ razorpayPaymentId: paymentId });
    if (alreadyRecorded) {
      if (String(alreadyRecorded.order) !== String(paymentOrder._id) || alreadyRecorded.paymentStatus !== "paid") {
        const reconciliation = await recordReconciliation({ paymentOrder, paymentOrderIntent, gatewayOrder, gatewayPayment, source, eventId, reason: "duplicate_payment_id_conflict", move });
        return { status: "reconciliation_required", reconciliation };
      }
      if (move.paid && String(move.payment) === String(alreadyRecorded._id)) {
        await finishProcessing({ paymentId, lockToken: processingToken, eventId, status: "credited" });
        return { status: "paid", payment: alreadyRecorded, idempotent: true };
      }
    }

    if (move.paid) {
      const reconciliation = await recordReconciliation({ paymentOrder, paymentOrderIntent, gatewayOrder, gatewayPayment, source, eventId, reason: "move_already_credited", move });
      return { status: "reconciliation_required", reconciliation };
    }

    moveLockToken = crypto.randomUUID();
    const lockNow = new Date();
    const lockedMove = await Move.findOneAndUpdate(
      {
        _id: move._id,
        user: paymentOrder.user,
        paid: { $ne: true },
        pricingStatus: "priced",
        price: paymentOrder.amount,
        pricingVersion: paymentOrder.pricingVersion,
        $and: [
          { $or: [
            { pricingAcceptanceRequired: { $ne: true } },
            { pricingAcceptedAt: { $ne: null }, acceptedPricingVersion: paymentOrder.pricingVersion },
          ] },
          { $or: [
            { "paymentOrderLock.expiresAt": { $exists: false } },
            { "paymentOrderLock.expiresAt": { $lte: lockNow } },
          ] },
        ],
      },
      { $set: { paymentOrderLock: { token: moveLockToken, expiresAt: new Date(lockNow.getTime() + PAYMENT_LOCK_MS) } } },
      { new: true, runValidators: true },
    );
    if (!lockedMove) {
      const latestMove = await Move.findById(move._id);
      const latestReason = paymentMismatchReason({ paymentOrder, gatewayOrder, gatewayPayment, move: latestMove, signatureOrderId, signaturePaymentId, signedEventPayment });
      if (latestReason || latestMove?.paid) {
        const reconciliation = await recordReconciliation({
          paymentOrder, paymentOrderIntent, gatewayOrder, gatewayPayment, source, eventId,
          reason: latestMove?.paid ? "move_already_credited" : latestReason,
          move: latestMove,
        });
        return { status: "reconciliation_required", reconciliation };
      }
      const error = new Error("Payment capture is waiting for a concurrent move update");
      error.code = RETRYABLE_CAPTURE_ERROR;
      throw error;
    }

    let storedOrder = await PaymentOrder.findOneAndUpdate(
      { _id: paymentOrder._id, $or: [
        { status: { $in: ["created", "failed"] } },
        { status: "paid", razorpayPaymentId: paymentId },
      ] },
      { $set: { status: "paid", razorpayPaymentId: paymentId, ...(signature ? { razorpaySignature: signature } : {}) } },
      { new: true, runValidators: true },
    );
    if (!storedOrder) storedOrder = await PaymentOrder.findById(paymentOrder._id);
    if (!storedOrder || storedOrder.status !== "paid" || storedOrder.razorpayPaymentId !== paymentId) {
      const reconciliation = await recordReconciliation({ paymentOrder, paymentOrderIntent, gatewayOrder, gatewayPayment, source, eventId, reason: "duplicate_payment_attempt", move: lockedMove });
      return { status: "reconciliation_required", reconciliation };
    }

    let savedPayment = alreadyRecorded;
    if (!savedPayment) {
      try {
        savedPayment = await Payment.create({
          user: paymentOrder.user,
          move: paymentOrder.move,
          order: paymentOrder._id,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          gateway: "razorpay",
          razorpayOrderId: paymentOrder.razorpayOrderId,
          razorpayPaymentId: paymentId,
          ...(signature ? { razorpaySignature: signature } : {}),
          paymentStatus: "paid",
        });
      } catch (error) {
        if (error.code !== 11000) throw error;
        savedPayment = await Payment.findOne({ razorpayPaymentId: paymentId });
        if (!savedPayment || String(savedPayment.order) !== String(paymentOrder._id)) throw error;
      }
    }

    const updatedMove = await markMovePaid({ move: lockedMove, payment: savedPayment, paymentOrder, lockToken: moveLockToken });
    if (!updatedMove) {
      const latestMove = await Move.findById(move._id);
      if (latestMove?.paid && String(latestMove.payment) === String(savedPayment._id)) {
        await finishProcessing({ paymentId, lockToken: processingToken, eventId, status: "credited" });
        return { status: "paid", payment: savedPayment, idempotent: true };
      }
      const reconciliation = await recordReconciliation({ paymentOrder, paymentOrderIntent, gatewayOrder, gatewayPayment, source, eventId, reason: "payment_saved_but_move_not_credited", move: latestMove || lockedMove });
      return { status: "reconciliation_required", reconciliation };
    }
    await finishProcessing({ paymentId, lockToken: processingToken, eventId, status: "credited" });
    await publishPaymentSuccessSafely({ move: updatedMove, paymentId });
    return { status: "paid", payment: savedPayment };
  } catch (error) {
    try {
      await PaymentProcessing.updateOne(
        { razorpayPaymentId: paymentId, status: "processing", leaseToken: processingToken },
        { $set: { lastErrorCode: error.code === RETRYABLE_CAPTURE_ERROR ? "retryable_processing_error" : "processing_error", leaseUntil: new Date(Date.now() + 30_000) }, $unset: { leaseToken: 1 } },
      );
    } catch {
      // The lease expires and the recovery worker will retry if MongoDB returns.
    }
    throw error;
  } finally {
    if (moveLockToken && move?._id) {
      await Move.updateOne(
        { _id: move._id, "paymentOrderLock.token": moveLockToken },
        { $unset: { paymentOrderLock: 1 } },
      );
    }
  }
};

const recoverPendingWebhookEvents = async (razorpay, limit) => {
  const events = await PaymentWebhookEvent.find({
    eventType: "payment.captured",
    status: { $in: ["failed", "processing"] },
    leaseUntil: { $lte: new Date() },
  }).sort({ createdAt: 1 }).limit(limit);
  for (const event of events) {
    const token = crypto.randomUUID();
    const claimed = await PaymentWebhookEvent.findOneAndUpdate(
      { _id: event._id, status: { $in: ["failed", "processing"] }, leaseUntil: { $lte: new Date() } },
      { $set: { status: "processing", leaseToken: token, leaseUntil: new Date(Date.now() + PROCESSING_LEASE_MS), lastErrorCode: null }, $inc: { attempts: 1 } },
      { new: true },
    );
    if (!claimed) continue;
    try {
      const gatewayPayment = await razorpay.payments.fetch(event.razorpayPaymentId);
      const gatewayOrder = await razorpay.orders.fetch(gatewayPayment.order_id || event.razorpayOrderId);
      const paymentOrder = await PaymentOrder.findOne({ razorpayOrderId: gatewayPayment.order_id || event.razorpayOrderId });
      await processCapturedPayment({
        paymentOrder,
        gatewayOrder,
        gatewayPayment,
        source: "webhook",
        eventId: event.eventId,
      });
    } catch (error) {
      logRecoveryFailure("webhook_event", event.razorpayPaymentId, error);
      await PaymentWebhookEvent.updateOne(
        { _id: event._id, leaseToken: token, status: { $ne: "processed" } },
        { $set: { status: "failed", leaseUntil: new Date(0), lastErrorCode: error.code === RETRYABLE_CAPTURE_ERROR ? "capture_processing_retry" : "webhook_recovery_failed" }, $unset: { leaseToken: 1 } },
      ).catch(() => {});
    }
  }
};

const recoverPendingCapturedPayments = async (razorpay, { limit = 25 } = {}) => {
  await recoverPendingWebhookEvents(razorpay, limit);
  const pending = await PaymentProcessing.find({
    status: "processing",
    leaseUntil: { $lte: new Date() },
  }).sort({ createdAt: 1 }).limit(limit);
  let recovered = 0;
  for (const record of pending) {
    try {
      const gatewayPayment = await razorpay.payments.fetch(record.razorpayPaymentId);
      let gatewayOrder = null;
      if (gatewayPayment.order_id) gatewayOrder = await razorpay.orders.fetch(gatewayPayment.order_id);
      const paymentOrder = await PaymentOrder.findOne({ razorpayOrderId: gatewayPayment.order_id || record.razorpayOrderId });
      await processCapturedPayment({
        paymentOrder,
        gatewayOrder,
        gatewayPayment,
        source: "recovery",
        eventId: record.webhookEventId,
      });
      recovered += 1;
    } catch (error) {
      logRecoveryFailure("captured_payment", record.razorpayPaymentId, error);
      await PaymentProcessing.updateOne(
        { _id: record._id, status: "processing", leaseUntil: { $lte: new Date() } },
        { $set: { leaseUntil: new Date(Date.now() + 30_000), lastErrorCode: error.code === RETRYABLE_CAPTURE_ERROR ? "retryable_processing_error" : "recovery_attempt_failed" } },
      ).catch(() => {});
      if (record.webhookEventId) {
        await PaymentWebhookEvent.updateOne(
          { eventId: record.webhookEventId, status: "processing" },
          { $set: { status: "failed", leaseUntil: new Date(0), lastErrorCode: "capture_recovery_attempt_failed" }, $unset: { leaseToken: 1 } },
        ).catch(() => {});
      }
    }
  }
  return recovered;
};

module.exports = {
  RETRYABLE_CAPTURE_ERROR,
  paymentMismatchReason,
  processCapturedPayment,
  recordReconciliation,
  recoverPendingCapturedPayments,
  toMinorUnits,
};
