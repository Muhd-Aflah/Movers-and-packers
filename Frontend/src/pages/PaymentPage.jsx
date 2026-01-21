import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createOrder, verifyPayment } from "../services/payment.service";

export function PaymentPage() {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load booking + Razorpay
  useEffect(() => {
    const saved = localStorage.getItem("currentBooking");
    if (!saved) {
      navigate("/booking");
      return;
    }
    setBookingData(JSON.parse(saved));

    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => console.log("Razorpay loaded");
      document.body.appendChild(script);
    }
  }, [navigate]);

  if (!bookingData) return null;

  const handlePayment = async () => {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const order = await createOrder(bookingData.price);

      const razorpay = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "SwiftMove",
        description: "Move Booking Payment",
        order_id: order.id,

        prefill: {
          name: bookingData.name,
          email: bookingData.email,
          contact: bookingData.phone,
        },

        handler: async (response) => {
          await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            bookingData,
          });

          localStorage.removeItem("currentBooking");
          navigate("/dashboard");
        },
      });

      razorpay.open();
    } catch (err) {
      setError(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow">
        <Link to="/booking" className="text-blue-600">← Back</Link>

        <h1 className="text-2xl font-bold mt-4 mb-4">Payment</h1>

        <div className="space-y-2 text-sm">
          <p><b>From:</b> {bookingData.origin}</p>
          <p><b>To:</b> {bookingData.destination}</p>
          <p><b>Service:</b> {bookingData.service}</p>
          <p className="text-lg font-bold">
            Amount: ₹{bookingData.price}
          </p>
        </div>

        {error && <p className="mt-4 text-red-600">{error}</p>}

        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg"
        >
          {loading ? "Processing..." : "Pay Now"}
        </button>
      </div>
    </div>
  );
}
