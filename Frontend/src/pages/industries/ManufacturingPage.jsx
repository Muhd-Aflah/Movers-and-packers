import { Link } from "react-router-dom";
import { PublicContactDetails } from "../../components/PublicContactDetails";

export function ManufacturingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <Link to="/industries" className="text-blue-600 hover:text-blue-700 mb-8 inline-flex items-center">
          ← Back to Industries
        </Link>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Manufacturing Logistics</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl">
          End-to-end supply chain solutions for manufacturing operations and distribution networks.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-8 rounded-lg shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Manufacturing Challenges We Solve</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-600 font-semibold">🏭</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Raw Material Sourcing</h3>
                  <p className="text-gray-600">Reliable procurement and transportation of raw materials to keep production running smoothly.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold">⏰</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Production Scheduling</h3>
                  <p className="text-gray-600">Just-in-time delivery systems to optimize production schedules and minimize inventory costs.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-semibold">🚚</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Distribution Efficiency</h3>
                  <p className="text-gray-600">Optimized distribution networks to get finished products to market quickly and cost-effectively.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-semibold">⚡</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Just-in-Time Delivery</h3>
                  <p className="text-gray-600">Precision timing systems to deliver components exactly when needed for production.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-lg shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Manufacturing Services</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                <p className="text-gray-700">Vendor-managed inventory</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                <p className="text-gray-700">Cross-docking solutions</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                <p className="text-gray-700">Production logistics</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                <p className="text-gray-700">Finished goods distribution</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Manufacturing Solutions</h2>
          <p className="text-gray-600 mb-6">Optimize your manufacturing supply chain with our industry-specific logistics expertise and technology.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/booking" className="flex-1 rounded-lg bg-gray-600 px-6 py-3 text-center text-white hover:bg-gray-700">
              Start a Move Quote
            </Link>
            <p className="flex-1 rounded-lg bg-gray-100 px-6 py-3 text-sm text-gray-700" role="note">
              Manufacturing assessments are not available online yet.
            </p>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-gray-900 mb-3">Manufacturing Experts</h3>
            <PublicContactDetails className="text-sm text-gray-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
