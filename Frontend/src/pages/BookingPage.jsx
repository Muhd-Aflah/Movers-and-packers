import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getPriceQuote } from "../services/pricing.service";
import { createMove } from "../services/booking.service";

const readPendingBooking = () => {
  try {
    return JSON.parse(localStorage.getItem("pendingBooking") || "null");
  } catch {
    localStorage.removeItem("pendingBooking");
    return null;
  }
};

const currency = (amount, code) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: code }).format(amount);

export function BookingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state?.quoteData || location.state;
  const initialData = locationState && Object.keys(locationState).length
    ? locationState
    : readPendingBooking() || {};

  const [formData, setFormData] = useState({
    service: initialData.service || "delivery",
    origin: initialData.pickup || initialData.origin || "",
    destination: initialData.dropoff || initialData.drop || initialData.destination || "",
    weight: initialData.weight || "",
    moveDate: initialData.moveDate || "",
    loadingRequired: Boolean(initialData.loadingRequired),
    unloadingRequired: Boolean(initialData.unloadingRequired),
  });
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [creatingMove, setCreatingMove] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setQuote(null);
    setError("");
  };

  const bookingPayload = () => ({
    pickup: formData.origin.trim(),
    dropoff: formData.destination.trim(),
    service: formData.service,
    weight: Number(formData.weight),
    loadingRequired: formData.loadingRequired,
    unloadingRequired: formData.unloadingRequired,
  });

  const validate = () => {
    if (
      !formData.origin.trim() ||
      !formData.destination.trim() ||
      !formData.moveDate ||
      !Number.isFinite(Number(formData.weight)) ||
      Number(formData.weight) <= 0
    ) {
      setError("Enter pickup, delivery, move date, and a positive weight.");
      return false;
    }
    return true;
  };

  const calculatePrice = async () => {
    if (!validate() || loadingQuote) return;
    setLoadingQuote(true);
    setError("");
    setQuote(null);
    try {
      const result = await getPriceQuote(bookingPayload());
      if (!result.pricingAvailable || !result.breakdown) {
        throw new Error("Pricing is unavailable. No price was generated.");
      }
      setQuote(result);
    } catch (requestError) {
      setError(requestError.message || "Could not calculate a price");
    } finally {
      setLoadingQuote(false);
    }
  };

  const bookNow = async () => {
    if (!quote || creatingMove) return;
    if (!localStorage.getItem("token")) {
      localStorage.setItem("pendingBooking", JSON.stringify(formData));
      navigate("/login", { state: { redirectTo: "/booking?resume=1" } });
      return;
    }

    setCreatingMove(true);
    setError("");
    try {
      const move = await createMove({ ...bookingPayload(), moveDate: formData.moveDate });
      localStorage.removeItem("pendingBooking");
      navigate(`/payment?moveId=${encodeURIComponent(move._id)}`);
    } catch (requestError) {
      setError(requestError.message || "Could not create this move");
    } finally {
      setCreatingMove(false);
    }
  };

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
      <div className="mx-auto max-w-4xl px-6">
        <Link to="/" className="text-blue-600 hover:underline">← Back to Home</Link>

        <div className="mt-6 rounded-xl bg-white p-8 shadow-lg">
          <h1 className="mb-2 text-3xl font-bold">Get a Quote</h1>
          <p className="mb-6 text-gray-600">Enter your move details for a road-distance quote.</p>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block font-medium" htmlFor="service">Service Type</label>
              <select id="service" name="service" value={formData.service} onChange={handleInputChange} className="w-full rounded-lg border p-3">
                <option value="delivery">Home Moving</option>
                <option value="packaging">Packing Only</option>
                <option value="freight">Freight</option>
                <option value="warehousing">Warehousing</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="block font-medium">Pickup address
                <input name="origin" value={formData.origin} onChange={handleInputChange} autoComplete="street-address" placeholder="Street address, city, country" className="mt-2 w-full rounded-lg border p-3 font-normal" />
              </label>
              <label className="block font-medium">Delivery address
                <input name="destination" value={formData.destination} onChange={handleInputChange} placeholder="Street address, city, country" className="mt-2 w-full rounded-lg border p-3 font-normal" />
              </label>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="block font-medium">Weight (kg)
                <input type="number" min="0.001" step="any" name="weight" value={formData.weight} onChange={handleInputChange} placeholder="Weight" className="mt-2 w-full rounded-lg border p-3 font-normal" />
              </label>
              <label className="block font-medium">Move date
                <input type="date" name="moveDate" value={formData.moveDate} onChange={handleInputChange} className="mt-2 w-full rounded-lg border p-3 font-normal" />
              </label>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="loadingRequired" checked={formData.loadingRequired} onChange={handleInputChange} />
                Loading required
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="unloadingRequired" checked={formData.unloadingRequired} onChange={handleInputChange} />
                Unloading required
              </label>
            </div>
          </div>
        </div>

        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}

        {quote && (
          <section className="mt-6 rounded-lg bg-blue-50 p-5" aria-live="polite">
            <div className="mb-3 flex flex-wrap justify-between gap-2">
              <h2 className="font-semibold">Backend price breakdown</h2>
              <span>{quote.distanceKm.toLocaleString()} km road distance</span>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              {quote.pickupResolved} → {quote.dropoffResolved}
            </p>
            <p className="mb-3 text-sm text-gray-700">
              Rate: {currency(quote.breakdown.pricePerKilometre, quote.currency)} per km ·
              Minimum booking charge: {currency(quote.breakdown.minimumBookingCharge, quote.currency)}
            </p>
            <dl className="space-y-2">
              {Object.entries(breakdownLabels).map(([key, label]) => (
                <div key={key} className="flex justify-between gap-4 text-sm">
                  <dt>{label}</dt>
                  <dd>{currency(quote.breakdown[key], quote.currency)}</dd>
                </div>
              ))}
              <div className="flex justify-between border-t border-blue-200 pt-3 text-lg font-bold">
                <dt>Total</dt>
                <dd>{currency(quote.total, quote.currency)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-gray-600">The final booking is priced again on the server before payment.</p>
          </section>
        )}

        <div className="mt-6 flex flex-col gap-4 sm:flex-row">
          <button onClick={calculatePrice} disabled={loadingQuote || creatingMove} className="flex-1 rounded-lg bg-blue-600 py-3 text-white disabled:opacity-50">
            {loadingQuote ? "Calculating route and price..." : "Check Price"}
          </button>
          {quote && (
            <button onClick={bookNow} disabled={creatingMove || loadingQuote} className="flex-1 rounded-lg bg-green-600 py-3 text-white disabled:opacity-50">
              {creatingMove ? "Creating move..." : "Book Now"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
