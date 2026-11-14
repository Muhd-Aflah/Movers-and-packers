import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { BookingSummary } from "./BookingSummary";
import { BookingWizardProgress } from "./BookingWizardProgress";
import { BOOKING_STEPS } from "./bookingContract";

export function BookingWizardLayout({
  step,
  draft,
  quote,
  children,
  onBack,
  onNext,
  backDisabled = false,
  nextDisabled = false,
  nextLabel = "Next step",
  nextLoading = false,
  exitTo = "/",
}) {
  const titleRef = useRef(null);
  useEffect(() => { titleRef.current?.focus(); }, [step]);

  return (
    <div className="min-h-full bg-sm-background px-4 py-6 font-body text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 sm:py-8 lg:px-8">
      <main className="mx-auto flex max-w-6xl flex-col gap-6" id="booking-wizard-main">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">SwiftMove booking</p>
            <h1 ref={titleRef} tabIndex={-1} className="mt-1 font-display text-3xl font-extrabold tracking-tight focus:outline-none sm:text-4xl">Book a move</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">A simple 8-step process to plan your move. Your progress is saved in this tab for up to 24 hours.</p>
          </div>
          <Link to={exitTo} className="inline-flex min-h-11 items-center rounded-control px-3 text-sm font-semibold text-blue-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-blue-300">
            Save and exit
          </Link>
        </header>

        <BookingWizardProgress currentStep={step} />

        <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(280px,0.9fr)]">
          <Card className="min-w-0 shadow-sm">
            <CardContent className="p-5 sm:p-7 lg:p-8">
              <div className="mb-6 border-b border-slate-200 pb-5 dark:border-slate-700">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">Step {step + 1} of {BOOKING_STEPS.length}</p>
                <h2 className="mt-1 font-display text-2xl font-bold">{BOOKING_STEPS[step]}</h2>
              </div>

              {children}

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
                <Button type="button" variant="outline" onClick={onBack} disabled={backDisabled} className="w-full sm:w-auto">
                  <ArrowLeft aria-hidden="true" /> Back
                </Button>
                <Button type="button" onClick={onNext} disabled={nextDisabled || nextLoading} className="w-full sm:min-w-44 sm:w-auto">
                  {nextLoading ? "Working…" : nextLabel}
                  {!nextLoading && <ArrowRight aria-hidden="true" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          <BookingSummary draft={draft} quote={quote} />
        </div>
      </main>
    </div>
  );
}
