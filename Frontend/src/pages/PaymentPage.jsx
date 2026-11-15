import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { acceptMovePricing, getMove } from "../services/booking.service";
import { createOrder, verifyPayment } from "../services/payment.service";
import { formatMoveDate } from "../utils/moveDate";
import { createPaymentOrderGuard, requestPaymentOrder } from "../utils/paymentCheckout";

const currency = (amount, code) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: code }).format(amount);

export function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const moveId = searchParams.get("moveId");
  const [move, setMove] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(Boolean(window.Razorpay));
  const [error, setError] = useState("");
  const paymentOrderGuard = useRef(null);
  if (!paymentOrderGuard.current) paymentOrderGuard.current = createPaymentOrderGuard();

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
        if (!["manual_review", "pending_acceptance"].includes(data.pricingStatus) &&
          (data.pricingStatus !== "priced" || !data.pricing?.currency)) {
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
      const order = await requestPaymentOrder(
        paymentOrderGuard.current,
        () => createOrder(move._id),
        move,
      );
      if (!order) return;

      const checkout = new window.Razorpay({
        key: order.key,
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
            paymentOrderGuard.current.release();
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            paymentOrderGuard.current.release();
            setLoading(false);
          },
        },
      });

      checkout.on("payment.failed", () => {
        setError("Payment failed or was not captured. You can try again.");
        paymentOrderGuard.current.release();
        setLoading(false);
      });
      checkout.open();
    } catch (requestError) {
      setError(requestError.message || "Could not start payment");
      paymentOrderGuard.current.release();
      setLoading(false);
    }
  };

  const handleAcceptEstimate = async () => {
    if (!move || accepting || move.pricingStatus !== "pending_acceptance") return;
    setAccepting(true);
    setError("");
    try {
      const acceptedMove = await acceptMovePricing(move._id);
      setMove(acceptedMove);
    } catch (requestError) {
      setError(requestError.message || "Could not accept this estimate");
    } finally {
      setAccepting(false);
    }
  };

  if (!move && !error) return <div className="p-8">Loading move...</div>;

  const breakdown = move?.pricing?.breakdown;
  const breakdownLabels = [
    ["transport", "Transport"], ["packingMaterials", "Packing materials"], ["packingLabour", "Packing labour"],
    ["loading", "Loading"], ["unloading", "Unloading"], ["additionalCharges", "Additional approved charges"], ["tolls", "Tolls (excluded; actual tolls may be added)"], ["tax", "Tax"],
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-xl rounded-xl bg-white p-6 shadow">
        <Link to="/booking" className="text-blue-600">← Back to booking</Link>
        <h1 className="mb-4 mt-4 text-2xl font-bold">Payment</h1>
        {move && (
          <>
            {move.pricingStatus === "manual_review" && <p className="mb-4 rounded bg-amber-50 p-3 text-sm text-amber-900">Your full-service move is awaiting an administrator packing estimate. Payment is unavailable until an estimate is prepared and accepted.</p>}
            <div className="space-y-2 text-sm">
              <p><b>From:</b> {move.pickup?.address}</p>
              <p><b>To:</b> {move.dropoff?.address}</p>
              <p><b>Move date:</b> {formatMoveDate(move.moveDate)}</p>
              <p><b>Service:</b> {move.serviceMode === "full_service" ? "Full-Service" : "Transport-Only"}</p>
              <p><b>Vehicle:</b> {move.vehicleType?.replaceAll("_", " ")}</p>
              <p><b>Road distance:</b> {move.pricing?.distanceKm?.toLocaleString()} km</p>
            </div>
            {move.pricingStatus === "pending_acceptance" && <p className="mb-4 mt-4 rounded bg-blue-50 p-3 text-sm text-blue-900">Review the administrator’s itemized estimate below. Accept this estimate before payment.</p>}
            {breakdown && (
              <dl className="mt-5 space-y-2 border-t pt-4">
                <div className="mb-3 text-xs text-gray-600">
                  Rate: {currency(move.pricing.vehicle?.perKmRate, move.pricing.currency)} per km ·
                  Minimum transport fare: {currency(move.pricing.vehicle?.minimumFare, move.pricing.currency)}
                </div>
                {breakdownLabels.map(([field, label]) => (
                  <div key={field} className="flex justify-between gap-4 text-sm">
                    <dt>{label}{field === "tax" ? ` (${breakdown.taxStatus})` : ""}</dt>
                    <dd>{currency(breakdown[field] || 0, move.pricing.currency)}</dd>
                  </div>
                ))}
                <div className="flex justify-between border-t pt-3 text-lg font-bold">
                  <dt>Total</dt>
                  <dd>{currency(move.price, move.pricing.currency)}</dd>
                </div>
              </dl>
            )}
            {breakdown && <p className="mt-3 text-xs text-gray-600">Tax is {breakdown.taxIncluded ? "included" : "excluded"}. Tolls are excluded; actual tolls may be added when known.</p>}
            {move.pricing?.estimateType === "admin_manual" && (
              <div className="mt-4 space-y-3 border-t pt-4 text-sm">
                <section><h2 className="font-semibold">Packing material estimate</h2><dl className="mt-2 space-y-1">{move.pricing.materials.map((line, index) => <div key={`${line.description}-${index}`} className="flex justify-between gap-3"><dt>{line.description} ({line.quantity} {line.unit} × {currency(line.unitRate, move.pricing.currency)})</dt><dd>{currency(line.amount, move.pricing.currency)}</dd></div>)}</dl></section>
                <section><h2 className="font-semibold">Labour estimate</h2><dl className="mt-2 space-y-1">{["packing", "loading", "unloading"].map((key) => <div key={key} className="flex justify-between gap-3"><dt className="capitalize">{key}: {move.pricing.labor[key].workers} worker(s) × {currency(move.pricing.labor[key].ratePerWorker, move.pricing.currency)}</dt><dd>{currency(move.pricing.labor[key].amount, move.pricing.currency)}</dd></div>)}</dl></section>
                {move.pricing.additionalCharges.length > 0 && <section><h2 className="font-semibold">Additional approved charges</h2><dl className="mt-2 space-y-1">{move.pricing.additionalCharges.map((line, index) => <div key={`${line.description}-${index}`} className="flex justify-between gap-3"><dt>{line.description}</dt><dd>{currency(line.amount, move.pricing.currency)}</dd></div>)}</dl></section>}
              </div>
            )}
            {move.paid && <p className="mt-4 text-green-700">This move is already paid.</p>}
          </>
        )}

        {error && <p role="alert" className="mt-4 text-red-600">{error}</p>}
        {move?.pricingStatus === "pending_acceptance" && (
          <button onClick={handleAcceptEstimate} disabled={accepting} className="mt-6 w-full rounded-lg bg-blue-600 py-3 text-white disabled:opacity-50">
            {accepting ? "Saving acceptance..." : `Accept estimate ${currency(move.price, move.pricing.currency)}`}
          </button>
        )}
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
