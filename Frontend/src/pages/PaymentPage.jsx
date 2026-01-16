import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createOrder, verifyPayment } from "../services/payment.service";

export function PaymentPage() {
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [bookingData, setBookingData] = useState(null);

  useEffect(() => {
    // Load Razorpay script
    const loadRazorpayScript = () => {
      if (window.Razorpay) {
        setRazorpayLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        setRazorpayLoaded(true);
        console.log("Razorpay script loaded successfully");
      };
      script.onerror = () => {
        setError("Failed to load payment gateway. Please refresh the page.");
        console.error("Failed to load Razorpay script");
      };
      document.body.appendChild(script);
    };

    // Fetch booking data from localStorage or API
    const fetchBookingData = () => {
      // Get booking data from localStorage (set during booking process)
      const savedBooking = localStorage.getItem("currentBooking");
      if (savedBooking) {
        const booking = JSON.parse(savedBooking);
        setBookingData(booking);
      } else {
        // Fallback to default data
        setBookingData({
          service: "Warehousing",
          origin: "New York",
          destination: "Los Angeles",
          weight: "50 kg",
          price: "2500.00",
        });
      }
    };

    loadRazorpayScript();
    fetchBookingData();

    // Cleanup
    return () => {
      const existingScript = document.querySelector('script[src*="razorpay"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  // Calculate amount from booking data
  const totalAmount = bookingData?.price ? Number(bookingData.price) : 2500;

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      setError("Payment gateway is loading. Please wait...");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Create order via backend
      const order = await createOrder(totalAmount, {
        service: bookingData?.service || "Warehousing",
        origin: bookingData?.origin || "New York",
        destination: bookingData?.destination || "Los Angeles",
        customer_name: "John Doe",
        customer_email: "john@example.com",
      });

      console.log("Order created:", order);

      // Configure Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "SwiftMove Logistics",
        description: "Warehousing Service Payment",
        order_id: order.id,

        prefill: {
          name: "John Doe",
          email: "john@example.com",
          contact: "9999999999",
        },

        notes: {
          service: bookingData?.service || "Warehousing",
          origin: bookingData?.origin || "New York",
          destination: bookingData?.destination || "Los Angeles",
          booking_id: `BK_${Date.now()}`,
        },

        theme: {
          color: "#4f46e5",
        },

        modal: {
          ondismiss: function () {
            setLoading(false);
            console.log("Payment cancelled by user");
          },
        },

        handler: async function (response) {
          console.log("Payment Success:", response);

          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setSuccess("Payment Successful ✅");
            localStorage.removeItem("currentBooking");

            setTimeout(() => {
              window.location.href = "/";
            }, 1500);
          } catch (err) {
            console.error("Verification failed:", err);
            setError("Payment done, but verification failed.");
          } finally {
            setLoading(false);
          }
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function (response) {
        console.error("Payment Failed:", response.error);
        setError(response.error.description || "Payment failed");
        setLoading(false);
      });

      razorpay.open();
    } catch (error) {
      console.error("Payment Error:", error);
      setError(error.message || "Payment failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <Link
            to="/booking"
            className="text-blue-600 hover:text-blue-700 inline-flex items-center"
          >
            ← Back to Booking
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Payment
          </h1>
          <p className="text-gray-600 mb-8">
            Secure payment processing for your logistics service
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="text-red-600 mr-3">❌</div>
                <div>
                  <h4 className="font-semibold text-red-900">Error</h4>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="text-green-600 mr-3">✅</div>
                <div>
                  <h4 className="font-semibold text-green-900">Success</h4>
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-8">
            {/* Payment Summary */}
            <div className="md:col-span-1">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Booking Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Type:</span>
                    <span className="font-medium">
                      {bookingData?.service || "Warehousing"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Origin:</span>
                    <span className="font-medium">
                      {bookingData?.origin || "New York"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Destination:</span>
                    <span className="font-medium">
                      {bookingData?.destination || "Los Angeles"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weight:</span>
                    <span className="font-medium">
                      {bookingData?.weight || "50 kg"}
                    </span>
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">
                        Total Amount:
                      </span>
                      <span className="text-xl font-bold text-blue-600">
                        {bookingData?.price || "₹2500.00"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Gateway Info */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">🔒</div>
                  <div>
                    <h4 className="font-semibold text-blue-900">
                      Secure Payment
                    </h4>
                    <p className="text-sm text-blue-700">
                      Powered by Razorpay with end-to-end encryption
                    </p>
                  </div>
                </div>
              </div>

              {/* Loading Status */}
              {!razorpayLoaded && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="text-yellow-600 mr-3">⏳</div>
                    <div>
                      <h4 className="font-semibold text-yellow-900">
                        Loading Payment Gateway
                      </h4>
                      <p className="text-sm text-yellow-700">
                        Please wait while we initialize secure payment...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Form */}
            <div className="md:col-span-2">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">💳</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Razorpay Payment
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Click below to proceed with secure payment
                  </p>
                </div>

                {/* Payment Button */}
                <button
                  onClick={handlePayment}
                  disabled={loading || !razorpayLoaded}
                  className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Processing Payment...
                    </span>
                  ) : !razorpayLoaded ? (
                    "Loading Payment Gateway..."
                  ) : (
                    `Pay ₹${totalAmount.toFixed(2)} with Razorpay`
                  )}
                </button>

                {/* Cancel Button */}
                <Link
                  to="/booking"
                  className="block w-full bg-gray-200 text-gray-800 py-4 px-6 rounded-lg hover:bg-gray-300 font-medium text-center text-lg transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
