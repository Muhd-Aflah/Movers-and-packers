import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getMove } from "../services/booking.service";
import { createOrder, verifyPayment } from "../services/payment.service";

const currency = (amount, code) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: code }).format(amount);

export function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const moveId = searchParams.get("moveId");
  const [move, setMove] = useState(null);
  const [loading, setLoading] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(Boolean(window.Razorpay));
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!moveId) {
      navigate("/booking", { replace: true });
      return () => { active = false; };
    }

    getMove(moveId)
      .then((data) => {
        if (!active) return;
        setMove(data);
        if (data.pricingStatus !== "priced" || !data.pricing?.currency) {
          setError("This move does not have a server-calculated price.");
        }
      })
      .catch((requestError) => active && setError(requestError.message || "Could not load this move"));

    if (!window.Razorpay) {
      const existing = document.getElementById("razorpay-checkout");
      if (existing) {
        existing.addEventListener("load", () => active && setRazorpayReady(true), { once: true });
        existing.addEventListener("error", () => active && setError("Payment gateway failed to load"), { once: true });
      } else {
        const script = document.createElement("script");
        script.id = "razorpay-checkout";
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => active && setRazorpayReady(true);
        script.onerror = () => active && setError("Payment gateway failed to load");
        document.body.appendChild(script);
      }
    }

    return () => { active = false; };
  }, [moveId, navigate]);

  const handlePayment = async () => {
    if (!move || !razorpayReady || loading || move.paid) return;
    setLoading(true);
    setError("");

    try {
      const order = await createOrder(move._id);
      const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!key || !order.order_id || !Number.isSafeInteger(order.amount) || !order.currency) {
        throw new Error("Payment order details are incomplete");
      }

      const checkout = new window.Razorpay({
        key,
        order_id: order.order_id,
        amount: order.amount,
        currency: order.currency,
        name: "SwiftMove",
        description: "Move booking payment",
        prefill: {
          name: move.user?.name || "",
          email: move.user?.email || "",
          contact: move.user?.phone || "",
        },
        handler: async (result) => {
          try {
            await verifyPayment(result);
            localStorage.removeItem("pendingBooking");
            navigate("/dashboard", { replace: true });
          } catch (verificationError) {
            setError(verificationError.message || "Payment verification failed. Do not retry until payment status is checked.");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      checkout.on("payment.failed", () => {
        setError("Payment failed or was not captured. You can try again.");
        setLoading(false);
      });
      checkout.open();
    } catch (requestError) {
      setError(requestError.message || "Could not start payment");
      setLoading(false);
    }
  };

  if (!move && !error) return <div className="p-8">Loading move...</div>;

  const breakdown = move?.pricing?.breakdown;
  const breakdownLabels = {
    baseBookingCharge: "Base booking charge",
    distanceCharge: "Road distance charge",
    serviceCharge: "Service charge",
    loadingCharge: "Loading",
    unloadingCharge: "Unloading",
    minimumAdjustment: "Minimum charge adjustment",
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-xl rounded-xl bg-white p-6 shadow">
        <Link to="/booking" className="text-blue-600">← Back to booking</Link>
        <h1 className="mb-4 mt-4 text-2xl font-bold">Payment</h1>
        {move && (
          <>
            <div className="space-y-2 text-sm">
              <p><b>From:</b> {move.pickup?.address}</p>
              <p><b>To:</b> {move.dropoff?.address}</p>
              <p><b>Service:</b> {move.service}</p>
              <p><b>Road distance:</b> {move.pricing?.distanceKm?.toLocaleString()} km</p>
            </div>
            {breakdown && (
              <dl className="mt-5 space-y-2 border-t pt-4">
                <div className="mb-3 text-xs text-gray-600">
                  Rate: {currency(breakdown.pricePerKilometre, move.pricing.currency)} per km ·
                  Minimum booking charge: {currency(breakdown.minimumBookingCharge, move.pricing.currency)}
                </div>
                {Object.entries(breakdownLabels).map(([field, label]) => (
                  <div key={field} className="flex justify-between gap-4 text-sm">
                    <dt>{label}</dt>
                    <dd>{currency(breakdown[field] || 0, move.pricing.currency)}</dd>
                  </div>
                ))}
                <div className="flex justify-between border-t pt-3 text-lg font-bold">
                  <dt>Total</dt>
                  <dd>{currency(move.price, move.pricing.currency)}</dd>
                </div>
              </dl>
            )}
            {move.paid && <p className="mt-4 text-green-700">This move is already paid.</p>}
          </>
        )}

        {error && <p role="alert" className="mt-4 text-red-600">{error}</p>}
        <button
          onClick={handlePayment}
          disabled={loading || !razorpayReady || !move || move.paid || move.pricingStatus !== "priced"}
          className="mt-6 w-full rounded-lg bg-green-600 py-3 text-white disabled:opacity-50"
        >
          {loading ? "Processing..." : !razorpayReady ? "Loading payment gateway..." : "Pay Now"}
        </button>
      </div>
    </div>
  );
}
