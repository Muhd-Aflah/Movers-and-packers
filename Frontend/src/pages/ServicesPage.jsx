import { Link } from "react-router-dom";
import { SERVICES } from "../constants";

export function ServicesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive logistics solutions tailored to meet your business needs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {SERVICES.map((service) => (
            <Link
              key={service.id}
              to={`/services/${service.id}`}
              className="group bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 block border border-gray-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors">
                  <img 
                    src={service.icon} 
                    alt={service.title}
                    className="w-8 h-8"
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {service.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {service.description}
                </p>
                <div className="text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                  Learn more →
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Choose Our Services?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Expert Team</h3>
              <p className="text-gray-600">
                Our experienced professionals ensure your logistics operations run smoothly and efficiently.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">24/7 Support</h3>
              <p className="text-gray-600">
                Round-the-clock customer support to address your logistics needs anytime, anywhere.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Advanced Technology</h3>
              <p className="text-gray-600">
                State-of-the-art tracking and management systems for complete visibility of your shipments.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Competitive Pricing</h3>
              <p className="text-gray-600">
                Transparent pricing with no hidden costs, ensuring value for your logistics investment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
