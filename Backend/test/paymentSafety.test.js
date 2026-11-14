const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const Move = require("../src/models/move.model");
const Payment = require("../src/models/payment.model");
const PaymentOrder = require("../src/models/paymentOrder.model");
const PaymentReconciliation = require("../src/models/paymentReconciliation.model");
const PaymentWebhookEvent = require("../src/models/paymentWebhookEvent.model");
const PaymentProcessing = require("../src/models/paymentProcessing.model");
const PaymentOrderIntent = require("../src/models/paymentOrderIntent.model");
const { processCapturedPayment, recoverPendingCapturedPayments } = require("../src/services/capturedPayment.service");

const RAZORPAY_SECRET = "razorpay-test-secret-material-long-enough";
const WEBHOOK_SECRET = "webhook-test-secret-material-long-enough";
let remoteOrders;
let remotePayments;

class FakeRazorpay {
  constructor() {
    this.orders = { fetch: async (id) => remoteOrders.get(id) };
    this.payments = { fetch: async (id) => remotePayments.get(id) };
  }
}

const razorpayPath = require.resolve("razorpay");
const actualRazorpay = require("razorpay");
require.cache[razorpayPath].exports = FakeRazorpay;
const paymentController = require("../src/controllers/payment.controller");
require.cache[razorpayPath].exports = actualRazorpay;

