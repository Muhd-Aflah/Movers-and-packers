import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export function BookingPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    weight: "",
    service: "warehousing",
  });

  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showBookButton, setShowBookButton] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculatePrice = () => {
    const { origin, destination, weight, service } = formData;

    if (!origin || !destination || !weight) {
      alert("Please fill origin, destination, and weight");
      return;
    }

    setLoading(true);
    setShowBookButton(false);

    setTimeout(() => {
      const basePrice = 1500;
      const fakeDistanceKm = Math.abs(origin.length - destination.length) + 10;

      const distanceCharge = fakeDistanceKm * 60;
      const weightCharge = Number(weight) * 25;

      const serviceMultiplier = {
        warehousing: 1.4,
        freight: 2.0,
        packaging: 1.2,
        delivery: 1.6,
        custom: 1.8,
      };

      const multiplier = serviceMultiplier[service] || 1;

      const estimatedPrice = Math.round(
        (basePrice + distanceCharge + weightCharge) * multiplier
      );

      setPrice(estimatedPrice);
      setShowBookButton(true);
      setLoading(false);
    }, 1200);
  };

  const bookNow = () => {
    const bookingData = {
      ...formData,
      price,
    };

    localStorage.setItem("currentBooking", JSON.stringify(bookingData));
    navigate("/payment");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Back link */}
        <div className="mb-8">
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-700 inline-flex items-center"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Get a Quote</h1>
          <p className="text-gray-600 mb-8">
            Fill in the details below to get an instant price estimate
          </p>

          <div className="space-y-6">
            {/* Service Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Type
              </label>
              <select
                name="service"
                value={formData.service}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="warehousing">Warehousing</option>
                <option value="freight">Freight Shipping</option>
                <option value="packaging">Packaging Services</option>
                <option value="delivery">Last Mile Delivery</option>
                <option value="custom">Custom Logistics</option>
              </select>
            </div>

            {/* Shipment Details */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Origin City *
                </label>
                <input
                  type="text"
                  name="origin"
                  value={formData.origin}
                  onChange={handleInputChange}
                  placeholder="From where?"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination City *
                </label>
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  placeholder="To where?"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg) *
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dimensions (L × W × H cm)
                </label>
                <input
                  type="text"
                  placeholder="100 × 50 × 50"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Date
                </label>
                <input
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

              <div className="grid md:grid-cols-3 gap-6">
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="email"
                  placeholder="mail@example.com"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  placeholder="+91 23456 78900"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          {/* Price */}
          {price !== null && (
            <div className="bg-blue-50 p-5 rounded-lg mb-6 flex justify-between">
              <span className="font-semibold">Estimated Price</span>
              <span className="text-2xl font-bold text-blue-600">
                ₹{price.toLocaleString("en-IN")}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={calculatePrice}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg"
            >
              {loading ? "Calculating…" : "Check Price"}
            </button>

            {showBookButton && (
              <button
                onClick={bookNow}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg animate-pulse"
              >
                Book Now
              </button>
            )}
          </div>
        </div>
      </div>
  
  );
}
