import test from "node:test";
import assert from "node:assert/strict";
import {
  createPaymentOrderGuard,
  requestPaymentOrder,
  validatePaymentOrder,
} from "../src/utils/paymentCheckout.js";

const move = { price: 12.34, pricing: { currency: "USD" } };
const validOrder = { key_id: "rzp_test_key", order_id: "order_123", amount: 1234, currency: "USD" };

test("validates the complete server order contract and keeps the displayed amount aligned", () => {
  assert.deepEqual(validatePaymentOrder(validOrder, move), {
    key: "rzp_test_key",
    order_id: "order_123",
    amount: 1234,
    currency: "USD",
  });
});

test("rejects a response missing the public Razorpay key ID", () => {
  const { key_id, ...order } = validOrder;
  assert.throws(() => validatePaymentOrder(order, move), /gateway configuration is incomplete/);
});

test("rejects a response missing the Razorpay order ID", () => {
  const { order_id, ...order } = validOrder;
  assert.throws(() => validatePaymentOrder(order, move), /did not return an order ID/);
});

test("rejects invalid or stale amounts", () => {
  for (const amount of [0, -1, 1234.5, Number.MAX_SAFE_INTEGER + 1, 1233]) {
    assert.throws(() => validatePaymentOrder({ ...validOrder, amount }, move));
  }
});

test("rejects currency mismatch", () => {
  assert.throws(() => validatePaymentOrder({ ...validOrder, currency: "INR" }, move), /currency does not match/);
});

test("releases duplicate-submission guard after an API failure", async () => {
  const guard = createPaymentOrderGuard();
  const apiError = new Error("Gateway unavailable");
  let requests = 0;
  await assert.rejects(requestPaymentOrder(guard, async () => {
    requests += 1;
    throw apiError;
  }, move), apiError);
  assert.equal(guard.acquire(), true);
  guard.release();
  assert.equal(requests, 1);
});

test("prevents duplicate order requests while the first submission is active", async () => {
  const guard = createPaymentOrderGuard();
  let completeRequest;
  let requests = 0;
  const pending = requestPaymentOrder(guard, () => {
    requests += 1;
    return new Promise((resolve) => { completeRequest = resolve; });
  }, move);
  assert.equal(await requestPaymentOrder(guard, async () => {
    requests += 1;
    return validOrder;
  }, move), null);
  assert.equal(requests, 1);
  completeRequest(validOrder);
  assert.equal((await pending).order_id, "order_123");
});
