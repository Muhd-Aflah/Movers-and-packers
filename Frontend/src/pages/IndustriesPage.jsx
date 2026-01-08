import { Link } from "react-router-dom";

export function IndustriesPage() {
  const industries = [
    {
      id: "retail",
      title: "Retail Solutions",
      description: "Comprehensive logistics solutions for retail businesses, from inventory management to customer delivery.",
      challenges: ["Seasonal demand fluctuations", "Inventory optimization", "Last-mile delivery", "Returns processing"]
    },
    {
      id: "manufacturing",
      title: "Manufacturing Logistics",
      description: "End-to-end supply chain solutions for manufacturing operations and distribution networks.",
      challenges: ["Raw material sourcing", "Production scheduling", "Distribution efficiency", "Just-in-time delivery"]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Industries We Serve</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Specialized logistics solutions tailored to the unique challenges of your industry
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {industries.map((industry) => (
            <Link
              key={industry.id}
              to={`/industries/${industry.id}`}
              className="group bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 block border border-gray-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-green-200 transition-colors">
                  <div className="text-green-600 font-bold text-xl">
                    {industry.title.charAt(0)}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {industry.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {industry.description}
                </p>
                <div className="text-green-600 font-medium group-hover:text-green-700 transition-colors">
                  Learn More →
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Industry-Specific Expertise</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Deep Understanding</h3>
              <p className="text-gray-600">
                We understand the unique challenges and requirements of different industries, providing tailored solutions.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Compliance Ready</h3>
              <p className="text-gray-600">
                Our solutions are designed to meet industry-specific regulations and compliance requirements.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Proven Track Record</h3>
              <p className="text-gray-600">
                Successfully serving leading companies across multiple industries with reliable and efficient logistics.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Continuous Innovation</h3>
              <p className="text-gray-600">
                Staying ahead of industry trends and technological advancements to provide cutting-edge solutions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
