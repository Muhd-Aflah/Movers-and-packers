export function AboutPage() {
  return (
    <div className="w-full bg-white text-gray-900">

      {/* HERO */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Built to Move Faster
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl">
            SwiftMove is a modern logistics and warehousing platform helping
            businesses ship, store, and deliver goods without friction.
          </p>
        </div>
      </section>

      {/* MISSION STRIP */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="border-l-4 border-gray-900 pl-6 max-w-3xl">
            <h2 className="text-2xl font-bold mb-4">
              Our Mission
            </h2>
            <p className="text-gray-600 leading-relaxed">
              To deliver fast, reliable, and transparent logistics by combining
              smart technology, skilled teams, and a strong global
              infrastructure.
            </p>
          </div>
        </div>
      </section>

      {/* VISION BLOCK */}
      <section className="bg-gray-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-bold mb-6">
            Our Vision
          </h2>
          <p className="text-gray-300 text-lg max-w-3xl">
            To become a trusted global logistics partner that empowers
            businesses to scale confidently, no matter the destination.
          </p>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-bold mb-12 text-center">
            Why Choose SwiftMove
          </h2>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Global Network",
                desc: "Warehouses and delivery partners across major regions.",
                color: "bg-blue-100 text-blue-700",
              },
              {
                title: "Fast Operations",
                desc: "Optimized processes for rapid turnaround.",
                color: "bg-green-100 text-green-700",
              },
              {
                title: "Secure Handling",
                desc: "Safety-first handling for every shipment.",
                color: "bg-purple-100 text-purple-700",
              },
              {
                title: "Tech Driven",
                desc: "Real-time tracking and smart logistics tools.",
                color: "bg-orange-100 text-orange-700",
              },
              {
                title: "Customer Support",
                desc: "Dedicated teams when you need help.",
                color: "bg-pink-100 text-pink-700",
              },
              {
                title: "Scalable Solutions",
                desc: "Built for startups, SMEs, and enterprises.",
                color: "bg-yellow-100 text-yellow-700",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition"
              >
                <span
                  className={`inline-block text-sm font-semibold px-3 py-1 rounded-full mb-4 ${item.color}`}
                >
                  {item.title}
                </span>
                <p className="text-gray-600 text-sm">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
