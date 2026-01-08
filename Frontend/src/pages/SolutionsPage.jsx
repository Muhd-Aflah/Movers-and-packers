import { Link } from "react-router-dom";

export function SolutionsPage() {
  const solutions = [
    {
      id: "ecommerce",
      title: "E-commerce Solutions",
      description: "Complete fulfillment solutions for online businesses, from inventory management to last-mile delivery.",
      features: ["Real-time inventory sync", "Automated order processing", "Multi-carrier shipping", "Returns management"]
    },
    {
      id: "enterprise",
      title: "Enterprise Solutions",
      description: "Scalable logistics solutions designed for large-scale operations and complex supply chains.",
      features: ["Custom integration", "Advanced analytics", "Dedicated support", "Global network"]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Solutions</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Tailored logistics solutions designed to meet the unique needs of your business
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {solutions.map((solution) => (
            <Link
              key={solution.id}
              to={`/solutions/${solution.id}`}
              className="group bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 block border border-gray-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors">
                  <div className="text-blue-600 font-bold text-xl">
                    {solution.title.charAt(0)}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {solution.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {solution.description}
                </p>
                <div className="text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                  Explore Solution →
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Our Solutions Work</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Customizable</h3>
              <p className="text-gray-600">
                Every business is unique. Our solutions are tailored to your specific requirements and scale with your growth.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Integrated</h3>
              <p className="text-gray-600">
                Seamlessly connect with your existing systems through our comprehensive API and integration capabilities.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Scalable</h3>
              <p className="text-gray-600">
                From startup to enterprise, our infrastructure grows with your business without compromising performance.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Reliable</h3>
              <p className="text-gray-600">
                99.9% uptime guarantee with redundant systems and 24/7 monitoring to ensure your operations never stop.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
