const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const Payment = require("../src/models/payment.model");
const PaymentOrder = require("../src/models/paymentOrder.model");
const PaymentProcessing = require("../src/models/paymentProcessing.model");
const Move = require("../src/models/move.model");
const User = require("../src/models/User.model");
const paymentController = require("../src/controllers/payment.controller");

const response = () => ({
  statusCode: 200,
  body: undefined,
  headers: {},
  set(name, value) { this.headers[name] = value; return this; },
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

const query = (value) => {
  const result = {
    select() { return result; },
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
  };
  return result;
};

const listQuery = (value) => {
  const result = {
    select() { return result; },
    populate() { return result; },
    sort() { return result; },
    skip() { return result; },
    limit() { return result; },
    async lean() { return value; },
    async exec() { return value; },
  };
  return result;
};

const fixture = () => {
  const userId = new mongoose.Types.ObjectId();
  const moveId = new mongoose.Types.ObjectId();
  const paymentId = new mongoose.Types.ObjectId();
  const orderId = new mongoose.Types.ObjectId();
  const gatewayPaymentId = "pay_verified_receipt_123";
  const paidAt = new Date("2026-04-05T06:07:08.000Z");
  const payment = {
    _id: paymentId,
    user: userId,
    move: moveId,
    order: orderId,
    amount: 12.34,
    currency: "USD",
    gateway: "razorpay",
    razorpayPaymentId: gatewayPaymentId,
    paymentStatus: "paid",
    createdAt: new Date("2026-04-05T06:07:00.000Z"),
  };
  const processing = {
    user: userId,
    move: moveId,
    paymentOrder: orderId,
    razorpayPaymentId: gatewayPaymentId,
    amountMinorUnits: 1234,
    currency: "USD",
    status: "credited",
    completedAt: paidAt,
  };
  const order = {
    _id: orderId,
    user: userId,
    move: moveId,
    amount: 12.34,
    currency: "USD",
    razorpayPaymentId: gatewayPaymentId,
    status: "paid",
  };
  const move = {
    _id: moveId,
    user: userId,
    paid: true,
    payment: paymentId,
    pickup: { address: "12 North Street" },
    dropoff: { address: "44 South Avenue" },
    moveDate: new Date("2026-04-10T00:00:00.000Z"),
    serviceMode: "transport_only",
    vehicleType: "tata_ace",
  };
  const customer = { _id: userId, name: "Asha Customer", email: "asha@example.com" };
  return { userId, moveId, paymentId, orderId, gatewayPaymentId, paidAt, payment, processing, order, move, customer };
};

const mockReceiptRecords = (t, data) => {
  let paymentLookup;
  t.mock.method(Payment, "findById", (id) => { paymentLookup = id; return query(data.payment); });
  t.mock.method(PaymentProcessing, "findOne", () => query(data.processing));
  t.mock.method(PaymentOrder, "findById", () => query(data.order));
  t.mock.method(Move, "findById", () => query(data.move));
  t.mock.method(User, "findById", () => query(data.customer));
  return () => paymentLookup;
};

test("receipt uses consistent persisted payment, order, processing, move and customer records", async (t) => {
  const data = fixture();
  const getFilter = mockReceiptRecords(t, data);
  const res = response();
  await paymentController.getPaymentReceipt({ params: { paymentId: data.paymentId.toString() }, user: { id: data.userId.toString() } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(getFilter(), data.paymentId.toString());
  assert.equal(res.body.company.name, "SwiftMove");
  assert.match(res.body.receiptId, /^SM-RCP-[A-F0-9]{24}$/);
  assert.equal(res.body.receiptId, `SM-RCP-${crypto.createHash("sha256").update(data.gatewayPaymentId).digest("hex").slice(0, 24).toUpperCase()}`);
  assert.equal(res.body.customer.name, data.customer.name);
  assert.equal(res.body.customer.email, data.customer.email);
  assert.equal(res.body.move.id, data.moveId.toString());
  assert.equal(res.body.move.pickup, data.move.pickup.address);
  assert.equal(res.body.move.destination, data.move.dropoff.address);
  assert.equal(res.body.move.serviceMode, data.move.serviceMode);
  assert.equal(res.body.move.vehicleType, data.move.vehicleType);
  assert.equal(res.body.payment.id, data.paymentId.toString());
  assert.equal(res.body.payment.gatewayPaymentId, data.gatewayPaymentId);
  assert.equal(res.body.payment.amount, data.payment.amount);
  assert.equal(res.body.payment.currency, data.payment.currency);
  assert.equal(res.body.payment.status, "paid");
  assert.equal(new Date(res.body.payment.paidAt).toISOString(), data.payment.createdAt.toISOString());
  assert.equal(res.body.payment.razorpaySignature, undefined);
  assert.equal(res.body.payment.order, undefined);
  assert.equal(res.body.gst, undefined);
});

test("payment history marks only fully credited and reconciled payment rows as receipt eligible", async (t) => {
  const data = fixture();
  assert.equal(String(data.move.user), data.userId.toString());
  const ineligible = { ...data.payment, _id: new mongoose.Types.ObjectId(), paymentStatus: "created" };
  const foreignOrderId = new mongoose.Types.ObjectId();
  const foreignPaymentId = new mongoose.Types.ObjectId();
  const foreignPayment = { ...data.payment, _id: foreignPaymentId, order: foreignOrderId, razorpayPaymentId: "pay_foreign_move_456" };
  const foreignMove = { ...data.move, user: new mongoose.Types.ObjectId(), payment: foreignPaymentId };
  const foreignProcessing = { ...data.processing, paymentOrder: foreignOrderId, razorpayPaymentId: foreignPayment.razorpayPaymentId };
  const foreignOrder = { ...data.order, _id: foreignOrderId, razorpayPaymentId: foreignPayment.razorpayPaymentId };
  t.mock.method(Payment, "find", (filter) => {
    assert.deepEqual(filter, { user: data.userId.toString() });
    return listQuery([
      { ...data.payment, move: data.move },
      ineligible,
      { ...foreignPayment, move: foreignMove },
    ]);
  });
  t.mock.method(Payment, "countDocuments", async () => 3);
  t.mock.method(PaymentProcessing, "find", (filter) => {
    assert.equal(filter.user, data.userId.toString());
    assert.equal(filter.status, "credited");
    return listQuery([data.processing, foreignProcessing]);
  });
  t.mock.method(PaymentOrder, "find", (filter) => {
    assert.equal(filter.user, data.userId.toString());
    assert.equal(filter.status, "paid");
    return listQuery([data.order, foreignOrder]);
  });
  const res = response();
  await paymentController.getMyPayments({ query: {}, user: { id: data.userId.toString() } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body[0].receiptEligible, true);
  assert.equal(res.body[1].receiptEligible, false);
  assert.equal(res.body[2].receiptEligible, false, "a linked move owned by another customer cannot receive a receipt action");
});

test("receipt lookup returns 404 when the payment record does not exist", async (t) => {
  let downstreamLookups = 0;
  let diagnostic;
  t.mock.method(console, "warn", (...args) => { diagnostic = args; });
  t.mock.method(Payment, "findById", () => query(null));
  t.mock.method(PaymentProcessing, "findOne", () => { downstreamLookups += 1; return query(null); });
  t.mock.method(PaymentOrder, "findById", () => { downstreamLookups += 1; return query(null); });
  t.mock.method(Move, "findById", () => { downstreamLookups += 1; return query(null); });
  t.mock.method(User, "findById", () => { downstreamLookups += 1; return query(null); });
  const res = response();
  await paymentController.getPaymentReceipt({
    params: { paymentId: new mongoose.Types.ObjectId().toString() },
    user: { id: new mongoose.Types.ObjectId().toString() },
  }, res);
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.message, "Receipt unavailable");
  assert.equal(res.body.requestId, res.headers["X-Receipt-Request-Id"]);
  assert.deepEqual(diagnostic, ["Receipt unavailable", { requestId: res.body.requestId, reason: "payment_not_found" }]);
  assert.equal(downstreamLookups, 0);
});

test("invalid payment ID format returns a correlated generic 404 without database lookup", async (t) => {
  let diagnostic;
  t.mock.method(console, "warn", (...args) => { diagnostic = args; });
  t.mock.method(Payment, "findById", () => assert.fail("invalid ID must not query MongoDB"));
  const res = response();
  await paymentController.getPaymentReceipt({ params: { paymentId: "not-an-object-id" }, user: { id: "customer-id" } }, res);
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.message, "Receipt unavailable");
  assert.deepEqual(diagnostic, ["Receipt unavailable", { requestId: res.body.requestId, reason: "payment_id_invalid" }]);
});

test("receipt lookup hides payments not owned by the authenticated customer", async (t) => {
  const data = fixture();
  const requesterId = new mongoose.Types.ObjectId();
  let downstreamLookups = 0;
  let diagnostic;
  t.mock.method(console, "warn", (...args) => { diagnostic = args; });
  let lookup;
  t.mock.method(Payment, "findById", (id) => { lookup = id; return query(data.payment); });
  t.mock.method(PaymentProcessing, "findOne", () => { downstreamLookups += 1; return query(null); });
  t.mock.method(PaymentOrder, "findById", () => { downstreamLookups += 1; return query(null); });
  t.mock.method(Move, "findById", () => { downstreamLookups += 1; return query(null); });
  t.mock.method(User, "findById", () => { downstreamLookups += 1; return query(null); });
  const res = response();
  await paymentController.getPaymentReceipt({ params: { paymentId: data.paymentId.toString() }, user: { id: requesterId.toString() } }, res);
  assert.equal(res.statusCode, 404);
  assert.equal(lookup, data.paymentId.toString());
  assert.equal(res.body.message, "Receipt unavailable");
  assert.deepEqual(diagnostic, ["Receipt unavailable", { requestId: res.body.requestId, reason: "payment_owner_mismatch" }]);
  assert.equal(JSON.stringify(diagnostic).includes(data.paymentId.toString()), false);
  assert.equal(downstreamLookups, 0);
});

test("pending, failed, refunded and non-Razorpay payment records cannot receive a receipt", async (t) => {
  for (const ineligible of [
    { label: "pending", reason: "payment_not_paid", paymentStatus: "created" },
    { label: "failed", reason: "payment_not_paid", paymentStatus: "failed" },
    { label: "refunded", reason: "payment_not_paid", paymentStatus: "refunded" },
    { label: "non-Razorpay", reason: "payment_gateway_unsupported", gateway: "cash" },
  ]) {
    await t.test(ineligible.label, async (subtest) => {
    const data = fixture();
    Object.assign(data.payment, ineligible);
    let downstreamLookups = 0;
    let diagnostic;
    subtest.mock.method(console, "warn", (...args) => { diagnostic = args; });
    subtest.mock.method(Payment, "findById", () => query(data.payment));
    subtest.mock.method(PaymentProcessing, "findOne", () => { downstreamLookups += 1; return query(data.processing); });
    subtest.mock.method(PaymentOrder, "findById", () => { downstreamLookups += 1; return query(data.order); });
    subtest.mock.method(Move, "findById", () => { downstreamLookups += 1; return query(data.move); });
    subtest.mock.method(User, "findById", () => { downstreamLookups += 1; return query(data.customer); });
    const res = response();
    await paymentController.getPaymentReceipt({ params: { paymentId: data.paymentId.toString() }, user: { id: data.userId.toString() } }, res);
    assert.equal(res.statusCode, 404);
    assert.deepEqual(diagnostic, ["Receipt unavailable", { requestId: res.body.requestId, reason: ineligible.reason }]);
    assert.equal(downstreamLookups, 0);
    });
  }
});

test("receipt is unavailable for unverified, reconciling, mismatched or uncredited payment state", async (t) => {
  const ineligibleCases = [
    { label: "missing capture processing record", reason: "payment_processing_record_missing", processing: null },
    { label: "reconciliation-required capture", reason: "payment_not_credited", processing: (data) => ({ ...data.processing, status: "reconciliation_required" }) },
    { label: "capture amount mismatch", reason: "payment_verification_mismatch", processing: (data) => ({ ...data.processing, amountMinorUnits: 999 }) },
    { label: "missing payment order", reason: "payment_order_missing", order: null },
    { label: "payment order currency mismatch", reason: "payment_verification_mismatch", order: (data) => ({ ...data.order, currency: "EUR" }) },
    { label: "payment order awaiting reconciliation", reason: "payment_order_not_paid", order: (data) => ({ ...data.order, status: "reconciliation_required" }) },
    { label: "move not credited", reason: "move_record_missing", move: null },
    { label: "move ownership mismatch", reason: "move_owner_mismatch", move: (data) => ({ ...data.move, user: new mongoose.Types.ObjectId() }) },
  ];
  for (const ineligible of ineligibleCases) {
    await t.test(ineligible.label, async (subtest) => {
      const data = fixture();
      const processing = Object.hasOwn(ineligible, "processing")
        ? (typeof ineligible.processing === "function" ? ineligible.processing(data) : ineligible.processing)
        : data.processing;
      const order = Object.hasOwn(ineligible, "order")
        ? (typeof ineligible.order === "function" ? ineligible.order(data) : ineligible.order)
        : data.order;
      const move = Object.hasOwn(ineligible, "move")
        ? (typeof ineligible.move === "function" ? ineligible.move(data) : ineligible.move)
        : data.move;
      let diagnostic;
      subtest.mock.method(console, "warn", (...args) => { diagnostic = args; });
      subtest.mock.method(Payment, "findById", () => query(data.payment));
      subtest.mock.method(PaymentProcessing, "findOne", () => query(processing));
      subtest.mock.method(PaymentOrder, "findById", () => query(order));
      subtest.mock.method(Move, "findById", () => query(move));
      subtest.mock.method(User, "findById", () => query(data.customer));
      const res = response();
      await paymentController.getPaymentReceipt({ params: { paymentId: data.paymentId.toString() }, user: { id: data.userId.toString() } }, res);
      assert.equal(res.statusCode, 404);
      assert.equal(res.body.message, "Receipt unavailable");
      assert.deepEqual(diagnostic, ["Receipt unavailable", { requestId: res.body.requestId, reason: ineligible.reason }]);
    });
  }
});

test("missing optional customer and booking fields do not prevent a verified receipt", async (t) => {
  const data = fixture();
  data.customer = { _id: data.userId };
  data.move = { _id: data.moveId, user: data.userId, paid: true, payment: data.paymentId };
  mockReceiptRecords(t, data);
  const res = response();
  await paymentController.getPaymentReceipt({ params: { paymentId: data.paymentId.toString() }, user: { id: data.userId.toString() } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.customer, {});
  assert.deepEqual(res.body.move, { id: data.moveId.toString() });
});

test("a missing customer record does not produce a receipt", async (t) => {
  const data = fixture();
  let diagnostic;
  mockReceiptRecords(t, { ...data, customer: null });
  t.mock.method(console, "warn", (...args) => { diagnostic = args; });
  const res = response();
  await paymentController.getPaymentReceipt({ params: { paymentId: data.paymentId.toString() }, user: { id: data.userId.toString() } }, res);
  assert.equal(res.statusCode, 404);
  assert.deepEqual(diagnostic, ["Receipt unavailable", { requestId: res.body.requestId, reason: "customer_record_missing" }]);
});

test("receipt generation failure returns 500 and logs only a safe diagnostic", async (t) => {
  const data = fixture();
  mockReceiptRecords(t, data);
  let diagnostic;
  t.mock.method(console, "error", (...args) => { diagnostic = args; });
  t.mock.method(crypto, "createHash", () => { throw new Error("sensitive internal detail"); });
  const res = response();
  await paymentController.getPaymentReceipt({ params: { paymentId: data.paymentId.toString() }, user: { id: data.userId.toString() } }, res);
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.message, "Could not retrieve receipt");
  assert.equal(JSON.stringify(diagnostic).includes(data.paymentId.toString()), false);
  assert.equal(JSON.stringify(diagnostic).includes("sensitive internal detail"), false);
  assert.equal(diagnostic[1].reason, "receipt_lookup_or_generation_failure");
});

test("receipt route requires authentication and customer role", async () => {
  const router = require("../src/routes/payment.routes");
  const route = router.stack.find((layer) => layer.route?.path === "/:paymentId/receipt").route;
  assert.equal(route.stack[0].name, "protect");
  const anonymous = response();
  await route.stack[0].handle({ headers: {} }, anonymous, () => assert.fail("unauthenticated receipt requests must be rejected"));
  assert.equal(anonymous.statusCode, 401);

  let next = false;
  const admin = response();
  route.stack[1].handle({ user: { id: "admin-id", role: "admin" } }, admin, () => { next = true; });
  assert.equal(admin.statusCode, 403);
  assert.equal(next, false);
  assert.equal(route.stack.at(-1).handle, paymentController.getPaymentReceipt);
});
