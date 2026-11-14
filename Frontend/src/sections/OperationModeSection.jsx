import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";

export const OperationModeSection = () => {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [errors, setErrors] = useState({});
  const originRef = useRef(null);
  const destinationRef = useRef(null);

  const openBooking = (event) => {
    event.preventDefault();
    const nextErrors = {
      origin: origin.trim() ? "" : "Enter a pickup location.",
      destination: destination.trim() ? "" : "Enter a delivery location.",
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      (nextErrors.origin ? originRef : destinationRef).current?.focus();
      return;
    }
    navigate("/booking", { state: { origin: origin.trim(), destination: destination.trim() } });
  };

  return (
    <section className="flex w-full justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-6xl rounded-2xl bg-white p-4 shadow-md sm:p-6 lg:p-8">
        {Object.values(errors).some(Boolean) && <p role="alert" aria-live="assertive" className="mb-3 text-sm text-red-700">Please enter both locations to continue.</p>}
        <form onSubmit={openBooking} noValidate className="flex flex-col items-stretch gap-4 lg:flex-row lg:gap-6">
          <div className="flex w-full flex-col">
            <Label htmlFor="public-pickup" className="mb-1 text-sm text-gray-600">Pickup</Label>
            <input ref={originRef} id="public-pickup" name="pickup" value={origin} onChange={(event) => { setOrigin(event.target.value); setErrors((current) => ({ ...current, origin: "" })); }} aria-invalid={Boolean(errors.origin)} aria-describedby={errors.origin ? "public-pickup-error" : undefined} required placeholder="Enter pickup address" className="h-12 w-full rounded-lg border px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" />
            {errors.origin && <p id="public-pickup-error" className="mt-1 text-sm text-red-700">{errors.origin}</p>}
          </div>
          <div className="flex w-full flex-col">
            <Label htmlFor="public-destination" className="mb-1 text-sm text-gray-600">Delivery</Label>
            <input ref={destinationRef} id="public-destination" name="destination" value={destination} onChange={(event) => { setDestination(event.target.value); setErrors((current) => ({ ...current, destination: "" })); }} aria-invalid={Boolean(errors.destination)} aria-describedby={errors.destination ? "public-destination-error" : undefined} required placeholder="Enter delivery address" className="h-12 w-full rounded-lg border px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" />
            {errors.destination && <p id="public-destination-error" className="mt-1 text-sm text-red-700">{errors.destination}</p>}
          </div>
          <div className="flex w-full items-end lg:w-auto">
            <Button type="submit" className="h-12 w-full rounded-lg bg-simblue font-bold text-white hover:bg-simblue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 lg:w-[200px]">
              Continue to booking
            </Button>
          </div>
        </form>
        <p className="mt-3 text-sm text-gray-600">We’ll calculate your estimate in the booking wizard after you choose a service and vehicle.</p>
      </div>
    </section>
  );
};
