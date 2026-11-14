const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Move = require("../src/models/move.model");
const moveController = require("../src/controllers/move.controller");
const providerController = require("../src/controllers/provider.controller");

const response = () => ({
  statusCode: 200,
  body: undefined,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

const populatedQuery = (value) => {
  const result = {
    select() { return result; },
    populate() { return result; },
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
  };
  return result;
};

test("legacy moves expose an empty tracking history without fabricated events", async (t) => {
  const ownerId = new mongoose.Types.ObjectId();
  const moveId = new mongoose.Types.ObjectId();
  let filter;
  t.mock.method(Move, "findOne", (query) => {
    filter = query;
    return {
      select() { return this; },
      populate() { return this; },
      then(resolve, reject) {
        return Promise.resolve({ _id: moveId, status: "in_progress", trackingEvents: undefined }).then(resolve, reject);
      },
    };
  });
  const res = response();
  await moveController.getMyMoveTracking({ params: { id: moveId.toString() }, user: { id: ownerId.toString() } }, res);
  assert.deepEqual(filter, { _id: moveId.toString(), user: ownerId.toString() });
  assert.deepEqual(res.body.trackingEvents, []);

  const legacyDocument = new Move({
    user: ownerId,
    serviceMode: "transport_only",
    vehicleType: "tata_ace",
    moveDate: new Date("2030-01-01T00:00:00Z"),
  });
  assert.deepEqual(legacyDocument.trackingEvents, []);
});

test("customer tracking reads are scoped to the owner and hide another customer's move", async (t) => {
  const ownerId = new mongoose.Types.ObjectId();
  const moveId = new mongoose.Types.ObjectId();
  let filter;
  t.mock.method(Move, "findOne", (query) => {
    filter = query;
    return populatedQuery(null);
  });
  const res = response();
  await moveController.getMyMoveTracking({ params: { id: moveId.toString() }, user: { id: ownerId.toString() } }, res);
  assert.deepEqual(filter, { _id: moveId.toString(), user: ownerId.toString() });
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.trackingEvents, undefined);
});

test("tracking route requires customer authentication and user role", () => {
  const router = require("../src/routes/move.routes");
  const route = router.stack.find((layer) => layer.route?.path === "/:id/tracking").route;
  assert.equal(route.stack[0].name, "protect");
  assert.equal(route.stack[1].name, "<anonymous>");
  assert.equal(route.stack[2].handle, moveController.getMyMoveTracking);
});

test("mover acceptance records actual assignment and booking confirmation atomically", async (t) => {
  const moveId = new mongoose.Types.ObjectId();
  const moverId = new mongoose.Types.ObjectId();
  let assignmentFilter;
  let update;
  let assignmentAvailable = true;
  t.mock.method(Move, "findOneAndUpdate", (filter, updateDoc) => {
    assignmentFilter = filter;
    update = updateDoc;
    return populatedQuery(assignmentAvailable ? { _id: moveId, status: "accepted", provider: moverId } : null);
  });
  const res = response();
  await providerController.acceptMove({ params: { id: moveId.toString() }, user: { id: moverId.toString() }, body: { at: "2000-01-01", actor: "forged" } }, res);
  const events = update.$push.trackingEvents.$each;
  assert.equal(res.statusCode, 200);
  assert.equal(assignmentFilter.status, "requested");
  assert.equal(assignmentFilter.provider, null);
  assert.deepEqual(events.map((event) => event.event), ["booking_confirmed", "mover_assigned"]);
  assert.ok(events.every((event) => event.actorRole === "mover" && String(event.actor) === moverId.toString()));
  assert.ok(events[0].at instanceof Date);
  assert.equal(events[0].at.getTime(), events[1].at.getTime());
  assignmentAvailable = false;
  const duplicate = response();
  await providerController.acceptMove({ params: { id: moveId.toString() }, user: { id: moverId.toString() } }, duplicate);
  assert.equal(duplicate.statusCode, 409, "a move cannot be assigned a second time");
});

test("mover can record ordered milestones once, without client-supplied actor or time", async (t) => {
  const moveId = new mongoose.Types.ObjectId();
  const moverId = new mongoose.Types.ObjectId();
  const move = {
    _id: moveId,
    provider: moverId,
    status: "accepted",
    paid: true,
    trackingEvents: [],
  };
  let updateCalls = 0;
  let lastFilter;
  t.mock.method(Move, "findById", async () => move);
  t.mock.method(Move, "findOneAndUpdate", (filter, update) => {
    updateCalls += 1;
    lastFilter = filter;
    Object.assign(move, update.$set);
    move.trackingEvents.push(update.$push.trackingEvents);
    return populatedQuery({ ...move, trackingEvents: [...move.trackingEvents] });
  });

  const invoke = async (body) => {
    const result = response();
    await providerController.updateMoveStatus({
      params: { id: moveId.toString() }, body, user: { id: moverId.toString() },
    }, result);
    return result;
  };

  let res = await invoke({ milestone: "in_transit" });
  assert.equal(res.statusCode, 400);
  res = await invoke({ status: "completed" });
  assert.equal(res.statusCode, 400);
  assert.equal(updateCalls, 0);

  res = await invoke({ milestone: "pickup_started", at: "2000-01-01" });
  assert.equal(res.statusCode, 400, "client timestamps are rejected");
  assert.equal(updateCalls, 0);
  res = await invoke({ milestone: "payment_confirmed" });
  assert.equal(res.statusCode, 400, "payment confirmation is not a mover-submitted event");

  res = await invoke({ status: "in_progress", at: "2000-01-01" });
  assert.equal(res.statusCode, 400);
  res = await invoke({ status: "in_progress" });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.move.status, "in_progress");
  assert.equal(move.trackingEvents[0].event, "pickup_started");
  assert.ok(move.trackingEvents[0].at instanceof Date);
  assert.equal(String(move.trackingEvents[0].actor), moverId.toString());
  assert.equal(move.trackingEvents[0].actorRole, "mover");
  assert.equal(lastFilter.provider, moverId.toString());
  assert.equal(lastFilter.paid, true);
  assert.ok(lastFilter.$and.some((entry) => entry["trackingEvents.event"]?.$ne === "pickup_started"));

  res = await invoke({ milestone: "in_transit" });
  assert.equal(res.statusCode, 200);
  assert.equal(move.trackingEvents[1].event, "in_transit");
  assert.ok(move.trackingEvents.some((entry) => entry.event === "pickup_started"));
  assert.ok(lastFilter.$and.some((entry) => entry["trackingEvents.event"]?.$ne === "in_transit"));
  res = await invoke({ milestone: "in_transit" });
  assert.equal(res.statusCode, 409, "duplicate milestone is rejected");
  res = await invoke({ status: "completed" });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.move.status, "completed");
  assert.equal(move.trackingEvents[2].event, "delivery_completed");
  res = await invoke({ status: "completed" });
  assert.equal(res.statusCode, 409, "duplicate delivery is rejected");
  assert.equal(updateCalls, 3);
});

