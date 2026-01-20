import { Link } from "react-router-dom";

export function WarehousingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">

        {/* Back link */}
        <Link
          to="/services"
          className="text-blue-600 hover:text-blue-700 mb-8 inline-block"
        >
          ← Back to Services
        </Link>

        {/* Header */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Warehousing Services
        </h1>

        <p className="text-lg text-gray-600 mb-10 max-w-3xl">
          Flexible, pay-as-you-go warehousing for storage, inventory management,
          and fast order fulfillment.
        </p>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">

          {/* Features */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Our Warehousing Features
            </h2>

            <ul className="space-y-4">
              <li>
                <h3 className="font-semibold text-gray-900">Pallet Storage</h3>
                <p className="text-gray-600 text-sm">
                  Flexible pallet storage with live inventory tracking.
                </p>
              </li>

              <li>
                <h3 className="font-semibold text-gray-900">Secure Facilities</h3>
                <p className="text-gray-600 text-sm">
                  24/7 CCTV, access control, and climate-safe warehouses.
                </p>
              </li>

              <li>
                <h3 className="font-semibold text-gray-900">Quick Fulfillment</h3>
                <p className="text-gray-600 text-sm">
                  Same-day dispatch for orders placed before noon.
                </p>
              </li>

              <li>
                <h3 className="font-semibold text-gray-900">Scalable Storage</h3>
                <p className="text-gray-600 text-sm">
                  Increase or decrease space as your business grows.
                </p>
              </li>
            </ul>
          </div>

          {/* Technology */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Technology Integration
            </h2>

            <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
              <li>Real-time inventory dashboard</li>
              <li>Barcode & RFID tracking</li>
              <li>E-commerce platform integration</li>
              <li>Automated reports</li>
            </ul>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Get Started
          </h2>

          <p className="text-gray-600 mb-6">
            Want a simple warehousing solution? Get in touch with us.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/contact"
              className="flex-1 text-center bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
            >
              Request Quote
            </Link>

            <Link
              to="/contact"
              className="flex-1 text-center bg-gray-100 text-gray-900 py-3 rounded-lg hover:bg-gray-200"
            >
              Schedule Tour
            </Link>
          </div>

          {/* Contact Info */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-gray-900 mb-3">
              Contact Information
            </h3>

            <p className="text-sm text-gray-600">📞 1-800-WAREHOUSE</p>
            <p className="text-sm text-gray-600">✉️  swiftmove@online.com</p>
            <p className="text-sm text-gray-600">🕐 Mon–Fri, 9AM–6PM</p>
          </div>
        </div>

      </div>
    </div>
  );
}
