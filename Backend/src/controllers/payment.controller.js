const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Move = require("../models/move.model");
const Payment = require("../models/payment.model");
const PaymentOrder = require("../models/paymentOrder.model");

const PAYMENT_ORDER_LOCK_MS = 5 * 60 * 1000;

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

const toMinorUnits = (amount, currency) => {
  const fractionDigits = new Intl.NumberFormat("en", {
    style: "currency",
    currency,
  }).resolvedOptions().maximumFractionDigits;
  return Math.round(amount * 10 ** fractionDigits);
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

const markMovePaid = async (payment) => {
  const move = await Move.findOneAndUpdate(
    {
      _id: payment.move,
      user: payment.user,
      pricingStatus: "priced",
      price: payment.amount,
      $or: [{ paid: false }, { payment: payment._id }],
    },
    { $set: { paid: true, payment: payment._id } },
    { new: true, runValidators: true },
  );
  return Boolean(move);
};

exports.createOrder = async (req, res) => {
  let moveId;
  let lockToken;
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
      move.price <= 0
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
        $or: [
          { "paymentOrderLock.expiresAt": { $exists: false } },
          { "paymentOrderLock.expiresAt": { $lte: now } },
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
    const amount = toMinorUnits(lockedMove.price, currency);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      await Move.updateOne(
        { _id: lockedMove._id, "paymentOrderLock.token": lockToken },
        { $unset: { paymentOrderLock: 1 } },
      );
      lockToken = null;
      return res.status(409).json({ message: "This move cannot be paid with the configured currency" });
    }

    // From this point, always release the lock, including early returns.
    try {
    const pendingPayment = await PaymentOrder.findOne({
      user: req.user.id,
      move: lockedMove._id,
      status: "created",
    }).sort({ createdAt: -1 });

    if (pendingPayment) {
      const existingOrder = await razorpay.orders.fetch(pendingPayment.razorpayOrderId);
      if (existingOrder.status === "paid") {
        // A paid gateway order must never be replaced with another charge. The
        // customer can retry verification; reconciliation/webhooks are future work.
        return res.status(409).json({ message: "Payment was captured and is awaiting verification. Retry verification or contact support." });
      }
      if (["created", "attempted"].includes(existingOrder.status)) {
        if (existingOrder.amount !== amount || existingOrder.currency !== currency) {
          return res.status(409).json({ message: "The pending payment order does not match this move's saved price." });
        }
        return res.json({
          order_id: existingOrder.id,
          amount: existingOrder.amount,
          currency: existingOrder.currency,
        });
      }
      await PaymentOrder.updateOne({ _id: pendingPayment._id, status: "created" }, {
        $set: { status: "failed" },
      });
    }

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `move_${lockedMove._id}_${Date.now()}`,
      notes: { moveId: String(move._id), userId: String(req.user.id) },
    });

    const renewedLock = await Move.findOneAndUpdate(
      {
        _id: lockedMove._id,
        user: req.user.id,
        paid: { $ne: true },
        pricingStatus: "priced",
        price: lockedMove.price,
        "paymentOrderLock.token": lockToken,
        "paymentOrderLock.expiresAt": { $gt: new Date() },
      },
      {
        $set: {
          "paymentOrderLock.expiresAt": new Date(Date.now() + PAYMENT_ORDER_LOCK_MS),
        },
      },
      { new: true },
    );
    if (!renewedLock) {
      return res.status(409).json({ message: "Payment order preparation expired. Retry to get the current order." });
    }

    await PaymentOrder.create({
      user: req.user.id,
      move: lockedMove._id,
      amount: lockedMove.price,
      currency,
      gateway: "razorpay",
      razorpayOrderId: order.id,
      status: "created",
    });

    return res.status(201).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
    } finally {
      await Move.updateOne(
        { _id: move._id, "paymentOrderLock.token": lockToken },
        { $unset: { paymentOrderLock: 1 } },
      );
      lockToken = null;
    }
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
  }
};

