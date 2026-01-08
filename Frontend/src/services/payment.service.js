const API_BASE_URL = 'http://localhost:5000/api/payments';

/**
 * Create Razorpay Order
 * @param {number} amount - Payment amount in rupees
 * @param {object} notes - Additional notes for the order
 * @returns {Promise<object>} Order details from Razorpay
 */
export const createOrder = async (amount, notes = {}) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Only add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}/create-order`;
    console.log('Making request to:', url);
    console.log('Request data:', { amount, currency: 'INR', notes });

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        amount,
        currency: 'INR',
        notes: {
          service: 'Logistics Service',
          timestamp: new Date().toISOString(),
          ...notes
        }
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to create order');
    }
  } catch (error) {
    console.error('Create Order Error:', error);
    throw error;
  }
};

/**
 * Verify Razorpay Payment
 * @param {object} paymentData - Payment verification data
 * @returns {Promise<object>} Verification result
 */
export const verifyPayment = async (paymentData) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Only add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/verify`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Payment verification failed');
    }
  } catch (error) {
    console.error('Verify Payment Error:', error);
    throw error;
  }
};

/**
 * Get Payment Details
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<object>} Payment details
 */
export const getPaymentDetails = async (paymentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch payment details');
    }
  } catch (error) {
    console.error('Get Payment Details Error:', error);
    throw error;
  }
};

/**
 * Get Order Details
 * @param {string} orderId - Razorpay order ID
 * @returns {Promise<object>} Order details
 */
export const getOrderDetails = async (orderId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/order/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch order details');
    }
  } catch (error) {
    console.error('Get Order Details Error:', error);
    throw error;
  }
};

/**
 * Process Refund
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Refund amount (optional)
 * @returns {Promise<object>} Refund details
 */
export const processRefund = async (paymentId, amount) => {
  try {
    const response = await fetch(`${API_BASE_URL}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        paymentId,
        amount
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Refund failed');
    }
  } catch (error) {
    console.error('Process Refund Error:', error);
    throw error;
  }
};