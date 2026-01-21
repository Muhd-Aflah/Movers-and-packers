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

  const handleSubmit = (e) => {
    e.preventDefault();

    onClose();

    navigate("/booking", {
      state: {
        quoteData: {
          name: form.name,
          phone: form.phone,
          pickup: form.pickup,
          drop: form.drop,
          moveDate: form.moveDate,
        },
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <h2 className="text-2xl font-bold text-white mb-2">
            Get Your Free Moving Quote
          </h2>
          <p className="text-blue-100 text-sm">
            Quick details — final confirmation on next step
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <input
            name="name"
            required
            onChange={handleChange}
            placeholder="Full Name"
            className="w-full px-4 py-3 border rounded-lg"
          />

          <input
            name="phone"
            required
            onChange={handleChange}
            placeholder="Phone Number"
            className="w-full px-4 py-3 border rounded-lg"
          />

          <input
            name="pickup"
            required
            onChange={handleChange}
            placeholder="Pickup Address"
            className="w-full px-4 py-3 border rounded-lg"
          />

          <input
            name="drop"
            required
            onChange={handleChange}
            placeholder="Delivery Address"
            className="w-full px-4 py-3 border rounded-lg"
          />

          <input
            type="date"
            name="moveDate"
            required
            onChange={handleChange}
            className="w-full px-4 py-3 border rounded-lg"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700"
          >
            Continue to Booking
          </button>

          <p className="text-center text-xs text-gray-500">
            No payment required at this step
          </p>
        </form>
      </div>
    </div>
  );
};