exports.verifyPayment = async (req, res) => {
  let moveId;
  let lockToken;
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

    const paymentIdAlreadyUsed = await Payment.findOne({ razorpayPaymentId: paymentId });
    let paymentOrder = await PaymentOrder.findOne({ user: req.user.id, razorpayOrderId: orderId });
    if (!paymentOrder || (paymentIdAlreadyUsed && String(paymentIdAlreadyUsed.order) !== String(paymentOrder._id))) {
      return res.status(404).json({ message: "Payment order not found for this account" });
    }

    moveId = paymentOrder.move;
    const currentMove = await Move.findOne({ _id: moveId, user: req.user.id });
    if (!currentMove || currentMove.pricingStatus !== "priced" || currentMove.price !== paymentOrder.amount) {
      return res.status(409).json({ message: "Move price or ownership no longer matches this payment order" });
    }

    if (currentMove.paid) {
      if (
        paymentIdAlreadyUsed &&
        paymentOrder.status === "paid" &&
        paymentIdAlreadyUsed.paymentStatus === "paid" &&
        String(currentMove.payment) === String(paymentIdAlreadyUsed._id) &&
        String(paymentIdAlreadyUsed.order) === String(paymentOrder._id)
      ) {
        return res.json({ success: true, payment: { _id: paymentIdAlreadyUsed._id, paymentStatus: paymentIdAlreadyUsed.paymentStatus } });
      }
      return res.status(409).json({ message: "This move has already been paid with another payment" });
    }

    // A second captured payment for a separate order must not create a second
    // local payment record for the same move. This DB lock serializes callbacks
    // across API instances without depending on MongoDB transactions.
    lockToken = crypto.randomUUID();
    const now = new Date();
    const lockedMove = await Move.findOneAndUpdate(
      {
        _id: moveId,
        user: req.user.id,
        paid: { $ne: true },
        pricingStatus: "priced",
        price: paymentOrder.amount,
        $or: [
          { "paymentOrderLock.expiresAt": { $exists: false } },
          { "paymentOrderLock.expiresAt": { $lte: now } },
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
      lockToken = null;
      return res.status(409).json({ message: "Payment verification is already processing for this move. Retry shortly." });
    }

    try {
    let payment = paymentIdAlreadyUsed;
    if (paymentOrder.status !== "paid" || !payment) {
      const [order, gatewayPayment, move] = await Promise.all([
        razorpay.orders.fetch(orderId),
        razorpay.payments.fetch(paymentId),
        Move.findOne({
          _id: paymentOrder.move,
          user: req.user.id,
          pricingStatus: "priced",
          price: paymentOrder.amount,
        }),
      ]);

      const expectedMinorAmount = toMinorUnits(paymentOrder.amount, paymentOrder.currency);
      if (
        !move ||
        order.id !== orderId ||
        order.amount !== expectedMinorAmount ||
        order.currency !== paymentOrder.currency ||
        gatewayPayment.id !== paymentId ||
        gatewayPayment.order_id !== orderId ||
        gatewayPayment.amount !== expectedMinorAmount ||
        gatewayPayment.currency !== paymentOrder.currency ||
        gatewayPayment.status !== "captured" ||
        order.status !== "paid"
      ) {
        return res.status(409).json({ message: "Payment is not captured for this move and amount" });
      }

      const renewedLock = await Move.findOneAndUpdate(
        {
          _id: moveId,
          user: req.user.id,
          paid: { $ne: true },
          "paymentOrderLock.token": lockToken,
          "paymentOrderLock.expiresAt": { $gt: new Date() },
        },
        {
          $set: {
            "paymentOrderLock.expiresAt": new Date(Date.now() + PAYMENT_ORDER_LOCK_MS),
          },
        },
        { new: true },
      );
      if (!renewedLock) {
        return res.status(409).json({ message: "Payment verification lock expired. Retry verification." });
      }

      const updatedOrder = await PaymentOrder.findOneAndUpdate(
        { _id: paymentOrder._id, status: "created" },
        {
          $set: {
            status: "paid",
            razorpayPaymentId: paymentId,
            razorpaySignature: signature,
          },
        },
        { new: true, runValidators: true },
      );
      paymentOrder = updatedOrder || await PaymentOrder.findById(paymentOrder._id);
      if (!paymentOrder || paymentOrder.status !== "paid" || paymentOrder.razorpayPaymentId !== paymentId) {
        return res.status(409).json({ message: "Payment was already processed with different details" });
      }
      payment = payment || await Payment.findOne({ razorpayPaymentId: paymentId });
      if (!payment) {
        try {
          payment = await Payment.create({
            user: req.user.id,
            move: paymentOrder.move,
            order: paymentOrder._id,
            amount: paymentOrder.amount,
            currency: paymentOrder.currency,
            gateway: "razorpay",
            razorpayOrderId: paymentOrder.razorpayOrderId,
            razorpayPaymentId: paymentId,
            razorpaySignature: signature,
            paymentStatus: "paid",
          });
        } catch (error) {
          payment = await Payment.findOne({ razorpayPaymentId: paymentId });
          if (!payment || String(payment.order) !== String(paymentOrder._id)) throw error;
        }
      }
    } else if (payment.razorpayOrderId !== orderId) {
      return res.status(409).json({ message: "This order was already paid with another payment" });
    }

    if (!payment) return res.status(409).json({ message: "Payment record could not be confirmed" });
    const moveUpdated = await markMovePaid(payment);
    if (!moveUpdated) {
      return res.status(409).json({ message: "Payment is recorded, but the move could not be updated. Contact support." });
    }

    return res.json({ success: true, payment: { _id: payment._id, paymentStatus: payment.paymentStatus } });
    } finally {
      await Move.updateOne(
        { _id: moveId, "paymentOrderLock.token": lockToken },
        { $unset: { paymentOrderLock: 1 } },
      );
      lockToken = null;
    }
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
    return res.status(502).json({ message: "Could not verify payment with the gateway" });
  }
};

exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate("move")
      .sort({ createdAt: -1 });
    return res.json(payments);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch payment history" });
  }
};
