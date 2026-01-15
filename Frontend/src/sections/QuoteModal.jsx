import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, User, Phone, MapPin, Calendar } from "lucide-react";

export const QuoteModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    pickup: "",
    drop: "",
    moveDate: "",
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/quotes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      if (res.ok) {
        onClose();
        navigate("/dashboard");
      } else {
        console.error("Quote submission failed");
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 scale-100 animate-slideUp">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="pt-4">
            <h2 className="text-2xl font-bold text-white mb-2">
              Get Your Free Moving Quote
            </h2>
            <p className="text-blue-100 text-sm">
              Fill in your details below and receive your personalized quote in minutes!
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User className="w-4 h-4" />
              Your Full Name
            </label>
            <input
              name="name"
              required
              onChange={handleChange}
              placeholder="Full Name "
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Phone className="w-4 h-4" />
              Phone Number
            </label>
            <input
              name="phone"
              required
              onChange={handleChange}
              placeholder="(+91) 123554567"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <MapPin className="w-4 h-4" />
              Pickup Address
            </label>
            <input
              name="pickup"
              required
              onChange={handleChange}
              placeholder="Current home address"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <MapPin className="w-4 h-4" />
              Delivery Address
            </label>
            <input
              name="drop"
              required
              onChange={handleChange}
              placeholder="New home address"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Calendar className="w-4 h-4" />
              Moving Date
            </label>
            <input
              type="date"
              name="moveDate"
              required
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
          >
            Get My Free Quote Now
          </button>

          <p className="text-center text-xs text-gray-500 mt-4">
            By submitting, you agree to receive a personalized quote. No obligation.
          </p>
        </form>
      </div>
    </div>
  );
};