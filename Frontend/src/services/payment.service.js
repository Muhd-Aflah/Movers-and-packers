const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Create Razorpay Order
 */
export const createOrder = async (amount, notes = {}) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/payments/create-order`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        notes,
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.error("Create Order Error:", text);
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.data;
};

/**
 * Verify Razorpay Payment
 */
export const verifyPayment = async (paymentData) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/payments/verify`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(paymentData),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.error("Verify Payment Error:", text);
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.data;
};

/**
 * Fetch Payment Details
 */
export const getPaymentDetails = async (paymentId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/payments/${paymentId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch payment details");
  }

  const data = await response.json();
  return data.data;
};

/**
 * Fetch Order Details
 */
export const getOrderDetails = async (orderId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/payments/order/${orderId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch order details");
  }

  const data = await response.json();
  return data.data;
};

/**
 * Refund Payment
 */
export const refundPayment = async (paymentId, amount) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/payments/refund`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ paymentId, amount }),
    }
  );

  if (!response.ok) {
    throw new Error("Refund failed");
  }

  const data = await response.json();
  return data.data;
};
