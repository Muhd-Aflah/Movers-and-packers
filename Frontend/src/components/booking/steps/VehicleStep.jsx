import { Truck } from "lucide-react";
import { VEHICLES } from "../bookingContract";

export function VehicleStep({ draft, update, errors }) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Select a vehicle size for the move. The quote uses the rates configured for this vehicle.</p>
      <div role="radiogroup" aria-label="Vehicle type" aria-describedby={errors.vehicleType ? "vehicleType-error" : undefined} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {VEHICLES.map(([value, label, detail]) => {
          const active = draft.vehicleType === value;
          return <button key={value} type="button" role="radio" aria-checked={active} onClick={() => update({ vehicleType: value })} className={`min-h-32 rounded-card border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${active ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600 dark:border-blue-400 dark:bg-blue-950 dark:ring-blue-400" : "border-slate-200 bg-white hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-500"}`}>
            <span className="flex items-center justify-between gap-3"><span className="grid h-10 w-10 place-items-center rounded-control bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"><Truck aria-hidden="true" className="h-5 w-5" /></span><span aria-hidden="true" className={`grid h-5 w-5 place-items-center rounded-full border ${active ? "border-blue-600 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-400 dark:text-slate-950" : "border-slate-300 dark:border-slate-600"}`}>{active ? <span className="h-2 w-2 rounded-full bg-current" /> : null}</span></span>
            <span className="mt-3 block font-bold">{label}</span><span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-300">{detail}</span>
          </button>;
        })}
      </div>
      {errors.vehicleType && <p id="vehicleType-error" role="alert" className="text-sm text-red-700 dark:text-red-300">{errors.vehicleType}</p>}
    </div>
  );
}
