import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export function BookingPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const quoteData = location.state?.quoteData;

  const [formData, setFormData] = useState({
    service: "delivery",
    origin: quoteData?.pickup || "",
    destination: quoteData?.drop || "",
    weight: "",
    moveDate: quoteData?.moveDate || "",
    name: quoteData?.name || "",
    phone: quoteData?.phone || "",
    email: "",
  });

  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showBookButton, setShowBookButton] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculatePrice = () => {
    const { origin, destination, weight } = formData;

    if (!origin || !destination || !weight) {
      alert("Please fill origin, destination and weight");
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

      const estimatedPrice = Math.round(
        (basePrice + distanceCharge + weightCharge) *
          (serviceMultiplier[formData.service] || 1),
      );

      setPrice(estimatedPrice);
      setShowBookButton(true);
      setLoading(false);
    }, 1000);
  };

  const bookNow = () => {
    const bookingData = {
      ...formData,
      price,
    };

    const token = localStorage.getItem("token");

    localStorage.setItem("currentBooking", JSON.stringify(bookingData));

    if (!token) {
      navigate("/login", {
        state: {
          redirectTo: "/payment",
        },
      });
      return;
    }

    navigate("/payment");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Back */}
        <Link to="/" className="text-blue-600 hover:underline">
          ← Back to Home
        </Link>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mt-6">
          <h1 className="text-3xl font-bold mb-2">Get a Quote</h1>
          <p className="text-gray-600 mb-6">
            Review or complete the details to get your final price
          </p>

          <div className="space-y-6">
            {/* Service */}
            <div>
              <label className="block mb-2 font-medium">Service Type</label>
              <select
                name="service"
                value={formData.service}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg"
              >
                <option value="delivery">Home Moving</option>
                <option value="packaging">Packing Only</option>
                <option value="freight">Freight</option>
                <option value="warehousing">Warehousing</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Locations */}
            <div className="grid md:grid-cols-2 gap-6">
              <input
                name="origin"
                value={formData.origin}
                onChange={handleInputChange}
                placeholder="Pickup Location"
                className="p-3 border rounded-lg"
              />
              <input
                name="destination"
                value={formData.destination}
                onChange={handleInputChange}
                placeholder="Drop Location"
                className="p-3 border rounded-lg"
              />
            </div>

            {/* Shipment */}
            <div className="grid md:grid-cols-3 gap-6">
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                placeholder="Weight (kg)"
                className="p-3 border rounded-lg"
              />

              <input
                type="date"
                name="moveDate"
                value={formData.moveDate}
                onChange={handleInputChange}
                className="p-3 border rounded-lg"
              />

              <input
                type="text"
                placeholder="Optional Dimensions"
                className="p-3 border rounded-lg"
              />
            </div>

            {/* Contact */}
            <div className="grid md:grid-cols-3 gap-6">
              <input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Full Name"
                className="p-3 border rounded-lg"
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email"
                className="p-3 border rounded-lg"
              />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Phone"
                className="p-3 border rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Price */}
        {price && (
          <div className="bg-blue-50 mt-6 p-5 rounded-lg flex justify-between">
            <span className="font-medium">Estimated Price</span>
            <span className="text-2xl font-bold text-blue-600">
              ₹{price.toLocaleString("en-IN")}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 mt-6">
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
              className="flex-1 bg-green-600 text-white py-3 rounded-lg"
            >
              Book Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