const makeResponse = () => ({
  statusCode: 200,
  body: undefined,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

const setupEnv = (t) => {
  for (const [key, value] of Object.entries({
    RAZORPAY_KEY_ID: "rzp_test_unit",
    RAZORPAY_KEY_SECRET: RAZORPAY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: WEBHOOK_SECRET,
  })) {
    const previous = process.env[key];
    process.env[key] = value;
    t.after(() => { if (previous === undefined) delete process.env[key]; else process.env[key] = previous; });
  }
  let processing = null;
  t.mock.method(PaymentProcessing, "findOneAndUpdate", async (_filter, update) => {
    if (update.$setOnInsert && !processing) processing = { _id: "processing-fixture", ...update.$setOnInsert };
    if (update.$set) processing = { ...processing, ...update.$set };
    return processing;
  });
  t.mock.method(PaymentProcessing, "findOne", async () => processing);
  t.mock.method(PaymentProcessing, "updateOne", async (_filter, update) => {
    if (processing) {
      Object.assign(processing, update.$set || {});
      if (update.$unset?.leaseToken) delete processing.leaseToken;
    }
    return { modifiedCount: 1 };
  });
  let event = null;
  t.mock.method(PaymentWebhookEvent, "findOneAndUpdate", async (filter, update) => {
    if (update.$setOnInsert) {
      if (!event) event = { _id: "event-fixture", ...update.$setOnInsert };
      return event;
    }
    if (!event || event.eventId !== filter.eventId || event.status === "processed") return null;
    if (event.leaseUntil > new Date()) return null;
    event = { ...event, ...update.$set, attempts: (event.attempts || 0) + (update.$inc?.attempts || 0) };
    return event;
  });
  t.mock.method(PaymentWebhookEvent, "findOne", async () => event);
  t.mock.method(PaymentWebhookEvent, "find", () => ({ sort() { return this; }, limit: async () => [] }));
  t.mock.method(PaymentWebhookEvent, "updateOne", async (filter, update) => {
    if (event && (!filter.eventId || event.eventId === filter.eventId) && (!filter.leaseToken || event.leaseToken === filter.leaseToken) && (!filter._id || event._id === filter._id)) {
      Object.assign(event, update.$set || {});
      if (update.$unset?.leaseToken) delete event.leaseToken;
    }
    return { modifiedCount: 1 };
  });
};

const makeFixture = ({ version = 4, accepted = true, paid = false, amount = 125.5, gatewayAmount = 12550 } = {}) => {
  const user = new mongoose.Types.ObjectId();
  const moveId = new mongoose.Types.ObjectId();
  const orderId = `order_fixture_${crypto.randomUUID()}`;
  const paymentId = `pay_fixture_${crypto.randomUUID()}`;
  const move = {
    _id: moveId,
    user,
    paid,
    payment: null,
    price: amount,
    pricingStatus: "priced",
    pricingVersion: version,
    pricingAcceptanceRequired: true,
    pricingAcceptedAt: accepted ? new Date() : null,
    acceptedPricingVersion: accepted ? version : null,
    pricing: { currency: "INR", total: amount },
  };
  const paymentOrder = {
    _id: new mongoose.Types.ObjectId(),
    user,
    move: moveId,
    amount,
    currency: "INR",
    pricingVersion: version,
    gateway: "razorpay",
    razorpayOrderId: orderId,
    status: "created",
  };
  const gatewayOrder = { id: orderId, amount: gatewayAmount, currency: "INR", status: "paid" };
  const gatewayPayment = { id: paymentId, order_id: orderId, amount: gatewayAmount, currency: "INR", status: "captured" };
  return { user, move, paymentOrder, gatewayOrder, gatewayPayment, orderId, paymentId };
};

const signedVerification = (orderId, paymentId) => crypto.createHmac("sha256", RAZORPAY_SECRET)
  .update(`${orderId}|${paymentId}`).digest("hex");

const makeWebhookRequest = (eventId, eventType, entity) => {
  const body = { event: eventType, payload: { payment: { entity } } };
  const rawBody = Buffer.from(JSON.stringify(body));
  const signature = crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
  return {
    body,
    rawBody,
    get(name) {
      if (name.toLowerCase() === "x-razorpay-event-id") return eventId;
      if (name.toLowerCase() === "x-razorpay-signature") return signature;
      return undefined;
    },
  };
};

test("checkout verification rejects a captured payment unless the caller owns its saved order or intent", async (t) => {
  setupEnv(t);
  const fixture = makeFixture();
  remoteOrders = new Map([[fixture.orderId, fixture.gatewayOrder]]);
  remotePayments = new Map([[fixture.paymentId, fixture.gatewayPayment]]);
  t.mock.method(PaymentOrder, "findOne", async () => null);
  t.mock.method(PaymentOrderIntent, "findOne", async () => null);
  let paymentWrites = 0;
  t.mock.method(Payment, "create", async () => { paymentWrites += 1; });

  const response = makeResponse();
  await paymentController.verifyPayment({
    user: { id: new mongoose.Types.ObjectId() },
    body: {
      razorpay_order_id: fixture.orderId,
      razorpay_payment_id: fixture.paymentId,
      razorpay_signature: signedVerification(fixture.orderId, fixture.paymentId),
    },
  }, response);

  assert.equal(response.statusCode, 404);
  assert.equal(paymentWrites, 0);
});

test("captured payment for an obsolete quote is reconciled and never credits the move", async (t) => {
  setupEnv(t);
  const fixture = makeFixture({ version: 3 });
  const currentMove = { ...fixture.move, pricingVersion: 4, pricingAcceptedAt: new Date(), acceptedPricingVersion: 4 };
  const paymentOrder = { ...fixture.paymentOrder, pricingVersion: 3 };
  remoteOrders = new Map([[fixture.orderId, fixture.gatewayOrder]]);
  remotePayments = new Map([[fixture.paymentId, fixture.gatewayPayment]]);
  const reconciliation = { _id: "reconciliation-obsolete", reason: "obsolete_quote_version" };
  let savedReason;
  let markedPaid = false;
  t.mock.method(PaymentOrder, "findOne", async () => paymentOrder);
  t.mock.method(PaymentOrder, "updateOne", async (_filter, update) => { paymentOrder.status = update.$set.status; return {}; });
  t.mock.method(Move, "findOne", async () => currentMove);
  t.mock.method(Move, "findOneAndUpdate", async () => { markedPaid = true; return currentMove; });
  t.mock.method(Payment, "findOne", async () => null);
  t.mock.method(PaymentReconciliation, "findOneAndUpdate", async (_filter, update) => {
    savedReason = update.$setOnInsert.reason;
    return reconciliation;
  });

  const response = makeResponse();
  await paymentController.verifyPayment({
    body: {
      razorpay_order_id: fixture.orderId,
      razorpay_payment_id: fixture.paymentId,
      razorpay_signature: signedVerification(fixture.orderId, fixture.paymentId),
    },
    user: { id: String(fixture.user) },
  }, response);

  assert.equal(response.statusCode, 409);
  assert.equal(response.body.code, "PAYMENT_RECONCILIATION_REQUIRED");
  assert.equal(savedReason, "obsolete_quote_version");
  assert.equal(paymentOrder.status, "reconciliation_required");
  assert.equal(markedPaid, false);
});

test("captured payment amount mismatch is preserved for admin reconciliation", async (t) => {
  setupEnv(t);
  const fixture = makeFixture({ gatewayAmount: 12549 });
  remoteOrders = new Map([[fixture.orderId, fixture.gatewayOrder]]);
  remotePayments = new Map([[fixture.paymentId, fixture.gatewayPayment]]);
  let savedRecord;
  t.mock.method(PaymentOrder, "findOne", async () => fixture.paymentOrder);
  t.mock.method(PaymentOrder, "updateOne", async () => ({}));
  t.mock.method(PaymentOrder, "updateOne", async () => ({}));
  t.mock.method(Move, "findOne", async () => fixture.move);
  t.mock.method(Payment, "findOne", async () => null);
  t.mock.method(PaymentReconciliation, "findOneAndUpdate", async (_filter, update) => {
    savedRecord = update.$setOnInsert;
    return { _id: "reconciliation-amount" };
  });
  const response = makeResponse();
  await paymentController.verifyPayment({
    body: {
      razorpay_order_id: fixture.orderId,
      razorpay_payment_id: fixture.paymentId,
      razorpay_signature: signedVerification(fixture.orderId, fixture.paymentId),
    },
    user: { id: String(fixture.user) },
  }, response);
  assert.equal(response.statusCode, 409);
  assert.equal(savedRecord.reason, "amount_mismatch");
  assert.equal(savedRecord.amountMinorUnits, 12549);
  assert.equal(savedRecord.expectedAmountMinorUnits, 12550);
});

test("captured payment is reconciled if the gateway order lookup is temporarily unavailable", async (t) => {
  setupEnv(t);
  const fixture = makeFixture();
  remoteOrders = new Map();
  remotePayments = new Map([[fixture.paymentId, fixture.gatewayPayment]]);
  let reason;
  t.mock.method(PaymentOrder, "findOne", async () => fixture.paymentOrder);
  t.mock.method(PaymentOrder, "updateOne", async () => ({}));
  t.mock.method(Move, "findOne", async () => fixture.move);
  t.mock.method(Payment, "findOne", async () => null);
  t.mock.method(PaymentReconciliation, "findOneAndUpdate", async (_filter, update) => {
    reason = update.$setOnInsert.reason;
    return { _id: "reconciliation-gateway-order-unavailable" };
  });
  const response = makeResponse();
  await paymentController.verifyPayment({
    body: {
      razorpay_order_id: fixture.orderId,
      razorpay_payment_id: fixture.paymentId,
      razorpay_signature: signedVerification(fixture.orderId, fixture.paymentId),
    },
    user: { id: String(fixture.user) },
  }, response);
  assert.equal(response.statusCode, 409);
  assert.equal(response.body.code, "PAYMENT_RECONCILIATION_REQUIRED");
  assert.equal(reason, "gateway_order_mismatch");
});

test("captured payment for an unaccepted estimate is reconciled, never credited", async (t) => {
  setupEnv(t);
  const fixture = makeFixture({ accepted: false });
  remoteOrders = new Map([[fixture.orderId, fixture.gatewayOrder]]);
  remotePayments = new Map([[fixture.paymentId, fixture.gatewayPayment]]);
  let reason;
  let paid = false;
  t.mock.method(PaymentOrder, "findOne", async () => fixture.paymentOrder);
  t.mock.method(PaymentOrder, "updateOne", async () => ({}));
  t.mock.method(Move, "findOne", async () => fixture.move);
  t.mock.method(Move, "findOneAndUpdate", async () => { paid = true; return fixture.move; });
  t.mock.method(Payment, "findOne", async () => null);
  t.mock.method(PaymentReconciliation, "findOneAndUpdate", async (_filter, update) => {
    reason = update.$setOnInsert.reason;
    return { _id: "reconciliation-unaccepted" };
  });
  const response = makeResponse();
  await paymentController.verifyPayment({
    body: {
      razorpay_order_id: fixture.orderId,
      razorpay_payment_id: fixture.paymentId,
      razorpay_signature: signedVerification(fixture.orderId, fixture.paymentId),
    },
    user: { id: String(fixture.user) },
  }, response);
  assert.equal(response.statusCode, 409);
  assert.equal(reason, "quote_not_accepted");
  assert.equal(paid, false);
});

test("delayed captured webhook pays the matching accepted quote and duplicate event is idempotent", async (t) => {
  setupEnv(t);
  const fixture = makeFixture();
  remoteOrders = new Map([[fixture.orderId, fixture.gatewayOrder]]);
  remotePayments = new Map([[fixture.paymentId, fixture.gatewayPayment]]);
  let eventRecord = null;
  let paymentCount = 0;
  let moveCreditUpdate;
  eventRecord = null;
  t.mock.method(PaymentOrder, "findOne", async () => fixture.paymentOrder);
  t.mock.method(PaymentOrder, "findOneAndUpdate", async (_filter, update) => {
    Object.assign(fixture.paymentOrder, update.$set);
    return fixture.paymentOrder;
  });
  t.mock.method(PaymentOrder, "findById", async () => fixture.paymentOrder);
  t.mock.method(Move, "findOne", async () => fixture.move);
  t.mock.method(Move, "findOneAndUpdate", async (_filter, update) => {
    moveCreditUpdate = update;
    if (update.$set?.paid) {
      fixture.move.paid = true;
      fixture.move.payment = "payment-record-1";
    }
    return fixture.move;
  });
  t.mock.method(Move, "updateOne", async () => ({ modifiedCount: 1 }));
  t.mock.method(Payment, "findOne", async () => paymentCount ? { _id: "payment-record-1", order: fixture.paymentOrder._id, paymentStatus: "paid" } : null);
  t.mock.method(Payment, "create", async () => { paymentCount += 1; return { _id: "payment-record-1", paymentStatus: "paid" }; });

  const event = makeWebhookRequest("event_delayed_capture_1", "payment.captured", fixture.gatewayPayment);
  const first = makeResponse();
  await paymentController.handleWebhook(event, first);
  const duplicate = makeResponse();
  await paymentController.handleWebhook(event, duplicate);

  assert.equal(first.statusCode, 200);
  assert.equal(first.body.outcome, "paid");
  assert.equal(duplicate.statusCode, 200);
  assert.equal(duplicate.body.duplicate, true);
  assert.equal(paymentCount, 1);
  assert.equal(fixture.move.paid, true);
  assert.equal(moveCreditUpdate.$push.trackingEvents.event, "payment_confirmed");
  assert.ok(moveCreditUpdate.$push.trackingEvents.at instanceof Date);
  assert.equal(moveCreditUpdate.$push.trackingEvents.actor, null);
  assert.equal(moveCreditUpdate.$push.trackingEvents.actorRole, "system");
});

test("concurrent duplicate webhook delivery is atomically claimed once", async (t) => {
  setupEnv(t);
  const fixture = makeFixture();
  remoteOrders = new Map([[fixture.orderId, fixture.gatewayOrder]]);
  remotePayments = new Map([[fixture.paymentId, fixture.gatewayPayment]]);
  let paymentCount = 0;
  t.mock.method(PaymentOrder, "findOne", async () => fixture.paymentOrder);
  t.mock.method(PaymentOrder, "findOneAndUpdate", async (_filter, update) => {
    Object.assign(fixture.paymentOrder, update.$set || {});
    return fixture.paymentOrder;
  });
  t.mock.method(PaymentOrder, "findById", async () => fixture.paymentOrder);
  t.mock.method(Move, "findOne", async () => fixture.move);
  t.mock.method(Move, "findOneAndUpdate", async (_filter, update) => {
    if (update.$set?.paid) { fixture.move.paid = true; fixture.move.payment = "payment-race"; }
    return fixture.move;
  });
  t.mock.method(Move, "updateOne", async () => ({ modifiedCount: 1 }));
  t.mock.method(Payment, "findOne", async () => paymentCount ? { _id: "payment-race", order: fixture.paymentOrder._id, paymentStatus: "paid" } : null);
  t.mock.method(Payment, "create", async () => { paymentCount += 1; return { _id: "payment-race", paymentStatus: "paid" }; });

  const request = makeWebhookRequest("event_concurrent_capture", "payment.captured", fixture.gatewayPayment);
  const responses = [makeResponse(), makeResponse()];
  await Promise.all(responses.map((response) => paymentController.handleWebhook(request, response)));
  assert.equal(responses.filter((response) => response.statusCode === 200).length, 1);
  assert.equal(responses.filter((response) => response.statusCode === 503).length, 1);
  assert.equal(paymentCount, 1);
  assert.equal(fixture.move.paid, true);
});

test("delayed webhook for a captured obsolete quote creates a pending reconciliation", async (t) => {
  setupEnv(t);
  const fixture = makeFixture({ version: 2 });
  const currentMove = { ...fixture.move, pricingVersion: 3, acceptedPricingVersion: 3 };
  remoteOrders = new Map([[fixture.orderId, fixture.gatewayOrder]]);
  remotePayments = new Map([[fixture.paymentId, fixture.gatewayPayment]]);
  let reason;
  let moveCredit = false;
  t.mock.method(PaymentOrder, "findOne", async () => fixture.paymentOrder);
  t.mock.method(PaymentOrder, "updateOne", async (_filter, update) => { fixture.paymentOrder.status = update.$set.status; return {}; });
  t.mock.method(Move, "findOne", async () => currentMove);
  t.mock.method(Move, "findOneAndUpdate", async () => { moveCredit = true; return currentMove; });
  t.mock.method(Payment, "findOne", async () => null);
  t.mock.method(PaymentReconciliation, "findOneAndUpdate", async (_filter, update) => {
    reason = update.$setOnInsert.reason;
    return { _id: "reconciliation-delayed" };
  });
  const response = makeResponse();
  await paymentController.handleWebhook(
    makeWebhookRequest("event_obsolete_capture_1", "payment.captured", fixture.gatewayPayment),
    response,
  );
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.outcome, "reconciliation_required");
  assert.equal(reason, "obsolete_quote_version");
  assert.equal(fixture.paymentOrder.status, "reconciliation_required");
  assert.equal(moveCredit, false);
});

test("a second captured attempt after a move was credited is reconciled without double credit", async (t) => {
  setupEnv(t);
  const fixture = makeFixture({ paid: true });
  fixture.move.payment = "existing-payment";
  fixture.paymentOrder.status = "paid";
  const duplicatePayment = { ...fixture.gatewayPayment, id: `pay_second_${crypto.randomUUID()}` };
  remoteOrders = new Map([[fixture.orderId, fixture.gatewayOrder]]);
  remotePayments = new Map([[duplicatePayment.id, duplicatePayment]]);
  let reason;
  let paymentCreates = 0;
  t.mock.method(PaymentOrder, "findOne", async () => fixture.paymentOrder);
  t.mock.method(PaymentOrder, "updateOne", async () => ({}));
  t.mock.method(Move, "findOne", async () => fixture.move);
  t.mock.method(Payment, "findOne", async () => null);
  t.mock.method(Payment, "create", async () => { paymentCreates += 1; });
  t.mock.method(PaymentReconciliation, "findOneAndUpdate", async (_filter, update) => {
    reason = update.$setOnInsert.reason;
    return { _id: "reconciliation-second-attempt" };
  });
  const response = makeResponse();
  await paymentController.verifyPayment({
    body: {
      razorpay_order_id: fixture.orderId,
      razorpay_payment_id: duplicatePayment.id,
      razorpay_signature: signedVerification(fixture.orderId, duplicatePayment.id),
    },
    user: { id: String(fixture.user) },
  }, response);
  assert.equal(response.statusCode, 409);
  assert.equal(reason, "move_already_credited");
  assert.equal(paymentCreates, 0);
  assert.equal(fixture.move.payment, "existing-payment");
});

test("recovery completes an interrupted capture after the order was marked paid", async (t) => {
  setupEnv(t);
  const fixture = makeFixture();
  let processing;
  let storedPayment = null;
  let paymentCreateAttempts = 0;
  t.mock.method(PaymentProcessing, "findOneAndUpdate", async (_filter, update) => {
    if (update.$setOnInsert && !processing) processing = { _id: "processing-recovery", ...update.$setOnInsert };
    if (update.$set) processing = { ...processing, ...update.$set };
    return processing;
  });
  t.mock.method(PaymentProcessing, "findOne", async () => processing);
  t.mock.method(PaymentProcessing, "updateOne", async (_filter, update) => {
    Object.assign(processing, update.$set || {});
    if (update.$unset?.leaseToken) delete processing.leaseToken;
    return { modifiedCount: 1 };
  });
  t.mock.method(PaymentProcessing, "find", () => ({ sort() { return this; }, limit: async () => [processing] }));
  t.mock.method(PaymentOrder, "findOne", async () => fixture.paymentOrder);
  t.mock.method(PaymentOrder, "findOneAndUpdate", async (_filter, update) => {
    Object.assign(fixture.paymentOrder, update.$set || {});
    return fixture.paymentOrder;
  });
  t.mock.method(PaymentOrder, "findById", async () => fixture.paymentOrder);
  t.mock.method(Move, "findOne", async () => fixture.move);
  t.mock.method(Move, "findOneAndUpdate", async (_filter, update) => {
    if (update.$set?.paid) {
      fixture.move.paid = true;
      fixture.move.payment = update.$set.payment;
    }
    return fixture.move;
  });
  t.mock.method(Move, "updateOne", async () => ({ modifiedCount: 1 }));
  t.mock.method(Payment, "findOne", async () => storedPayment);
  t.mock.method(Payment, "create", async (record) => {
    paymentCreateAttempts += 1;
    if (paymentCreateAttempts === 1) throw new Error("simulated database outage after order update");
    storedPayment = { ...record, _id: "payment-recovered", paymentStatus: "paid" };
    return storedPayment;
  });

  await assert.rejects(processCapturedPayment({
    paymentOrder: fixture.paymentOrder,
    gatewayOrder: fixture.gatewayOrder,
    gatewayPayment: fixture.gatewayPayment,
    source: "checkout_verification",
  }), /simulated database outage/);
  assert.equal(fixture.paymentOrder.status, "paid");
  assert.equal(fixture.move.paid, false);
  assert.equal(storedPayment, null);

  // Simulate an expired lease so this unit test can exercise the worker immediately.
  processing.leaseUntil = new Date(0);
  const recovered = await recoverPendingCapturedPayments({
    payments: { fetch: async () => fixture.gatewayPayment },
    orders: { fetch: async () => fixture.gatewayOrder },
  });
  assert.equal(recovered, 1);
  assert.equal(paymentCreateAttempts, 2);
  assert.equal(storedPayment.razorpayPaymentId, fixture.paymentId);
  assert.equal(fixture.move.paid, true);
  assert.equal(processing.status, "credited");
});

test("webhook requires a valid signature and event ID", async (t) => {
  setupEnv(t);
  const response = makeResponse();
  await paymentController.handleWebhook({ body: {}, rawBody: Buffer.from("{}"), get: () => undefined }, response);
  assert.equal(response.statusCode, 400);
});

test("admin reconciliation review writes an actor, timestamp, reason, and external reference", async (t) => {
  const adminRouter = require("../src/routes/admin.routes");
  const adminId = new mongoose.Types.ObjectId();
  const reconciliationId = new mongoose.Types.ObjectId();
  let update;
  const saved = { _id: reconciliationId, status: "resolved", reviewHistory: [] };
  t.mock.method(PaymentReconciliation, "findOneAndUpdate", async (_filter, nextUpdate) => {
    update = nextUpdate;
    return saved;
  });
  const response = makeResponse();
  await paymentController.reviewReconciliation({
    params: { id: String(reconciliationId) },
    user: { id: String(adminId), role: "admin" },
    body: { action: "manual_resolution_reported", reason: "Refund verified in gateway dashboard", externalReference: "rfnd_ref_123" },
  }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(update.$set.reviewedBy, String(adminId));
  assert.ok(update.$set.reviewedAt instanceof Date);
  assert.equal(update.$set.status, "resolved");
  assert.equal(update.$push.reviewHistory.admin, String(adminId));
  assert.equal(update.$push.reviewHistory.action, "manual_resolution_reported");
  assert.equal(update.$push.reviewHistory.reason, "Refund verified in gateway dashboard");
  assert.equal(update.$push.reviewHistory.externalReference, "rfnd_ref_123");
  assert.match(response.body.message, /did not verify or execute/);
  assert.equal(JSON.stringify(update).includes("razorpaySignature"), false);

  const route = adminRouter.stack.find((layer) => layer.route?.path === "/payments/reconciliation/:id/review");
  assert.ok(route, "reconciliation review route is mounted");
  assert.equal(route.route.stack.length, 3, "authentication and admin-role guards run before the review controller");
});

test("recovery is an allowed reconciliation source and refund state remains manual", () => {
  assert.ok(PaymentReconciliation.schema.path("source").enumValues.includes("recovery"));
  assert.ok(PaymentReconciliation.schema.path("status").enumValues.includes("refunded"));
});

test("order intent release requires an audited admin attestation and no saved order IDs", async (t) => {
  const adminId = new mongoose.Types.ObjectId();
  const intentId = new mongoose.Types.ObjectId();
  let updateCalls = 0;
  let filter;
  let update;
  t.mock.method(PaymentOrderIntent, "findOneAndUpdate", async (nextFilter, nextUpdate) => {
    updateCalls += 1;
    filter = nextFilter;
    update = nextUpdate;
    return { _id: intentId, status: "failed" };
  });
  const invalid = makeResponse();
  await paymentController.reviewOrderIntent({
    params: { id: String(intentId) }, user: { id: String(adminId) },
    body: { action: "verified_absent_manual", reason: "No order in gateway search", externalReference: "case-77" },
  }, invalid);
  assert.equal(invalid.statusCode, 400);
  assert.equal(updateCalls, 0);

  const response = makeResponse();
  await paymentController.reviewOrderIntent({
    params: { id: String(intentId) }, user: { id: String(adminId), role: "admin" },
    body: {
      action: "verified_absent_manual",
      reason: "Checked gateway dashboard; no order for saved receipt",
      externalReference: "case-77",
      confirmNoGatewayOrder: true,
    },
  }, response);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(filter.status.$in, ["initiated", "reconciliation_required"]);
  assert.equal(filter.razorpayOrderId, null);
  assert.equal(filter.paymentOrder, null);
  assert.equal(update.$set.status, "failed");
  assert.equal(update.$set.failureCode, "admin_verified_no_gateway_order");
  assert.equal(update.$set.reviewedBy, String(adminId));
  assert.equal(update.$push.reviewHistory.admin, String(adminId));
  assert.equal(update.$push.reviewHistory.action, "verified_absent_manual");
  assert.equal(update.$push.reviewHistory.externalReference, "case-77");
  assert.match(response.body.message, /Admin-attested gateway absence/);
  assert.ok(PaymentOrderIntent.schema.path("reviewHistory").schema.path("action").enumValues.includes("verified_absent_manual"));
});
