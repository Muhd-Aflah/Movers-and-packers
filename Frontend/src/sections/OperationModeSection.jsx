import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";

export const OperationModeSection = () => {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [weight, setWeight] = useState("");
  const [error, setError] = useState("");

  const openBooking = () => {
    if (!origin.trim() || !destination.trim() || !Number.isFinite(Number(weight)) || Number(weight) <= 0) {
      setError("Enter pickup, delivery, and a positive weight to continue.");
      return;
    }
    navigate("/booking", { state: { origin, destination, weight } });
  };

  return (
    <section className="flex w-full justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-6xl rounded-2xl bg-white p-4 shadow-md sm:p-6 lg:p-8">
        <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:gap-6">
          <div className="flex w-full flex-col">
            <Label className="mb-1 text-sm text-gray-600">Pickup</Label>
            <input value={origin} onChange={(event) => setOrigin(event.target.value)} placeholder="Enter pickup address" className="h-12 w-full rounded-lg border px-4" />
          </div>
          <div className="flex w-full flex-col">
            <Label className="mb-1 text-sm text-gray-600">Delivery</Label>
            <input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Enter delivery address" className="h-12 w-full rounded-lg border px-4" />
          </div>
          <div className="flex w-full flex-col">
            <Label className="mb-1 text-sm text-gray-600">Weight (kg)</Label>
            <input type="number" min="0.001" step="any" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="Weight" className="h-12 w-full rounded-lg border px-4" />
          </div>
          <div className="flex w-full items-end lg:w-auto">
            <Button onClick={openBooking} className="h-12 w-full rounded-lg bg-simblue font-bold text-white hover:bg-simblue/90 lg:w-[200px]">
              Get Road-Distance Quote
            </Button>
          </div>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </section>
  );
};
