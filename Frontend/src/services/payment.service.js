const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Create Razorpay Order
 */
export const createOrder = async (amount, notes = {}) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/api/payments/create-order`,
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
    let errorMessage = "Invalid payment order";
    try {
      const text = await response.text();
      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData.message || text;
      } catch (e) {
        errorMessage = text || errorMessage;
      }
    } catch (e) { }

    console.error("Create Order Error:", errorMessage);
    throw new Error(errorMessage);
  }

  // Handle various possible response structures seamlessly
  const data = await response.json();
  return data?.data || data?.order || data;
};

/**
 * Verify Razorpay Payment
 */
export const verifyPayment = async (paymentData) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/api/payments/verify`,
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
    throw new Error("Payment verification failed");
  }

  return await response.json();
};
