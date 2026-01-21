import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom"; // Import useLocation
import { createOrder, verifyPayment } from "../services/payment.service";

export function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation(); // Initialize useLocation
  const [bookingDetails, setBookingDetails] = useState(null); // Renamed from bookingData
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [razorpayReady, setRazorpayReady] = useState(false);

  useEffect(() => {
    // Retrieve orderId and amount from navigation state
    const { orderId, amount } = location.state || {};

    if (!orderId || !amount) {
      const saved = localStorage.getItem("currentBooking");
      if (!saved) {
        navigate("/booking");
        return;
      }
      const parsed = JSON.parse(saved);
      setBookingDetails({ orderId: parsed.orderId, amount: parsed.amount, ...parsed }); // Set from localStorage if state is empty
    } else {
      setBookingDetails({ orderId, amount }); // Set from state
    }

    // Existing Razorpay script loading logic
    if (window.Razorpay) {
      setRazorpayReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      console.log("Razorpay loaded");
      setRazorpayReady(true);
    };
    script.onerror = () => setError("Failed to load payment gateway");
    document.body.appendChild(script);
  }, [navigate, location.state]); // Added location.state to dependencies

  if (!bookingDetails) return null;

  const handlePayment = async () => {
    if (!razorpayReady || loading) return;

    setLoading(true);
    setError("");

    try {
      // Pass orderId to createOrder
      const order = await createOrder(bookingDetails.amount, bookingDetails.orderId);

      if (!order?.id || !order?.amount) {
        throw new Error("Invalid payment order");
      }

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        throw new Error("Razorpay key missing");
      }

      const rzp = new window.Razorpay({
        key: razorpayKey,
        order_id: order.id,
        amount: order.amount,
        currency: "INR",
        name: "SwiftMove",
        description: "Move Booking Payment",

        prefill: {
          // Use bookingDetails for prefill, assuming it includes name, email, phone
          name: bookingDetails.name || "",
          email: bookingDetails.email || "",
          contact: bookingDetails.phone || "",
        },

        handler: async (res) => {
          await verifyPayment(res); // This function will now handle database updates
          localStorage.removeItem("currentBooking");
          navigate("/dashboard"); // Navigate to dashboard after successful payment
        },

        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      setError(err.message || "Payment failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow">
        <Link to="/booking" className="text-blue-600">← Back</Link>

        <h1 className="text-2xl font-bold mt-4 mb-4">Payment</h1>

        <div className="space-y-2 text-sm">
          {/* Display details from bookingDetails */}
          <p><b>Order ID:</b> {bookingDetails.orderId}</p>
          <p><b>Amount:</b> ₹{bookingDetails.amount}</p>
          {bookingDetails.origin && <p><b>From:</b> {bookingDetails.origin}</p>}
          {bookingDetails.destination && <p><b>To:</b> {bookingDetails.destination}</p>}
          {bookingDetails.service && <p><b>Service:</b> {bookingDetails.service}</p>}
        </div>

        {error && <p className="mt-4 text-red-600">{error}</p>}

        <button
          onClick={handlePayment}
          disabled={loading || !razorpayReady}
          className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg disabled:opacity-50"
        >
          {loading ? "Processing..." : "Pay Now"}
        </button>
      </div>
    </div>
  );
}
