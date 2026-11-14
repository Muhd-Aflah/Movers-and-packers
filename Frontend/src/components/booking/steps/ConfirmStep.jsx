import { CalendarDays, MapPin, Package, Users } from "lucide-react";
import { formatQuoteMoney } from "../bookingContract";

const MOVE_LABEL = { home_move: "Home move", office_move: "Office move" };
const PROPERTY_LABEL = { house: "Independent house", apartment_flat: "Apartment / flat", office: "Office", shop_commercial: "Shop / commercial space" };
const SERVICE_LABEL = { full_service: "Full service", transport_only: "Transport only" };
const VEHICLE_LABEL = {
  three_wheeler_eeco: "3-Wheeler / Eeco", tata_ace: "Tata Ace", pickup_bolero: "Pickup / Bolero",
  tata_407_14ft: "Tata 407 · 14 ft", truck_17ft: "17-ft Truck", truck_20_32ft: "20–32-ft Truck",
};

const SummaryRow = ({ icon: Icon, label, children }) => <div className="flex gap-3 py-3"><Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" /><dt className="w-32 shrink-0 text-sm text-slate-500 dark:text-slate-400">{label}</dt><dd className="min-w-0 break-words text-sm font-semibold text-slate-900 dark:text-slate-100">{children}</dd></div>;

export function ConfirmStep({ draft, quote, quoteReady, authenticated }) {
  const size = draft.moveType === "home_move" ? `${draft.approximateSize.value} BHK` : `${Number(draft.approximateSize.value).toLocaleString("en-IN")} sq ft`;
  const inventoryCount = Object.values(draft.inventory).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const quoteTotal = quote?.pricingAvailable ? formatQuoteMoney(quote.total, quote.currency) : null;

  return (
    <div className="space-y-5">
      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Check the details below before submitting. A booking request does not create a payment order.</p>
      <section aria-labelledby="confirmation-details" className="rounded-card border border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900 sm:px-5">
        <h3 id="confirmation-details" className="sr-only">Booking details</h3>
        <dl className="divide-y divide-slate-200 dark:divide-slate-700">
          <SummaryRow icon={CalendarDays} label="Move">{MOVE_LABEL[draft.moveType]} · {PROPERTY_LABEL[draft.propertyType]} · {size} · {draft.moveDate}</SummaryRow>
          <SummaryRow icon={MapPin} label="Pickup">{draft.pickup}</SummaryRow>
          <SummaryRow icon={MapPin} label="Delivery">{draft.dropoff}</SummaryRow>
          <SummaryRow icon={Package} label="Service">{SERVICE_LABEL[draft.serviceMode]} · {VEHICLE_LABEL[draft.vehicleType]}</SummaryRow>
          {draft.serviceMode === "full_service" && <>
            <SummaryRow icon={Package} label="Inventory">{inventoryCount} total items across selected categories</SummaryRow>
            <SummaryRow icon={Users} label="Crew">Packing {draft.packingWorkers} · Loading {draft.loadingWorkers} · Unloading {draft.unloadingWorkers}</SummaryRow>
          </>}
        </dl>
      </section>

      <section aria-live="polite" className={`rounded-card border p-4 ${quote?.manualEstimateRequired ? "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100" : "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100"}`}>
        {quote?.manualEstimateRequired
          ? <><h3 className="font-semibold">Admin estimate required</h3><p className="mt-1 text-sm leading-6">Submitting creates a request for admin review. No final price or payment is available until you review and accept the estimate.</p></>
          : <><h3 className="font-semibold">{quoteReady ? "Current server quote" : "A fresh server quote is required"}</h3><p className="mt-1 text-sm leading-6">{quoteReady ? quoteTotal : "Return to Review to refresh pricing before confirming."}</p></>}
      </section>
      {!authenticated && <p className="rounded-control bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:bg-slate-800 dark:text-slate-200">You can review a quote as a guest. Sign in or create a customer account to submit this booking.</p>}
    </div>
  );
}
