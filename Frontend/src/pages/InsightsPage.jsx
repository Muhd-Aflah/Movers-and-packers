import { Link } from "react-router-dom";

export function InsightsPage() {
  const insights = [
    {
      id: 1,
      title: "The Future of Last-Mile Delivery",
      excerpt: "Exploring emerging technologies and strategies revolutionizing final delivery logistics.",
      category: "Technology",
      date: "2024-01-15",
      readTime: "5 min read",
      image: "/insights-1.jpg"
    },
    {
      id: 2,
      title: "Supply Chain Resilience in 2024",
      excerpt: "Building robust supply chains that can withstand global disruptions and market volatility.",
      category: "Strategy",
      date: "2024-01-10",
      readTime: "8 min read",
      image: "/insights-2.jpg"
    },
    {
      id: 3,
      title: "Sustainable Logistics Practices",
      excerpt: "How companies are reducing their carbon footprint while maintaining efficiency.",
      category: "Sustainability",
      date: "2024-01-05",
      readTime: "6 min read",
      image: "/insights-3.jpg"
    },
    {
      id: 4,
      title: "AI in Warehouse Management",
      excerpt: "Leveraging artificial intelligence to optimize inventory and streamline operations.",
      category: "Technology",
      date: "2023-12-28",
      readTime: "7 min read",
      image: "/insights-4.jpg"
    },
    {
      id: 5,
      title: "Global Trade Trends 2024",
      excerpt: "Key trends shaping international logistics and cross-border commerce.",
      category: "Global Trade",
      date: "2023-12-20",
      readTime: "10 min read",
      image: "/insights-5.jpg"
    },
    {
      id: 6,
      title: "Cold Chain Logistics Innovations",
      excerpt: "Advancements in temperature-controlled supply chains for pharmaceuticals and food.",
      category: "Innovation",
      date: "2023-12-15",
      readTime: "6 min read",
      image: "/insights-6.jpg"
    }
  ];

  const categories = ["All", "Technology", "Strategy", "Sustainability", "Global Trade", "Innovation"];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Insights & Resources</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Industry trends, logistics strategies, and expert insights to help you stay ahead
          </p>
        </div>

        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === 'All' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {insights.map((insight) => (
            <article key={insight.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer">
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400 text-lg">Image Placeholder</span>
              </div>
              
              <div className="p-6">
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
                    {insight.category}
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {insight.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed mb-4">
                  {insight.excerpt}
                </p>
                
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{insight.date}</span>
                  <span>{insight.readTime}</span>
                </div>
                
                <div className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                  Read More →
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Stay Updated</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Newsletter</h3>
              <p className="text-gray-600 mb-4">
                Get weekly insights delivered to your inbox
              </p>
              <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700">
                Subscribe
              </button>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Reports</h3>
              <p className="text-gray-600 mb-4">
                Download comprehensive industry reports
              </p>
              <button className="w-full bg-gray-100 text-gray-900 py-3 px-6 rounded-lg hover:bg-gray-200 border border-gray-300">
                View Reports
              </button>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Webinars</h3>
              <p className="text-gray-600 mb-4">
                Join expert-led sessions on logistics trends
              </p>
              <button className="w-full bg-gray-100 text-gray-900 py-3 px-6 rounded-lg hover:bg-gray-200 border border-gray-300">
                Upcoming Events
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
