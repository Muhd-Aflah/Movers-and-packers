import test from "node:test";
import assert from "node:assert/strict";
import { classifyQuoteResponse, getQuoteErrorFeedback } from "../src/components/booking/quoteFeedback.js";

test("manual full-service response is accepted as admin review, not a failed quote", () => {
  assert.equal(classifyQuoteResponse({
    pricingAvailable: false,
    manualEstimateRequired: true,
    pricingStatus: "manual_review",
    serviceMode: "full_service",
  }), "manual_review");
  assert.equal(classifyQuoteResponse({
    pricingAvailable: false,
    manualEstimateRequired: true,
    pricingStatus: "manual_review",
    serviceMode: "transport_only",
  }), "invalid");
});

test("missing pricing configuration displays the exact settings and does not offer a blind retry", () => {
  const feedback = getQuoteErrorFeedback({
    code: "PRICING_NOT_CONFIGURED",
    status: 503,
    details: { missing: ["tata_ace.minimumFare"], invalid: ["PRICING_CURRENCY"] },
  });
  assert.match(feedback.description, /tata_ace.minimumFare/);
  assert.match(feedback.description, /PRICING_CURRENCY/);
  assert.equal(feedback.retryable, false);
  assert.equal(feedback.editAddresses, false);
});

test("route resolution failures direct the customer to edit addresses", () => {
  assert.equal(getQuoteErrorFeedback({ code: "LOCATION_NOT_FOUND" }).editAddresses, true);
  assert.equal(getQuoteErrorFeedback({ code: "ROUTE_NOT_FOUND" }).retryable, false);
});

test("temporary route provider and network failures can be retried", () => {
  assert.equal(getQuoteErrorFeedback({ code: "DISTANCE_PROVIDER_ERROR", status: 502 }).retryable, true);
  assert.equal(getQuoteErrorFeedback({ message: "Failed to fetch" }).retryable, true);
});

test("a valid server quote requires a finite total and breakdown", () => {
  assert.equal(classifyQuoteResponse({ pricingAvailable: true, total: 700, breakdown: { transport: 700 } }), "priced");
  assert.equal(classifyQuoteResponse({ pricingAvailable: true, total: "700", breakdown: { transport: 700 } }), "invalid");
});
