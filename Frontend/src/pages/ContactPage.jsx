import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { LOCATION_DATA } from "../constants";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ChevronRight,
  Globe,
  Users,
  TrendingUp,
  Star,
  MessageSquare,
  ArrowRight,
  Shield,
  Award,
  Truck,
  Warehouse
} from "lucide-react";

function LocationCard({ location, isHovered, onHover }) {
  return (
    <div
      key={location.id}
      className={`absolute ${location.top} ${location.left} transition-all duration-500 ${
        isHovered === location.id 
          ? "scale-125 z-30" 
          : "hover:scale-110 hover:z-20 z-10"
      }`}
      onMouseEnter={() => onHover(location.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Animated pulse effect */}
      {isHovered === location.id && (
        <div className="absolute inset-0 animate-ping bg-blue-500/20 rounded-2xl" />
      )}
      
      <div className="relative w-24 sm:w-28 lg:w-32">
        {/* Main card */}
        <Card className="w-full border-0 shadow-2xl hover:shadow-3xl transition-shadow duration-300 overflow-hidden group">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              {/* Flag with shine effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine rounded-lg" />
                <img
                  className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-lg shadow-md object-cover border-2 border-white"
                  alt={`${location.country} flag`}
                  src={location.flag}
                />
              </div>
              
              <div className="flex flex-col">
                <div className="font-semibold text-gray-900 text-sm sm:text-base">
                  {location.country}
                </div>
                <div className="flex items-center gap-1">
                  <Warehouse className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                  <span className="font-bold text-blue-600 text-lg sm:text-xl">
                    {location.count}
                  </span>
                  <span className="text-xs text-gray-500">warehouses</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Pointer with animation */}
        <div className="relative">
          <MapPin className={`absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-5 h-5 sm:w-6 sm:h-6 ${
            isHovered === location.id ? "text-red-500 animate-bounce" : "text-blue-500"
          } transition-colors duration-300`} />
        </div>
      </div>
    </div>
  );
}

function StatItem({ icon: Icon, value, label, color = "blue" }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600"
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-600">{label}</div>
      </div>
    </div>
  );
}

export function ContactPage() {
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 py-16 sm:py-20 lg:py-24">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Globe className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">Global Presence</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Global Warehouse
              <span className="block text-blue-200 mt-2">Network</span>
            </h1>
            
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Strategic warehouse locations across the globe for efficient logistics and faster deliveries
            </p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8 mb-10">
              {[
                { icon: Users, value: "500+", label: "Partners", color: "green" },
                { icon: TrendingUp, value: "99.8%", label: "Uptime", color: "purple" },
                { icon: Shield, value: "24/7", label: "Security", color: "blue" },
                { icon: Award, value: "ISO", label: "Certified", color: "orange" }
              ].map((stat, index) => (
                <div key={index} className="flex items-center gap-3 text-white">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-blue-200">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        {/* Map Section */}
        <section className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-12 mb-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Strategic Global Locations
              </h2>
              <p className="text-gray-600 text-lg mb-8">
                Our carefully selected warehouse locations ensure optimal coverage and efficiency for your logistics needs.
                Each facility is equipped with state-of-the-art technology and security systems.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <StatItem icon={Truck} value="48h" label="Avg Delivery Time" color="blue" />
                <StatItem icon={Clock} value="99.9%" label="On-time Delivery" color="green" />
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="ml-2 font-medium">4.9/5 from 2,500+ reviews</span>
              </div>
            </div>
            
            {/* Map Container */}
            <div className="relative h-[400px] sm:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden border-4 border-white shadow-xl">
              {/* Map Background */}
              <img
                className="w-full h-full object-cover"
                alt="World map showing warehouse locations"
                src="/group-2.png"
              />
              
              {/* Location Cards */}
              {LOCATION_DATA.map((location) => (
                <LocationCard
                  key={location.id}
                  location={location}
                  isHovered={hoveredLocation}
                  onHover={setHoveredLocation}
                />
              ))}
              
              {/* Map Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            </div>
          </div>
          
          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {[
              { icon: Shield, title: "Secure Storage", desc: "24/7 surveillance & insurance" },
              { icon: TrendingUp, title: "Real-time Tracking", desc: "Live inventory updates" },
              { icon: Clock, title: "24/7 Operations", desc: "Round-the-clock access" },
              { icon: MessageSquare, title: "Dedicated Support", desc: "Personal account manager" }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-xl hover:bg-white hover:shadow-lg transition-all">
                <feature.icon className="w-8 h-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
            {/* Floating elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
            
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Ready to Optimize Your Logistics?
              </h2>
              <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
                Join thousands of businesses that trust us with their warehousing and distribution needs
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg rounded-xl font-semibold group"
                >
                  <span className="flex items-center gap-2">
                    Request Quote
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
                <Button
                  size="lg"
                  className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl font-semibold group"
                >
                  <span className="flex items-center gap-2">
                    Join Now
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </div>
              
              <p className="text-blue-200 text-sm mt-8">
                <Phone className="inline w-4 h-4 mr-2" />
                Call us: +91 9656225566 • 
                <Mail className="inline w-4 h-4 mx-2" />
                Email:  swiftmove@online.com
              </p>
            </div>
          </div>
        </section>
      </div>
      
      <style jsx>{`
        @keyframes shine {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
        .animate-shine {
          animation: shine 2s infinite;
        }
      `}</style>
    </div>
  );
}