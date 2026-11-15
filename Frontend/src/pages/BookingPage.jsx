import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ErrorState } from "../components/ui/StatePanel";
import { BookingWizardLayout } from "../components/booking/BookingWizardLayout";
import { AddressesStep } from "../components/booking/steps/AddressesStep";
import { ConfirmStep } from "../components/booking/steps/ConfirmStep";
import { InventoryStep } from "../components/booking/steps/InventoryStep";
import { LabourStep } from "../components/booking/steps/LabourStep";
import { MovingDetailsStep } from "../components/booking/steps/MovingDetailsStep";
import { ReviewStep } from "../components/booking/steps/ReviewStep";
import { ServiceStep } from "../components/booking/steps/ServiceStep";
import { VehicleStep } from "../components/booking/steps/VehicleStep";
import { createMove } from "../services/booking.service";
import { getPriceQuote } from "../services/pricing.service";
import { getAuthFromStorage } from "../utils/auth";
import { classifyQuoteResponse } from "../components/booking/quoteFeedback";
import {
  BOOKING_STEPS,
  clearBookingDraft,
  getCreateMovePayload,
  getPricingPayload,
  loadBookingDraft,
  saveBookingDraft,
  saveLegacyPendingBooking,
  validateBookingDraft,
  validateStep,
} from "../components/booking/bookingContract";

export function BookingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [initialDraft] = useState(() => loadBookingDraft(location.state));
  const [draft, setDraft] = useState(initialDraft.data);
  const [step, setStep] = useState(initialDraft.step);
  const [errors, setErrors] = useState({});
  const [quoteState, setQuoteState] = useState({ status: "idle", fingerprint: "", data: null, error: "" });
  const [apiError, setApiError] = useState("");
  const [creatingMove, setCreatingMove] = useState(false);
  const [retryQuote, setRetryQuote] = useState(0);
  const requestSequence = useRef(0);
  const submissionLock = useRef(false);
  const pricingPayload = useMemo(() => getPricingPayload(draft), [draft]);
  const pricingFingerprint = JSON.stringify(pricingPayload);
  const authenticated = Boolean(getAuthFromStorage().token);
  const quoteIsCurrent = quoteState.status === "success" && quoteState.fingerprint === pricingFingerprint &&
    classifyQuoteResponse(quoteState.data) !== "invalid";
  const currentQuoteState = quoteState.fingerprint === pricingFingerprint
    ? quoteState
    : { status: "loading", fingerprint: pricingFingerprint, data: null, error: "" };
  const quote = quoteIsCurrent ? quoteState.data : null;

  useEffect(() => {
    saveBookingDraft(draft, step);
  }, [draft, step]);

  useEffect(() => {
    if (step !== 6) return undefined;
    const sequence = ++requestSequence.current;
    setQuoteState({ status: "loading", fingerprint: pricingFingerprint, data: null, error: "" });
    getPriceQuote(pricingPayload)
      .then((data) => {
        if (requestSequence.current !== sequence) return;
        setQuoteState({ status: "success", fingerprint: pricingFingerprint, data, error: "" });
      })
      .catch((error) => {
        if (requestSequence.current !== sequence) return;
        setQuoteState({
          status: "error",
          fingerprint: pricingFingerprint,
          data: null,
          error: {
            message: error.message || "Could not calculate a price.",
            code: error.code,
            status: error.status,
            details: error.details,
          },
        });
      });
    return () => {
      if (requestSequence.current === sequence) requestSequence.current += 1;
    };
  }, [step, pricingFingerprint, retryQuote]);

  const updateDraft = (changes) => {
    setDraft((current) => ({ ...current, ...changes }));
    setErrors({});
    setApiError("");
  };

  const goBack = () => {
    if (step <= 0 || creatingMove) return;
    setErrors({});
    setApiError("");
    if (step === 7) setQuoteState({ status: "idle", fingerprint: "", data: null, error: "" });
    setStep((current) => Math.max(0, current - 1));
  };

  const submitBooking = async () => {
    if (creatingMove || submissionLock.current) return;
    const allErrors = validateBookingDraft(draft);
    if (Object.keys(allErrors).length) {
      setErrors(allErrors);
      const firstInvalidStep = BOOKING_STEPS.findIndex((_, index) => Object.keys(validateStep(index, draft)).length > 0);
      setStep(Math.max(0, firstInvalidStep));
      return;
    }
    if (!quoteIsCurrent || !quote) {
      setStep(6);
      setApiError("Please review a fresh server quote before confirming your booking.");
      return;
    }

    if (!authenticated) {
      // Preserve the existing pendingBooking shape for older return paths while
      // the versioned same-tab draft carries the wizard step and expiry.
      saveBookingDraft(draft, 6);
      saveLegacyPendingBooking(draft);
      navigate("/login", { state: { redirectTo: "/booking?resume=1" } });
      return;
    }

    submissionLock.current = true;
    setCreatingMove(true);
    setApiError("");
    try {
      const createdMove = await createMove(getCreateMovePayload(draft));
      if (!createdMove?._id) throw new Error("The booking response did not include a move ID. Check your dashboard before retrying.");
      clearBookingDraft();
      navigate(`/payment?moveId=${encodeURIComponent(createdMove._id)}`);
    } catch (error) {
      setApiError(error.message || "Could not submit this booking. Review the details and try again.");
    } finally {
      submissionLock.current = false;
      setCreatingMove(false);
    }
  };

  const goNext = async () => {
    if (creatingMove) return;
    setApiError("");
    if (step === 7) {
      await submitBooking();
      return;
    }
    const stepErrors = validateStep(step, draft);
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    if (step === 5) setQuoteState({ status: "idle", fingerprint: "", data: null, error: "" });
    setStep((current) => Math.min(7, current + 1));
  };

  const stepContent = [
    <MovingDetailsStep key="moving-details" draft={draft} update={updateDraft} errors={errors} />,
    <AddressesStep key="addresses" draft={draft} update={updateDraft} errors={errors} />,
    <ServiceStep key="service" draft={draft} update={updateDraft} errors={errors} />,
    <VehicleStep key="vehicle" draft={draft} update={updateDraft} errors={errors} />,
    <InventoryStep key="inventory" draft={draft} update={updateDraft} errors={errors} />,
    <LabourStep key="labour" draft={draft} update={updateDraft} errors={errors} />,
    <ReviewStep
      key="review"
      quoteState={currentQuoteState}
      onRetry={() => setRetryQuote((value) => value + 1)}
      onEditAddresses={() => { setApiError(""); setErrors({}); setStep(1); }}
    />,
    <ConfirmStep key="confirm" draft={draft} quote={quote} quoteReady={quoteIsCurrent} authenticated={authenticated} />,
  ][step];

  const nextLabel = step === 7
    ? authenticated ? quote?.manualEstimateRequired ? "Request admin estimate" : "Confirm booking" : "Sign in to submit booking"
    : step === 6 ? "Continue to confirm" : "Next step";

  return (
    <BookingWizardLayout
      step={step}
      draft={draft}
      quote={quote}
      onBack={goBack}
      onNext={goNext}
      backDisabled={step === 0 || creatingMove}
      nextDisabled={step === 6 && !quoteIsCurrent}
      nextLoading={creatingMove || (step === 6 && currentQuoteState.status === "loading")}
      nextLabel={nextLabel}
      exitTo={authenticated ? "/dashboard/user" : "/"}
    >
      {stepContent}
      {apiError && <div className="mt-5"><ErrorState title={creatingMove ? "Submitting booking" : "Booking needs attention"} description={apiError} /></div>}
    </BookingWizardLayout>
  );
}
