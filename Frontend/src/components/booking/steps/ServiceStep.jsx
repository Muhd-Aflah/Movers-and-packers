import { PackageCheck, Truck } from "lucide-react";

const OPTIONS = [
  { value: "full_service", label: "Full service", detail: "Packing, loading, transport and unloading. Add inventory, materials and crew details in the next steps.", Icon: PackageCheck },
  { value: "transport_only", label: "Transport only", detail: "Vehicle and road transport for items that are packed and ready to move.", Icon: Truck },
];

export function ServiceStep({ draft, update, errors }) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Choose the service you need. This selection is separate from whether the move is a home move or office move.</p>
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Service mode" aria-describedby={errors.serviceMode ? "serviceMode-error" : undefined}>
        {OPTIONS.map(({ value, label, detail, Icon }) => {
          const active = draft.serviceMode === value;
          return <button key={value} type="button" role="radio" aria-checked={active} onClick={() => update({ serviceMode: value })} className={`min-h-40 rounded-card border p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${active ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600 dark:border-blue-400 dark:bg-blue-950 dark:ring-blue-400" : "border-slate-200 bg-white hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-500"}`}>
            <span className="grid h-11 w-11 place-items-center rounded-control bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"><Icon aria-hidden="true" className="h-5 w-5" /></span>
            <span className="mt-4 block font-bold">{label}</span>
            <span className="mt-1 block text-sm leading-5 text-slate-600 dark:text-slate-300">{detail}</span>
          </button>;
        })}
      </div>
      {errors.serviceMode && <p id="serviceMode-error" role="alert" className="text-sm text-red-700 dark:text-red-300">{errors.serviceMode}</p>}
    </div>
  );
}