test("only the assigned mover can append move tracking events", async (t) => {
  const moveId = new mongoose.Types.ObjectId();
  const assignedMover = new mongoose.Types.ObjectId();
  const otherMover = new mongoose.Types.ObjectId();
  t.mock.method(Move, "findById", async () => ({
    _id: moveId, provider: assignedMover, status: "accepted", paid: true, trackingEvents: [],
  }));
  let writes = 0;
  t.mock.method(Move, "findOneAndUpdate", () => { writes += 1; return null; });
  const res = response();
  await providerController.updateMoveStatus({
    params: { id: moveId.toString() }, body: { milestone: "pickup_started" }, user: { id: otherMover.toString() },
  }, res);
  assert.equal(res.statusCode, 403);
  assert.equal(writes, 0);
});

test("legacy in-progress moves can record future transit and delivery without backfilled pickup history", async (t) => {
  const moveId = new mongoose.Types.ObjectId();
  const moverId = new mongoose.Types.ObjectId();
  const move = {
    _id: moveId,
    provider: moverId,
    status: "in_progress",
    paid: true,
    trackingEvents: [
      { event: "booking_confirmed", at: new Date("2020-01-01T00:00:00Z"), actorRole: "mover" },
      { event: "mover_assigned", at: new Date("2020-01-01T00:00:00Z"), actorRole: "mover" },
    ],
  };
  t.mock.method(Move, "findById", async () => move);
  t.mock.method(Move, "findOneAndUpdate", (_filter, update) => {
    Object.assign(move, update.$set);
    move.trackingEvents.push(update.$push.trackingEvents);
    return populatedQuery({ ...move, trackingEvents: [...move.trackingEvents] });
  });
  const res = response();
  await providerController.updateMoveStatus({
    params: { id: moveId.toString() },
    body: { milestone: "in_transit" },
    user: { id: moverId.toString() },
  }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(move.trackingEvents.some((entry) => entry.event === "pickup_started"), false);
  assert.equal(move.trackingEvents.at(-1).event, "in_transit");
  const completed = response();
  await providerController.updateMoveStatus({
    params: { id: moveId.toString() },
    body: { status: "completed" },
    user: { id: moverId.toString() },
  }, completed);
  assert.equal(completed.statusCode, 200);
  assert.equal(move.status, "completed");
  assert.equal(move.trackingEvents.some((entry) => entry.event === "pickup_started"), false);
  assert.equal(move.trackingEvents.at(-1).event, "delivery_completed");
});

test("unpaid moves cannot record pickup or transit milestones", async (t) => {
  const moveId = new mongoose.Types.ObjectId();
  const moverId = new mongoose.Types.ObjectId();
  t.mock.method(Move, "findById", async () => ({
    _id: moveId, provider: moverId, status: "accepted", paid: false, trackingEvents: [],
  }));
  let writes = 0;
  t.mock.method(Move, "findOneAndUpdate", () => { writes += 1; return null; });
  const res = response();
  await providerController.updateMoveStatus({
    params: { id: moveId.toString() }, body: { milestone: "pickup_started" }, user: { id: moverId.toString() },
  }, res);
  assert.equal(res.statusCode, 409);
  assert.equal(writes, 0);
});
