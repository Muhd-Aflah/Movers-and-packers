import { Link } from "react-router-dom";

export function FreightPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <Link to="/services" className="text-blue-600 hover:text-blue-700 mb-8 inline-flex items-center">
          ← Back to Services
        </Link>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Global Freight Services</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl">
          Search and compare the best shipping rates among dozens of trusted logistic partners for last mile delivery and freight.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-8 rounded-lg shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Our Freight Solutions</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-semibold">✈</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Air Freight</h3>
                  <p className="text-gray-600">Fast and reliable air cargo solutions for time-sensitive shipments worldwide.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold">🚢</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Ocean Freight</h3>
                  <p className="text-gray-600">Cost-effective sea freight solutions for large volume international shipping.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-semibold">🚚</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Ground Transportation</h3>
                  <p className="text-gray-600">Comprehensive trucking and rail services for domestic and cross-border shipping.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-600 font-semibold">📦</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Last Mile Delivery</h3>
                  <p className="text-gray-600">Efficient final delivery solutions to ensure packages reach their destination.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-lg shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Freight Management Features</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <p className="text-gray-700">Real-time tracking and visibility</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <p className="text-gray-700">Multi-carrier rate comparison</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <p className="text-gray-700">Customs clearance assistance</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <p className="text-gray-700">Insurance and cargo protection</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Get a Quote</h2>
          <p className="text-gray-600 mb-6">Compare rates from multiple carriers and find best shipping solution for your needs.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700">
              Get Freight Quote
            </button>
            <button className="flex-1 bg-gray-100 text-gray-900 py-3 px-6 rounded-lg hover:bg-gray-200">
              Track Shipment
            </button>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-gray-900 mb-3">Freight Hotline</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>📞 1-800-FREIGHT</p>
              <p>✉️ swiftmove@online.com</p>
              <p>🕐 24/7 Support</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
