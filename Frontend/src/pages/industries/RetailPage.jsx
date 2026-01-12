import { Link } from "react-router-dom";

export function RetailPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <Link to="/industries" className="text-blue-600 hover:text-blue-700 mb-8 inline-flex items-center">
          ← Back to Industries
        </Link>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Retail Solutions</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl">
          Comprehensive logistics solutions for retail businesses, from inventory management to customer delivery.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-8 rounded-lg shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Retail Challenges We Solve</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-600 font-semibold">📈</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Seasonal Demand Fluctuations</h3>
                  <p className="text-gray-600">Flexible storage and fulfillment solutions that scale with seasonal peaks and valleys.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold">📦</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Inventory Optimization</h3>
                  <p className="text-gray-600">Smart inventory management to reduce stockouts and overstock situations.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-semibold">🚚</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Last-Mile Delivery</h3>
                  <p className="text-gray-600">Efficient delivery solutions to meet customer expectations for fast shipping.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-semibold">↩️</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Returns Processing</h3>
                  <p className="text-gray-600">Streamlined reverse logistics to handle customer returns efficiently.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-lg shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Retail-Specific Services</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                <p className="text-gray-700">Omnichannel fulfillment</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                <p className="text-gray-700">Store replenishment</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                <p className="text-gray-700">Click and collect solutions</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                <p className="text-gray-700">Same-day delivery</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Retail Logistics</h2>
          <p className="text-gray-600 mb-6">Transform your retail operations with our specialized logistics solutions designed for modern retail environment.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="flex-1 bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700">
              Get Retail Solution
            </button>
            <button className="flex-1 bg-gray-100 text-gray-900 py-3 px-6 rounded-lg hover:bg-gray-200">
              Case Studies
            </button>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-gray-900 mb-3">Retail Specialists</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>📞 1-800-RETAIL</p>
              <p>✉️ swiftmove@online.com</p>
              <p>🕐 Mon-Sat: 8AM-8PM EST</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
