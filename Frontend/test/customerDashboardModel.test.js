import test from "node:test";
import assert from "node:assert/strict";
import { canPayForMove, hasEstimateAction, summarizeCustomerMoves } from "../src/dashboards/customerDashboardModel.js";

test("a requested priced booking is eligible for its server-validated payment flow", () => {
  assert.equal(canPayForMove({
    _id: "move-1",
    status: "requested",
    paid: false,
    pricingStatus: "priced",
    price: 9237.79,
    pricing: { currency: "INR" },
    pricingAcceptanceRequired: false,
  }), true);
});

test("missing or incomplete price information is not eligible for payment", () => {
  const eligible = {
    _id: "move-1",
    status: "requested",
    paid: false,
    pricingStatus: "priced",
    price: 9237.79,
    pricing: { currency: "INR" },
  };
  assert.equal(canPayForMove({ ...eligible, pricingStatus: "unpriced" }), false);
  assert.equal(canPayForMove({ ...eligible, price: undefined }), false);
  assert.equal(canPayForMove({ ...eligible, status: "cancelled" }), false);
});

test("an estimate pending customer acceptance is not yet eligible for payment", () => {
  assert.equal(canPayForMove({
    _id: "move-1",
    status: "requested",
    paid: false,
    pricingStatus: "pending_acceptance",
    price: 9237.79,
    pricing: { currency: "INR" },
    pricingAcceptanceRequired: true,
  }), false);
});

test("already-paid bookings are not eligible for another payment attempt", () => {
  assert.equal(canPayForMove({
    _id: "move-1",
    status: "requested",
    paid: true,
    pricingStatus: "priced",
    price: 9237.79,
    pricing: { currency: "INR" },
    pricingAcceptanceRequired: false,
  }), false);
});

test("move summary counts upcoming, pending estimate, and completed records without overlap", () => {
  const result = summarizeCustomerMoves([
    { _id: "future", moveDate: "2026-11-20T00:00:00.000Z", status: "accepted" },
    { _id: "estimate", moveDate: "2026-11-19T00:00:00.000Z", status: "requested", pricingStatus: "pending_acceptance", pricingAcceptanceRequired: true },
    { _id: "done", moveDate: "2026-11-10T00:00:00.000Z", status: "completed" },
    { _id: "cancelled", moveDate: "2026-11-21T00:00:00.000Z", status: "cancelled" },
  ], "2026-11-15");

  assert.deepEqual({
    upcomingCount: result.upcomingCount,
    actionRequiredCount: result.actionRequiredCount,
    completedCount: result.completedCount,
    upcomingId: result.upcomingMove?._id,
  }, { upcomingCount: 1, actionRequiredCount: 1, completedCount: 1, upcomingId: "future" });
});

test("manual review awaiting an admin is not mislabelled as customer action", () => {
  assert.equal(hasEstimateAction({ pricingStatus: "manual_review", pricingAcceptanceRequired: true }), false);
  assert.equal(hasEstimateAction({ pricingStatus: "pending_acceptance", pricingAcceptanceRequired: true }), true);
});
