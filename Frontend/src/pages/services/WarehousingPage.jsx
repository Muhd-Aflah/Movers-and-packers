import { Link } from "react-router-dom";

export function WarehousingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <Link to="/services" className="text-blue-600 hover:text-blue-700 mb-8 inline-flex items-center">
          ← Back to Services
        </Link>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Warehousing Services</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl">
          A pay-as-you-go solution for pallet storage, inventory management, fulfillment, and comprehensive logistics solutions.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-8 rounded-lg shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Our Warehousing Features</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Pallet Storage</h3>
                  <p className="text-gray-600">Flexible storage solutions with real-time inventory tracking and management.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Secure Facilities</h3>
                  <p className="text-gray-600">24/7 surveillance and climate-controlled environments for your valuable inventory.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Quick Fulfillment</h3>
                  <p className="text-gray-600">Same-day shipping for orders placed before 12 PM with efficient pick and pack operations.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold">4</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Scalable Solutions</h3>
                  <p className="text-gray-600">Grow your storage needs seamlessly with our flexible warehousing options.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-lg shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Technology Integration</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <p className="text-gray-700">Real-time inventory management system</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <p className="text-gray-700">Barcode scanning and RFID tracking</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <p className="text-gray-700">API integration with major e-commerce platforms</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <p className="text-gray-700">Automated reporting and analytics</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Get Started</h2>
          <p className="text-gray-600 mb-6">Ready to optimize your warehousing operations? Contact us for a personalized solution.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700">
              Request Quote
            </button>
            <button className="flex-1 bg-gray-100 text-gray-900 py-3 px-6 rounded-lg hover:bg-gray-200">
              Schedule Tour
            </button>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>📞 1-800-WAREHOUSE</p>
              <p>✉️ warehouse@swiftmove.com</p>
              <p>🕐 Mon-Fri: 9AM-6PM EST</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
