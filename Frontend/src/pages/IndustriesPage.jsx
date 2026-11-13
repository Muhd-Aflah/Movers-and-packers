import { Link } from "react-router-dom";

const industries = [
  {
    title: "Retail",
    description: "Logistics support for retail inventory and customer deliveries.",
    href: "/industries/retail",
  },
  {
    title: "Manufacturing",
    description: "Transport and storage support for manufacturing operations.",
    href: "/industries/manufacturing",
  },
];

export function IndustriesPage() {
  return (
    <main className="mx-auto min-h-[60vh] max-w-6xl px-6 py-16">
      <h1 className="mb-4 text-3xl font-bold">Industries</h1>
      <p className="mb-8 max-w-2xl text-gray-600">
        Explore the industries served by SwiftMove.
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        {industries.map((industry) => (
          <Link
            key={industry.href}
            to={industry.href}
            className="rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <h2 className="mb-2 text-xl font-semibold">{industry.title}</h2>
            <p className="text-sm text-gray-600">{industry.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
