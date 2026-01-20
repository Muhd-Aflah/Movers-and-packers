import { Link } from "react-router-dom";
import { 
  ShoppingCart, 
  Building2, 
  Package, 
  Zap, 
  Shield, 
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Cpu,
  Globe,
  BarChart3,
  Headphones,
  Cloud,
  Lock,
  RefreshCw,
  Code
} from "lucide-react";

function SolutionCard({ id, title, description, features, icon: Icon }) {
  return (
    <Link
      key={id}
      to={`/solutions/${id}`}
      className="group relative bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden border border-gray-100"
    >
      {/* Gradient background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative">
        {/* Icon with gradient */}
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl transform rotate-45 group-hover:rotate-12 transition-transform duration-500" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="h-10 w-10 text-white transform -rotate-45" />
          </div>
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        
        <p className="text-gray-600 leading-relaxed mb-6">
          {description}
        </p>

        {/* Features list */}
        <ul className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-gray-700">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA button */}
        <div className="flex items-center justify-between">
          <span className="text-blue-600 font-semibold group-hover:text-blue-700 transition-colors">
            Learn more
          </span>
          <div className="w-10 h-10 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors flex items-center justify-center">
            <ArrowRight className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all group">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mb-4 group-hover:from-blue-100 group-hover:to-blue-200 transition-colors">
        <Icon className="h-6 w-6 text-blue-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export function SolutionsPage() {
  const solutions = [
    {
      id: "ecommerce",
      title: "E-commerce Solutions",
      description: "Complete fulfillment solutions for online businesses, from inventory management to last-mile delivery.",
      features: ["Real-time inventory sync", "Automated order processing", "Multi-carrier shipping", "Returns management"],
      icon: ShoppingCart
    },
    {
      id: "enterprise",
      title: "Enterprise Solutions",
      description: "Scalable logistics solutions designed for large-scale operations and complex supply chains.",
      features: ["Custom integration", "Advanced analytics", "Dedicated support", "Global network"],
      icon: Building2
    },
    {
      id: "small-business",
      title: "Small Business",
      description: "Affordable logistics solutions designed for startups and growing businesses.",
      features: ["Simple setup", "Pay-as-you-go pricing", "Basic analytics", "Email support"],
      icon: Package
    },
    {
      id: "retail",
      title: "Retail Distribution",
      description: "Optimized supply chain solutions for brick-and-mortar retail businesses.",
      features: ["Store delivery", "Inventory management", "Route optimization", "Real-time tracking"],
      icon: Cpu
    }
  ];

  const features = [
    {
      icon: Zap,
      title: "Fast Implementation",
      description: "Get up and running in days, not months with our streamlined setup process."
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with 99.9% uptime guarantee for peace of mind."
    },
    {
      icon: TrendingUp,
      title: "Scalable Growth",
      description: "Start small and scale effortlessly as your business grows without limitations."
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Access to worldwide logistics network with local expertise in every market."
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Make data-driven decisions with real-time insights and predictive analytics."
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Round-the-clock support from our team of logistics experts and engineers."
    }
  ];

  const stats = [
    { value: "99.9%", label: "Uptime" },
    { value: "24/7", label: "Support" },
    { value: "50+", label: "Integrations" },
    { value: "100+", label: "Countries" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Powerful Solutions
              <span className="block text-blue-200 text-4xl md:text-5xl mt-2">
                for Modern Logistics
              </span>
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-10">
              Tailored logistics solutions designed to meet the unique needs of businesses of all sizes
            </p>
            
            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-12 mb-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-blue-200 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Solutions Grid */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Choose Your Perfect Solution
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Select from our range of specialized solutions designed for different business needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {solutions.map((solution) => (
            <SolutionCard key={solution.id} {...solution} />
          ))}
        </div>

        {/* Features Section */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 md:p-12 mb-20 border border-gray-200">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Built with cutting-edge technology and designed for reliability
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Logistics?
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of businesses that trust us with their logistics operations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Get Started
              </Link>
              <Link
                to="/demo"
                className="inline-flex items-center justify-center bg-transparent border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                Request Demo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}