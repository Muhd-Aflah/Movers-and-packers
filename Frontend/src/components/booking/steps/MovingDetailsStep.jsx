import { Building2, Home } from "lucide-react";
import { BookingField } from "../BookingField";
import { Input } from "../../ui/input";
import { PROPERTY_TYPES, getIndiaToday } from "../bookingContract";

export function MovingDetailsStep({ draft, update, errors }) {
  const chooseMoveType = (moveType) => update({
    moveType,
    propertyType: "",
    approximateSize: { value: "", unit: moveType === "home_move" ? "bhk" : "sq_ft" },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Move type <span aria-hidden="true" className="text-red-600">*</span></p>
        <div role="radiogroup" aria-label="Move type" aria-describedby={errors.moveType ? "moveType-error" : undefined} className="grid gap-3 sm:grid-cols-2">
          {[["home_move", "Home move", "House, apartment or flat", Home], ["office_move", "Office move", "Office, shop or commercial space", Building2]].map(([value, label, description, Icon]) => {
            const active = draft.moveType === value;
            return (
              <button key={value} type="button" role="radio" aria-checked={active} onClick={() => chooseMoveType(value)} className={`flex min-h-20 items-center gap-3 rounded-card border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${active ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600 dark:border-blue-400 dark:bg-blue-950 dark:ring-blue-400" : "border-slate-200 bg-white hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-500"}`}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"><Icon aria-hidden="true" className="h-5 w-5" /></span>
                <span><span className="block font-bold">{label}</span><span className="mt-0.5 block text-xs leading-5 text-slate-600 dark:text-slate-300">{description}</span></span>
              </button>
            );
          })}
        </div>
        {errors.moveType && <p id="moveType-error" role="alert" className="mt-1 text-sm text-red-700 dark:text-red-300">{errors.moveType}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <BookingField id="propertyType" label="Property type" error={errors.propertyType}>
          <select id="propertyType" value={draft.propertyType} onChange={(event) => update({ propertyType: event.target.value })} aria-invalid={Boolean(errors.propertyType)} aria-describedby={errors.propertyType ? "propertyType-error" : undefined} className="h-11 w-full rounded-control border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            <option value="">Select a property type</option>
            {(PROPERTY_TYPES[draft.moveType] || []).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </BookingField>

        <BookingField id="approximateSize" label={draft.moveType === "home_move" ? "Approximate move size (BHK)" : "Approximate area (sq ft)"} error={errors.approximateSize} hint={draft.moveType === "home_move" ? "Enter the number of bedrooms; for example, 2 for 2 BHK." : "Enter the approximate floor area in square feet."}>
          <div className="relative">
            <Input id="approximateSize" type="number" min="1" step={draft.moveType === "home_move" ? "1" : "any"} inputMode="decimal" value={draft.approximateSize.value} onChange={(event) => update({ approximateSize: { value: event.target.value, unit: draft.moveType === "home_move" ? "bhk" : "sq_ft" } })} aria-invalid={Boolean(errors.approximateSize)} aria-describedby={errors.approximateSize ? "approximateSize-error" : "approximateSize-hint"} className="pr-16" />
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-500">{draft.moveType === "home_move" ? "BHK" : "sq ft"}</span>
          </div>
        </BookingField>
      </div>

      <BookingField id="moveDate" label="Preferred move date" error={errors.moveDate} hint="Choose today or a future date. Dates are checked using India time.">
        <Input id="moveDate" type="date" min={getIndiaToday()} value={draft.moveDate} onChange={(event) => update({ moveDate: event.target.value })} aria-invalid={Boolean(errors.moveDate)} aria-describedby={errors.moveDate ? "moveDate-error" : "moveDate-hint"} />
      </BookingField>
    </div>
  );
}
