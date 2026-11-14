import { Check } from "lucide-react";
import { BOOKING_STEPS } from "./bookingContract";

export function BookingWizardProgress({ currentStep }) {
  return (
    <nav aria-label="Booking progress" className="overflow-hidden rounded-card border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
      <ol className="grid grid-cols-4 gap-x-2 gap-y-4 md:grid-cols-8 md:gap-1">
        {BOOKING_STEPS.map((label, index) => {
          const complete = index < currentStep;
          const current = index === currentStep;
          return (
            <li key={label} aria-current={current ? "step" : undefined} className="flex min-w-0 flex-col items-center gap-2 text-center">
              <span className={`grid h-9 w-9 place-items-center rounded-full border text-sm font-bold ${complete ? "border-blue-600 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-400 dark:text-slate-950" : current ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-100 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-200 dark:ring-blue-900" : "border-slate-300 bg-white text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400"}`}>
                {complete ? <Check aria-hidden="true" className="h-4 w-4" /> : index + 1}
              </span>
              <span className={`text-[11px] leading-tight sm:text-xs ${current ? "font-bold text-slate-900 dark:text-white" : complete ? "font-medium text-blue-700 dark:text-blue-300" : "text-slate-500 dark:text-slate-400"}`}>
                {label}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="sr-only" aria-live="polite">Step {currentStep + 1} of {BOOKING_STEPS.length}: {BOOKING_STEPS[currentStep]}</p>
    </nav>
  );
}
