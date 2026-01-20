import { Link } from "react-router-dom";

export function PackagingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <Link to="/services" className="text-blue-600 hover:text-blue-700 mb-8 inline-flex items-center">
          ← Back to Services
        </Link>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Packaging Solutions</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl">
          Our packaging solutions are optimized for each individual customer and are selected based on customer's specific needs and requirements.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-8 rounded-lg shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Custom Packaging Services</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-semibold">📦</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Protective Packaging</h3>
                  <p className="text-gray-600">Custom-designed packaging solutions to protect your products during transit and storage.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-semibold">🌱</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Eco-Friendly Options</h3>
                  <p className="text-gray-600">Sustainable packaging materials that reduce environmental impact while maintaining product safety.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold">📊</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Bulk Packaging</h3>
                  <p className="text-gray-600">Cost-effective bulk packaging solutions for large volume shipments and storage.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-600 font-semibold">⚡</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Specialized Packaging</h3>
                  <p className="text-gray-600">Industry-specific packaging for fragile, hazardous, or temperature-sensitive items.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-lg shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Packaging Process</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <p className="text-gray-700">Product analysis and assessment</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <p className="text-gray-700">Custom packaging design</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <p className="text-gray-700">Quality testing and validation</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <p className="text-gray-700">Optimized space utilization</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Consultation</h2>
          <p className="text-gray-600 mb-6">Get expert advice on best packaging solutions for your specific products and requirements.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700">
              Schedule Consultation
            </button>
            <button className="flex-1 bg-gray-100 text-gray-900 py-3 px-6 rounded-lg hover:bg-gray-200">
              Request Samples
            </button>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-gray-900 mb-3">Packaging Experts</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>📞 1-800-PACKAGING</p>
              <p>✉️ swiftmove@online.com</p>
              <p>🕐 Mon-Fri: 8AM-7PM EST</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
