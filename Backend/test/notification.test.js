const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Move = require("../src/models/move.model");
const { getRecentNotifications } = require("../src/services/notification.service");
const { getMyNotifications } = require("../src/controllers/notification.controller");

const response = () => ({
  statusCode: 200,
  body: undefined,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

const listQuery = (value) => {
  const query = {
    select() { return query; },
    sort() { return query; },
    limit() { return query; },
    async lean() { return value; },
  };
  return query;
};

test("customer notifications are derived only from owned, persisted tracking events", async (t) => {
  const customerId = new mongoose.Types.ObjectId();
  const moveId = new mongoose.Types.ObjectId();
  const at = new Date("2026-06-01T10:00:00Z");
  let filter;
  t.mock.method(Move, "find", (query) => {
    filter = query;
    return listQuery([{
      _id: moveId,
      trackingEvents: [
        { _id: new mongoose.Types.ObjectId(), event: "booking_requested", at },
        { _id: new mongoose.Types.ObjectId(), event: "payment_confirmed", at: new Date(at.getTime() + 1000) },
        { _id: new mongoose.Types.ObjectId(), event: "mover_assigned", at: new Date(at.getTime() + 2000) },
        { _id: new mongoose.Types.ObjectId(), event: "delivery_completed", at: new Date(at.getTime() + 3000) },
        { _id: new mongoose.Types.ObjectId(), event: "payment_confirmed", at: new Date(at.getTime() + 1000) },
        { _id: new mongoose.Types.ObjectId(), event: "payment_confirmed", at: null },
      ],
    }]);
  });

  const notifications = await getRecentNotifications({ userId: customerId.toString(), role: "user" });
  assert.deepEqual(filter, { user: customerId.toString() });
  assert.equal(notifications.length, 4, "identical events and events without actual timestamps are not repeated or invented");
  assert.deepEqual(notifications.map((item) => item.event), [
    "delivery_completed", "mover_assigned", "payment_confirmed", "booking_requested",
  ]);
  assert.ok(notifications.every((item) => item.moveId === moveId.toString()));
  assert.equal(notifications.find((item) => item.event === "payment_confirmed").message, "Your payment was verified and applied to the move.");
  assert.equal(JSON.stringify(notifications).includes("amount"), false);
  assert.equal(JSON.stringify(notifications).includes("razorpay"), false);
  assert.equal(JSON.stringify(notifications).includes("email"), false);
});

test("mover notifications are scoped to assigned jobs and exclude customer-only events", async (t) => {
  const moverId = new mongoose.Types.ObjectId();
  const moveId = new mongoose.Types.ObjectId();
  t.mock.method(Move, "find", (filter) => {
    assert.deepEqual(filter, { provider: moverId.toString() });
    return listQuery([{
      _id: moveId,
      trackingEvents: [
        { event: "booking_requested", at: new Date("2026-06-01T10:00:00Z") },
        { event: "payment_confirmed", at: new Date("2026-06-01T10:01:00Z") },
        { event: "mover_assigned", at: new Date("2026-06-01T10:02:00Z") },
        { event: "in_transit", at: new Date("2026-06-01T10:03:00Z") },
      ],
    }]);
  });
  const notifications = await getRecentNotifications({ userId: moverId.toString(), role: "mover" });
  assert.deepEqual(notifications.map((item) => item.event), ["in_transit", "mover_assigned"]);
});

test("legacy moves without history return no fabricated notifications", async (t) => {
  const customerId = new mongoose.Types.ObjectId();
  t.mock.method(Move, "find", () => listQuery([{ _id: new mongoose.Types.ObjectId() }]));
  assert.deepEqual(await getRecentNotifications({ userId: customerId.toString(), role: "user" }), []);
});

test("failed or unverified payment activity does not produce a payment notification", async (t) => {
  const customerId = new mongoose.Types.ObjectId();
  t.mock.method(Move, "find", () => listQuery([{
    _id: new mongoose.Types.ObjectId(),
    trackingEvents: [
      { event: "payment_order_created", at: new Date("2026-06-01T10:00:00Z") },
      { event: "payment_failed", at: new Date("2026-06-01T10:01:00Z") },
      { event: "payment_confirmed", at: null },
    ],
  }]));
  assert.deepEqual(await getRecentNotifications({ userId: customerId.toString(), role: "user" }), []);
});

test("notification API returns data scoped to the authenticated customer or admin", async (t) => {
  const customerId = new mongoose.Types.ObjectId();
  let queryFilter;
  t.mock.method(Move, "find", (filter) => { queryFilter = filter; return listQuery([]); });
  const customerResponse = response();
  await getMyNotifications({ user: { id: customerId.toString(), role: "user" } }, customerResponse);
  assert.deepEqual(queryFilter, { user: customerId.toString() });
  assert.deepEqual(customerResponse.body, { notifications: [] });

  const adminResponse = response();
  await getMyNotifications({ user: { id: customerId.toString(), role: "admin" } }, adminResponse);
  assert.equal(adminResponse.statusCode, 200);
  assert.deepEqual(adminResponse.body, { notifications: [] });
  assert.equal(queryFilter.user, customerId.toString(), "admin requests never query customer move data");
});

test("notification routes enforce customer and approved-mover roles", () => {
  const router = require("../src/routes/notification.routes");
  const customerRoute = router.stack.find((layer) => layer.route?.path === "/customer").route;
  const moverRoute = router.stack.find((layer) => layer.route?.path === "/mover").route;
  const adminRoute = router.stack.find((layer) => layer.route?.path === "/admin").route;
  assert.equal(customerRoute.stack[0].name, "protect");
  assert.equal(customerRoute.stack.length, 3);
  assert.equal(customerRoute.stack.at(-1).handle, getMyNotifications);
  assert.equal(moverRoute.stack[0].name, "protect");
  assert.equal(moverRoute.stack.length, 4);
  assert.equal(moverRoute.stack[2].handle, require("../src/middleware/role.middleware").requireApprovedMover);
  assert.equal(moverRoute.stack.at(-1).handle, getMyNotifications);
  assert.equal(adminRoute.stack[0].name, "protect");
  assert.equal(adminRoute.stack[1].name, "<anonymous>");
  assert.equal(adminRoute.stack.at(-1).handle, getMyNotifications);

  const customerOnMoverRoute = response();
  moverRoute.stack[1].handle({ user: { role: "user" } }, customerOnMoverRoute, () => assert.fail("customer must not enter mover notifications"));
  assert.equal(customerOnMoverRoute.statusCode, 403);
  const moverOnCustomerRoute = response();
  customerRoute.stack[1].handle({ user: { role: "mover" } }, moverOnCustomerRoute, () => assert.fail("mover must not enter customer notifications"));
  assert.equal(moverOnCustomerRoute.statusCode, 403);
});
