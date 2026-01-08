export function AboutPage() {
  return (
    <div className="w-full bg-white">
      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          About SwiftMove
        </h1>
        <p className="text-gray-600 max-w-3xl">
          SwiftMove is a modern logistics and warehousing platform designed to
          simplify global shipping, storage, and last-mile delivery through
          technology and operational excellence.
        </p>
      </section>

      {/* MISSION + VISION */}
      <section className="bg-[#eef1fa]">
        <div className="max-w-7xl mx-auto px-6 py-16 grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Our Mission
            </h2>
            <p className="text-gray-700 leading-relaxed">
              To deliver fast, reliable, and transparent logistics services by
              combining smart technology, skilled teams, and a global
              infrastructure.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Our Vision
            </h2>
            <p className="text-gray-700 leading-relaxed">
              To become a trusted global logistics partner that empowers
              businesses to scale without friction.
            </p>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          Why Choose SwiftMove
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Global Network",
              desc: "Warehouses and delivery partners across major regions.",
            },
            {
              title: "Fast Operations",
              desc: "Optimized processes for quick turnaround times.",
            },
            {
              title: "Secure Handling",
              desc: "Safety-first approach for all shipments.",
            },
            {
              title: "Tech Driven",
              desc: "Real-time tracking and smart logistics tools.",
            },
            {
              title: "Customer Support",
              desc: "Dedicated teams available when you need them.",
            },
            {
              title: "Scalable Solutions",
              desc: "Built for startups, SMEs, and enterprises.",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="p-6 rounded-xl border border-gray-200 hover:shadow-md transition"
            >
              <h3 className="font-semibold text-gray-900 mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
