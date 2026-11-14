import { Users } from "lucide-react";
import { BookingField } from "../BookingField";
import { Input } from "../../ui/input";
import { WORKER_FIELDS } from "../bookingContract";

export function LabourStep({ draft, update, errors }) {
  if (draft.serviceMode !== "full_service") return <div className="rounded-card border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800"><div className="flex gap-3"><Users aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" /><div><h3 className="font-semibold">Crew details are not needed for transport only</h3><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">Worker quantities will not be sent as active pricing inputs for this service.</p></div></div></div>;

  return (
    <div className="space-y-5">
      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Choose the crew size for each part of your full-service move. Each count must be between 1 and 100.</p>
      <div className="grid gap-5 sm:grid-cols-2">
        {WORKER_FIELDS.map(([key, label]) => <BookingField key={key} id={key} label={label} error={errors[key]}>
          <Input id={key} type="number" min="1" max="100" step="1" inputMode="numeric" value={draft[key]} onChange={(event) => update({ [key]: event.target.value })} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `${key}-error` : `${key}-hint`} />
        </BookingField>)}
      </div>
      <p className="rounded-control bg-slate-50 p-3 text-xs leading-5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">Crew rates are calculated by the server. Changing these counts refreshes the quote on the Review step.</p>
    </div>
  );
}
