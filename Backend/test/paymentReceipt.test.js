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
  set() { return this; },
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
  let paymentFilter;
  t.mock.method(Payment, "findOne", (filter) => { paymentFilter = filter; return query(data.payment); });
  t.mock.method(PaymentProcessing, "findOne", () => query(data.processing));
  t.mock.method(PaymentOrder, "findOne", () => query(data.order));
  t.mock.method(Move, "findOne", () => query(data.move));
  t.mock.method(User, "findById", () => query(data.customer));
  return () => paymentFilter;
};

test("receipt uses consistent persisted payment, order, processing, move and customer records", async (t) => {
  const data = fixture();
  const getFilter = mockReceiptRecords(t, data);
  const res = response();
  await paymentController.getPaymentReceipt({ params: { paymentId: data.paymentId.toString() }, user: { id: data.userId.toString() } }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(getFilter(), { _id: data.paymentId.toString(), user: data.userId.toString() });
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
  const ineligible = { ...data.payment, _id: new mongoose.Types.ObjectId(), paymentStatus: "created" };
  t.mock.method(Payment, "find", (filter) => {
    assert.deepEqual(filter, { user: data.userId.toString() });
    return listQuery([{ ...data.payment, move: data.move }, ineligible]);
  });
  t.mock.method(Payment, "countDocuments", async () => 2);
  t.mock.method(PaymentProcessing, "find", (filter) => {
    assert.equal(filter.user, data.userId.toString());
    assert.equal(filter.status, "credited");
    return listQuery([data.processing]);
  });
  t.mock.method(PaymentOrder, "find", (filter) => {
    assert.equal(filter.user, data.userId.toString());
    assert.equal(filter.status, "paid");
    return listQuery([data.order]);
  });
  const res = response();
  await paymentController.getMyPayments({ query: {}, user: { id: data.userId.toString() } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body[0].receiptEligible, true);
  assert.equal(res.body[1].receiptEligible, false);
});

test("receipt lookup hides payments not owned by the authenticated customer", async (t) => {
  const data = fixture();
  const requesterId = new mongoose.Types.ObjectId();
  let downstreamLookups = 0;
  let filter;
  t.mock.method(Payment, "findOne", (queryFilter) => { filter = queryFilter; return query(null); });
  t.mock.method(PaymentProcessing, "findOne", () => { downstreamLookups += 1; return query(null); });
  t.mock.method(PaymentOrder, "findOne", () => { downstreamLookups += 1; return query(null); });
  t.mock.method(Move, "findOne", () => { downstreamLookups += 1; return query(null); });
  t.mock.method(User, "findById", () => { downstreamLookups += 1; return query(null); });
  const res = response();
  await paymentController.getPaymentReceipt({ params: { paymentId: data.paymentId.toString() }, user: { id: requesterId.toString() } }, res);
  assert.equal(res.statusCode, 404);
  assert.deepEqual(filter, { _id: data.paymentId.toString(), user: requesterId.toString() });
  assert.equal(res.body.message, "Receipt unavailable");
  assert.equal(downstreamLookups, 0);
});

test("pending, failed, refunded and non-Razorpay payment records cannot receive a receipt", async (t) => {
  for (const ineligible of [
    { label: "pending", paymentStatus: "created" },
    { label: "failed", paymentStatus: "failed" },
    { label: "refunded", paymentStatus: "refunded" },
    { label: "non-Razorpay", gateway: "cash" },
  ]) {
    await t.test(ineligible.label, async (subtest) => {
    const data = fixture();
    Object.assign(data.payment, ineligible);
    let downstreamLookups = 0;
    subtest.mock.method(Payment, "findOne", () => query(data.payment));
    subtest.mock.method(PaymentProcessing, "findOne", () => { downstreamLookups += 1; return query(data.processing); });
    subtest.mock.method(PaymentOrder, "findOne", () => { downstreamLookups += 1; return query(data.order); });
    subtest.mock.method(Move, "findOne", () => { downstreamLookups += 1; return query(data.move); });
    subtest.mock.method(User, "findById", () => { downstreamLookups += 1; return query(data.customer); });
    const res = response();
    await paymentController.getPaymentReceipt({ params: { paymentId: data.paymentId.toString() }, user: { id: data.userId.toString() } }, res);
    assert.equal(res.statusCode, 404);
    assert.equal(downstreamLookups, 0);
    });
  }
});

test("receipt is unavailable for unverified, reconciling, mismatched or uncredited payment state", async (t) => {
  const ineligibleCases = [
    { label: "missing capture processing record", processing: null },
    { label: "reconciliation-required capture", processing: (data) => ({ ...data.processing, status: "reconciliation_required" }) },
    { label: "capture amount mismatch", processing: (data) => ({ ...data.processing, amountMinorUnits: 999 }) },
    { label: "payment order currency mismatch", order: (data) => ({ ...data.order, currency: "EUR" }) },
    { label: "payment order awaiting reconciliation", order: (data) => ({ ...data.order, status: "reconciliation_required" }) },
    { label: "move not credited", move: null },
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
      const move = Object.hasOwn(ineligible, "move") ? ineligible.move : data.move;
      subtest.mock.method(Payment, "findOne", () => query(data.payment));
      subtest.mock.method(PaymentProcessing, "findOne", () => query(processing));
      subtest.mock.method(PaymentOrder, "findOne", () => query(order));
      subtest.mock.method(Move, "findOne", () => query(move));
      subtest.mock.method(User, "findById", () => query(data.customer));
      const res = response();
      await paymentController.getPaymentReceipt({ params: { paymentId: data.paymentId.toString() }, user: { id: data.userId.toString() } }, res);
      assert.equal(res.statusCode, 404);
      assert.equal(res.body.message, "Receipt unavailable");
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
