import { MapPin } from "lucide-react";
import { BookingField } from "../BookingField";
import { Input } from "../../ui/input";

export function AddressesStep({ draft, update, errors }) {
  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Add the pickup and delivery locations. Include the area and city so the route can be quoted accurately.</p>
      <BookingField id="pickup" label="Pickup address" error={errors.pickup} hint={`${draft.pickup.length}/300 characters`}>
        <div className="relative"><MapPin aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input id="pickup" autoComplete="street-address" maxLength={300} value={draft.pickup} onChange={(event) => update({ pickup: event.target.value })} placeholder="Street, area, city" aria-invalid={Boolean(errors.pickup)} aria-describedby={errors.pickup ? "pickup-error" : "pickup-hint"} className="pl-10" /></div>
      </BookingField>
      <BookingField id="dropoff" label="Delivery address" error={errors.dropoff} hint={`${draft.dropoff.length}/300 characters`}>
        <div className="relative"><MapPin aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input id="dropoff" autoComplete="shipping street-address" maxLength={300} value={draft.dropoff} onChange={(event) => update({ dropoff: event.target.value })} placeholder="Street, area, city" aria-invalid={Boolean(errors.dropoff)} aria-describedby={errors.dropoff ? "dropoff-error" : "dropoff-hint"} className="pl-10" /></div>
      </BookingField>
      <p className="rounded-control bg-slate-50 p-3 text-xs leading-5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">The quote uses the road route between these addresses. Saved-address selection is not available yet.</p>
    </div>
  );
}
