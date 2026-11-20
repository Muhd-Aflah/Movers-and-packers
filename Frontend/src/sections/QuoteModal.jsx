import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const QuoteModal = ({ isOpen, onClose, returnFocusRef }) => {
  const navigate = useNavigate();
  const dialogRef = useRef(null);
  const pickupRef = useRef(null);
  const dropRef = useRef(null);
  const dateRef = useRef(null);
  const closeRef = useRef(onClose);
  const openerRef = useRef(null);
  const [form, setForm] = useState({ pickup: "", drop: "", moveDate: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    openerRef.current = returnFocusRef?.current || document.activeElement;
    pickupRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current?.();
      } else if (event.key === "Tab") {
        const items = Array.from(dialogRef.current?.querySelectorAll(FOCUSABLE) || [])
          .filter((item) => item.getClientRects().length > 0);
        if (!items.length) {
          event.preventDefault();
          dialogRef.current?.focus();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (openerRef.current?.isConnected) openerRef.current.focus();
    };
  }, [isOpen, returnFocusRef]);

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {
      pickup: form.pickup.trim() ? "" : "Enter a pickup address.",
      drop: form.drop.trim() ? "" : "Enter a delivery address.",
      moveDate: form.moveDate ? "" : "Choose a moving date.",
    };
    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors).find((key) => nextErrors[key]);
    if (firstInvalid) {
      ({ pickup: pickupRef, drop: dropRef, moveDate: dateRef }[firstInvalid]).current?.focus();
      return;
    }

    onClose();
    navigate("/booking", {
      state: { quoteData: { pickup: form.pickup.trim(), drop: form.drop.trim(), moveDate: form.moveDate } },
    });
  };

  const fieldError = (name) => errors[name] ? `${name}-error` : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        id="public-quote-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="public-quote-title"
        aria-describedby="public-quote-description"
        tabIndex={-1}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl"
      >
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quote form"
            className="absolute right-4 top-4 rounded-full bg-white/20 p-1.5 hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X aria-hidden="true" className="h-5 w-5 text-white" />
          </button>
          <h2 id="public-quote-title" className="mb-2 text-2xl font-bold text-white">Get Your Moving Quote</h2>
          <p id="public-quote-description" className="text-sm text-blue-100">
            Add your route and date to continue. Your estimate is calculated in the booking wizard after you choose a service and vehicle.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 p-6">
          {Object.values(errors).some(Boolean) && <p role="alert" aria-live="assertive" className="text-sm text-red-700">Please correct the highlighted fields.</p>}
          <div>
            <label htmlFor="quote-pickup" className="mb-1 block text-sm font-medium text-foreground">Pickup address</label>
            <input ref={pickupRef} id="quote-pickup" name="pickup" value={form.pickup} required aria-invalid={Boolean(errors.pickup)} aria-describedby={fieldError("pickup")} onChange={handleChange} className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            {errors.pickup && <p id="pickup-error" className="mt-1 text-sm text-destructive">{errors.pickup}</p>}
          </div>
          <div>
            <label htmlFor="quote-drop" className="mb-1 block text-sm font-medium text-foreground">Delivery address</label>
            <input ref={dropRef} id="quote-drop" name="drop" value={form.drop} required aria-invalid={Boolean(errors.drop)} aria-describedby={fieldError("drop")} onChange={handleChange} className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            {errors.drop && <p id="drop-error" className="mt-1 text-sm text-destructive">{errors.drop}</p>}
          </div>
          <div>
            <label htmlFor="quote-date" className="mb-1 block text-sm font-medium text-foreground">Moving date</label>
            <input ref={dateRef} id="quote-date" type="date" name="moveDate" value={form.moveDate} required aria-invalid={Boolean(errors.moveDate)} aria-describedby={fieldError("moveDate")} onChange={handleChange} className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            {errors.moveDate && <p id="moveDate-error" className="mt-1 text-sm text-destructive">{errors.moveDate}</p>}
          </div>
          <button type="submit" className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
            Continue to Booking
          </button>
          <p className="text-center text-xs text-muted-foreground">No payment is taken at this step.</p>
        </form>
      </div>
    </div>
  );
};
