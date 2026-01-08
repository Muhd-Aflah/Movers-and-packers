import { Link } from "react-router-dom";

export function EcommercePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <Link to="/solutions" className="text-blue-600 hover:text-blue-700 mb-8 inline-flex items-center">
          ← Back to Solutions
        </Link>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-6">E-commerce Solutions</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl">
          Complete fulfillment solutions for online businesses, from inventory management to last-mile delivery.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-8 rounded-lg shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">E-commerce Features</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold">🔄</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Real-time Inventory Sync</h3>
                  <p className="text-gray-600">Automatic synchronization with your e-commerce platform to ensure accurate stock levels.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-semibold">⚡</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Automated Order Processing</h3>
                  <p className="text-gray-600">Streamlined order fulfillment from checkout to delivery with minimal human intervention.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-semibold">🚚</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Multi-carrier Shipping</h3>
                  <p className="text-gray-600">Access to multiple shipping carriers to find best rates and delivery options.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-600 font-semibold">↩️</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Returns Management</h3>
                  <p className="text-gray-600">Efficient reverse logistics process to handle customer returns and exchanges.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-lg shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Platform Integrations</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <p className="text-gray-700">Shopify integration</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <p className="text-gray-700">WooCommerce integration</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <p className="text-gray-700">Amazon FBA compatibility</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <p className="text-gray-700">Custom API solutions</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Start Selling</h2>
          <p className="text-gray-600 mb-6">Ready to scale your e-commerce operations? Let us handle the logistics while you focus on growth.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700">
              Get Started
            </button>
            <button className="flex-1 bg-gray-100 text-gray-900 py-3 px-6 rounded-lg hover:bg-gray-200">
              View Pricing
            </button>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-gray-900 mb-3">E-commerce Support</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>📞 1-800-ECOMMERCE</p>
              <p>✉️ ecommerce@swiftmove.com</p>
              <p>🕐 24/7 Support</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
