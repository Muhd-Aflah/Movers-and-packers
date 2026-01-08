import { Link } from "react-router-dom";

export function EnterprisePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <Link to="/solutions" className="text-blue-600 hover:text-blue-700 mb-8 inline-flex items-center">
          ← Back to Solutions
        </Link>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Enterprise Solutions</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl">
          Scalable logistics solutions designed for large-scale operations and complex supply chains.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-8 rounded-lg shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Enterprise Capabilities</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 font-semibold">🔧</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Custom Integration</h3>
                  <p className="text-gray-600">Tailored solutions that integrate seamlessly with your existing enterprise systems.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-semibold">📊</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Advanced Analytics</h3>
                  <p className="text-gray-600">Comprehensive data insights and reporting to optimize your supply chain performance.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-semibold">👥</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Dedicated Support</h3>
                  <p className="text-gray-600">24/7 enterprise-grade support with dedicated account managers and technical experts.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold">🌍</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Global Network</h3>
                  <p className="text-gray-600">Worldwide logistics network with local expertise in over 100 countries.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-lg shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Enterprise Services</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                <p className="text-gray-700">Supply chain consulting</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                <p className="text-gray-700">Custom software development</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                <p className="text-gray-700">Global compliance management</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                <p className="text-gray-700">Performance optimization</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Enterprise Sales</h2>
          <p className="text-gray-600 mb-6">Connect with our enterprise solutions team to discuss your large-scale logistics requirements.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700">
              Contact Sales
            </button>
            <button className="flex-1 bg-gray-100 text-gray-900 py-3 px-6 rounded-lg hover:bg-gray-200">
              Schedule Demo
            </button>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-gray-900 mb-3">Enterprise Team</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>📞 1-800-ENTERPRISE</p>
              <p>✉️ enterprise@swiftmove.com</p>
              <p>🕐 Dedicated Account Manager</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
