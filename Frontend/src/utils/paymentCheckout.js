const toMinorUnits = (amount, currency) => {
  const fractionDigits = new Intl.NumberFormat("en", {
    style: "currency",
    currency,
  }).resolvedOptions().maximumFractionDigits;
  return Math.round(amount * 10 ** fractionDigits);
};

export function createPaymentOrderGuard() {
  let active = false;
  return {
    acquire() {
      if (active) return false;
      active = true;
      return true;
    },
    release() {
      active = false;
    },
  };
}

export function validatePaymentOrder(order, move) {
  if (!order || typeof order !== "object") {
    throw new Error("The payment service returned an invalid order response. Please retry.");
  }
  if (typeof order.key_id !== "string" || !order.key_id.trim()) {
    throw new Error("Payment gateway configuration is incomplete. Please contact support.");
  }
  if (typeof order.order_id !== "string" || !order.order_id.trim()) {
    throw new Error("The payment service did not return an order ID. Please retry.");
  }
  if (!Number.isSafeInteger(order.amount) || order.amount <= 0) {
    throw new Error("The payment service returned an invalid amount. Please refresh and try again.");
  }
  const currency = move?.pricing?.currency;
  if (typeof order.currency !== "string" || !currency || order.currency !== currency.toUpperCase()) {
    throw new Error("The payment currency does not match this estimate. Please refresh and try again.");
  }
  let expectedAmount;
  try {
    expectedAmount = toMinorUnits(move.price, order.currency);
  } catch {
    throw new Error("This estimate has an unsupported payment currency.");
  }
  if (!Number.isSafeInteger(expectedAmount) || expectedAmount <= 0 || order.amount !== expectedAmount) {
    throw new Error("The payment amount no longer matches this estimate. Refresh the page before paying.");
  }
  return {
    key: order.key_id,
    order_id: order.order_id,
    amount: order.amount,
    currency: order.currency,
  };
}

export async function requestPaymentOrder(guard, requestOrder, move) {
  if (!guard.acquire()) return null;
  try {
    return validatePaymentOrder(await requestOrder(), move);
  } catch (error) {
    guard.release();
    throw error;
  }
}
