import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Link } from "react-router-dom";

export const OperationModeSection = () => {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [weight, setWeight] = useState("");
  const [price, setPrice] = useState(null);
  const [showBookButton, setShowBookButton] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e, setter) => {
    setter(e.target.value);
  };

  const calculatePrice = () => {
    if (!origin || !destination || !weight) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);
    setShowBookButton(false);

    setTimeout(() => {
      const basePrice = 1500;

      const fakeDistanceKm =
        Math.abs(origin.length - destination.length) + 10;

      const distanceCharge = fakeDistanceKm * 60;
      const weightCharge = Number(weight) * 25;

      const estimatedPrice = Math.round(
        basePrice + distanceCharge + weightCharge
      );

      setPrice(estimatedPrice);
      setShowBookButton(true);
      setLoading(false);
    }, 1200);
  };


  const handleBookNow = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", {
        state: {
          redirectTo: "/booking",
          bookingData: { origin, destination, weight, price },
        },
      });
      return;
    }

    navigate("/booking", {
      state: { origin, destination, weight, price },
    });
  };

  return (
    <section className="w-full flex justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-md p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch">
          {/* Origin */}
          <div className="flex flex-col w-full">
            <Label className="mb-1 text-sm text-gray-600">Origin</Label>
            <input
              type="text"
              placeholder="Enter location"
              value={origin}
              onChange={(e) => handleInputChange(e, setOrigin)}
              className="w-full h-12 px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-simblue"
            />
          </div>

          {/* Destination */}
          <div className="flex flex-col w-full">
            <Label className="mb-1 text-sm text-gray-600">Destination</Label>
            <input
              type="text"
              placeholder="Enter location"
              value={destination}
              onChange={(e) => handleInputChange(e, setDestination)}
              className="w-full h-12 px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-simblue"
            />
          </div>

          {/* Weight */}
          <div className="flex flex-col w-full">
            <Label className="mb-1 text-sm text-gray-600">Weight (kg)</Label>
            <input
              type="number"
              placeholder="Weight"
              value={weight}
              onChange={(e) => handleInputChange(e, setWeight)}
              className="w-full h-12 px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-simblue"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2 items-end w-full lg:w-auto">
            <Button
              onClick={calculatePrice}
              disabled={loading}
              className="w-full lg:w-[200px] h-12 bg-simblue hover:bg-simblue/90 text-white font-bold rounded-lg"
            >
              {loading ? "Calculating..." : "Check Price"}
            </Button>

            {showBookButton && (
              <Button
                onClick={handleBookNow}
                className="w-full lg:w-[200px] h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg animate-pulse"
              >
                Book Now
              </Button>
            )}
          </div>
        </div>

        {/* Price Display */}
        {price && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Estimated Price
                </h3>
                <p className="text-sm text-gray-600">
                  Based on your shipment details
                </p>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                ₹{price.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
