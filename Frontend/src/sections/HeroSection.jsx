import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { QuoteModal } from "./QuoteModal";
const navigate = useNavigate();

export const HeroSection = () => {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);

  return (
    <>
      <section className="w-full py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* LEFT CONTENT */}
            <div className="flex flex-col gap-6 max-w-xl">
              <p className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
                Quick • Reliable • Insured
              </p>

              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
                Safe, Insured &{" "}
                <span className="text-blue-500">On-Time Moving</span>
                <br />
                Every Step of the Way.
              </h1>

              <p className="text-gray-600 text-base leading-relaxed">
                Professional home and office moving services with expert
                packing, secure transportation, and guaranteed on-time delivery.
                Your belongings are handled with care — from pickup to drop-off.
              </p>

              {/* CTA BUTTONS */}
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setIsQuoteOpen(true)}
                  className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                >
                  Get a Free Quote
                </button>

                <button
                  onClick={() => navigate("/signup")}
                  className="px-6 py-3 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 transition"
                >
                  Join Now
                </button>
              </div>
              {/* TRUST LINE */}
              <p className="text-sm text-gray-500">
                No hidden charges • 100% insured • On-time guarantee
              </p>
            </div>

            {/* RIGHT IMAGE */}
            <div className="w-full flex justify-center lg:justify-end">
              <img
                src="/91fa59e6781adbdced82e349bb595d99-1.png"
                alt="Moving & logistics illustration"
                className="w-full max-w-md lg:max-w-2xl h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* QUOTE MODAL */}
      <QuoteModal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} />
    </>
  );
};
