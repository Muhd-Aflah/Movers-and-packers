import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function BookingField({ id, label, error, hint, required = true, children }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id} className="text-sm text-slate-800 dark:text-slate-100">{label}{required && <> <span aria-hidden="true" className="text-red-600">*</span></>}</Label>
      {children || <Input id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} />}
      {hint && !error && <p id={`${id}-hint`} className="text-xs leading-5 text-slate-500 dark:text-slate-400">{hint}</p>}
      {error && <p id={`${id}-error`} className="text-sm leading-5 text-red-700 dark:text-red-300" role="alert">{error}</p>}
    </div>
  );
}
