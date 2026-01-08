import { useState } from "react";
import { Link } from "react-router-dom";

export function BookingPage() {
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    weight: "",
    service: "warehousing"
  });
  
  const [price, setPrice] = useState(null);
  const [showBookButton, setShowBookButton] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculatePrice = () => {
    if (!formData.origin || !formData.destination || !formData.weight) {
      alert("Please fill in origin, destination, and weight fields");
      return;
    }

    setLoading(true);
    
    // Simulate price calculation in Rupees
    setTimeout(() => {
      const basePrice = 2500; // Base price in Rupees (₹2500)
      const distance = Math.abs(formData.destination.length - formData.origin.length) * 50; // Distance charge in Rupees
      const weightPrice = parseFloat(formData.weight) * 20; // Weight charge in Rupees per kg
      const serviceMultiplier = {
        "warehousing": 1.5,
        "freight": 2.0,
        "packaging": 1.2,
        "delivery": 1.8,
        "custom": 2.5
      };
      
      const calculatedPrice = (basePrice + distance + weightPrice) * (serviceMultiplier[formData.service] || 1);
      setPrice((calculatedPrice / 100).toFixed(2)); // Convert to display format (₹250.00)
      setShowBookButton(true);
      setLoading(false);
    }, 1500);
  };

  const bookNow = () => {
    // Save booking data to localStorage for payment page
    const bookingData = {
      service: formData.service.charAt(0).toUpperCase() + formData.service.slice(1),
      origin: formData.origin,
      destination: formData.destination,
      weight: `${formData.weight} kg`,
      price: `₹${price}`
    };
    
    localStorage.setItem('currentBooking', JSON.stringify(bookingData));
    
    // Navigate to payment page
    window.location.href = "/payment";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <Link to="/" className="text-blue-600 hover:text-blue-700 inline-flex items-center">
            ← Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Get a Quote</h1>
          <p className="text-gray-600 mb-8">Fill in the details below to get an instant price estimate</p>

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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="From where?"
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="To where?"
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dimensions (L×W×H cm)
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100×50×50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Date
                </label>
                <input
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1234567890"
                  />
                </div>
              </div>
            </div>

            {/* Price Display */}
            {price && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Estimated Price</h3>
                    <p className="text-sm text-gray-600">Based on your shipment details</p>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    ₹{price}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button 
                onClick={calculatePrice}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? "Calculating..." : "Check Price"}
              </button>
              
              {showBookButton && (
                <button 
                  onClick={bookNow}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 font-medium animate-pulse"
                >
                  Book Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
