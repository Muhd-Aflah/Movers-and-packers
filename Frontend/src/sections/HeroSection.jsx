import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { QuoteModal } from "./QuoteModal";

export const HeroSection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const quoteTriggerRef = useRef(null);

  useEffect(() => {
    setIsQuoteOpen(false);
  }, [location.pathname]);

  return (
    <>
      <section className="w-full py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* LEFT */}
            <div className="flex flex-col gap-6 max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Quick • Reliable • Insured
              </p>

              <h1 className="text-4xl font-extrabold leading-tight text-foreground sm:text-5xl">
                Safe, Insured &{" "}
                <span className="text-blue-600 dark:text-blue-400">On-Time Moving</span>
                <br />
                Every Step of the Way.
              </h1>

              <p className="text-muted-foreground">
                Professional home and office moving services with expert packing,
                secure transportation, and guaranteed on-time delivery.
              </p>

              <div className="flex gap-4">
                <button
                  ref={quoteTriggerRef}
                  type="button"
                  onClick={() => setIsQuoteOpen(true)}
                  className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-haspopup="dialog"
                  aria-expanded={isQuoteOpen}
                  aria-controls="public-quote-dialog"
                >
                  Get a Free Quote
                </button>

                <button
                  onClick={() => navigate("/signup")}
                  className="rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  Join Now
                </button>
              </div>

              <p className="text-sm text-muted-foreground">
                No hidden charges • 100% insured • On-time guarantee
              </p>
            </div>

            {/* RIGHT */}
            <div className="w-full flex justify-center lg:justify-end">
              <img
                src="/swiftmove-hero-transparent.png"
                alt="Courier carrying a delivery beside a route map"
                className="h-auto w-full max-w-md object-contain lg:max-w-2xl dark:lg:bg-transparent"
              />
            </div>
          </div>
        </div>
      </section>

      <QuoteModal
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
        returnFocusRef={quoteTriggerRef}
      />
    </>
  );
};
