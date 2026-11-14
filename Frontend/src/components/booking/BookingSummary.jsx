import { CalendarDays, MapPin, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { formatQuoteMoney } from "./bookingContract";

const MOVE_LABELS = { home_move: "Home move", office_move: "Office move" };
const SERVICE_LABELS = { full_service: "Full service", transport_only: "Transport only" };

const sizeLabel = (draft) => {
  const value = draft.approximateSize.value;
  if (!value) return "Not selected";
  return draft.moveType === "home_move" ? `${value} BHK` : `${value.toLocaleString()} sq ft`;
};

export function BookingSummary({ draft, quote }) {
  const rows = [
    ["Move type", MOVE_LABELS[draft.moveType] || "Not selected"],
    ["Property type", (draft.propertyType || "").replaceAll("_", " ") || "Not selected"],
    ["Move size", sizeLabel(draft)],
    ["Move date", draft.moveDate || "Not selected"],
    ["Pickup", draft.pickup || "Not added yet"],
    ["Delivery", draft.dropoff || "Not added yet"],
    ["Service", SERVICE_LABELS[draft.serviceMode] || "Not selected"],
    ["Vehicle", draft.vehicleType.replaceAll("_", " ")],
  ];

  return (
    <aside aria-label="Booking summary" className="space-y-4 lg:sticky lg:top-24">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="font-display text-lg">Booking summary</CardTitle></CardHeader>
        <CardContent>
          <dl className="divide-y divide-slate-200 dark:divide-slate-700">
            {rows.map(([label, value], index) => (
              <div key={label} className="flex min-w-0 gap-3 py-3 first:pt-0 last:pb-0">
                {index === 3 ? <CalendarDays aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> : index === 4 || index === 5 ? <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> : index === 7 ? <Truck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> : <span aria-hidden="true" className="w-4 shrink-0" />}
                <dt className="w-24 shrink-0 text-xs text-slate-500 dark:text-slate-400">{label}</dt>
                <dd className="min-w-0 break-words text-right text-sm font-medium capitalize text-slate-900 dark:text-slate-100">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700" aria-live="polite">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Estimate</p>
            {quote?.manualEstimateRequired
              ? <p className="mt-1 text-sm font-semibold text-amber-800 dark:text-amber-300">Admin estimate required</p>
              : quote?.pricingAvailable
                ? <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{formatQuoteMoney(quote.total, quote.currency)}</p>
                : <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Shown after server review</p>}
          </div>
        </CardContent>
      </Card>
      <div className="flex gap-3 rounded-card border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-950 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
        <span aria-hidden="true" className="mt-0.5 shrink-0">ⓘ</span>
        <p>Your details stay editable as you move through the steps. Final pricing comes from SwiftMove’s server.</p>
      </div>
    </aside>
  );
}
