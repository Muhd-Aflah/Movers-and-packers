export const SearchBarSection = () => {
  const exploreLinks = [
    { label: "About Us" },
    { label: "Our Warehouses" },
    { label: "Blog" },
    { label: "News and Media" },
  ];

  const legalLinks = [
    { label: "Terms" },
    { label: "Privacy" },
  ];

  return (
    <footer className="w-full bg-simblue px-4 sm:px-6 lg:px-[150px] py-10">
      <div className="max-w-7xl mx-auto flex flex-col gap-12">

        {/* TOP CONTENT */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-24">

          {/* BRAND */}
          <div className="flex flex-col gap-5 max-w-sm">
            <img
              src="/swiftmove-logo.png"
              alt="SwiftMove"
              className="h-12 w-auto object-contain"
            />

            <p className="text-sm text-white leading-relaxed">
              <span className="font-semibold">SwiftMove</span> delivers
              unparalleled customer service through dedicated teams,
              agile processes, and a global logistics footprint.
            </p>
          </div>

          {/* EXPLORE */}
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-bold text-lg">Explore</h4>
            {exploreLinks.map((link, index) => (
              <p
                key={index}
                className="text-white text-sm cursor-pointer hover:opacity-80"
              >
                {link.label}
              </p>
            ))}
          </div>

          {/* LEGAL */}
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-bold text-lg">Legal</h4>
            {legalLinks.map((link, index) => (
              <p
                key={index}
                className="text-white text-sm cursor-pointer hover:opacity-80"
              >
                {link.label}
              </p>
            ))}
          </div>

          {/* SOCIAL */}
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-bold text-lg">Social Media</h4>
            <img
              src="/social-icons.svg"
              alt="Social Media"
              className="h-8 w-auto"
            />
          </div>
        </div>

        {/* DIVIDER */}
        <div className="w-full border-t border-white/30"></div>

        {/* BOTTOM LOGO */}
        <div className="flex justify-center">
          <img
            src="/logo.png"
            alt="SwiftMove"
            className="h-9 w-auto object-contain"
          />
        </div>

        {/* COPYRIGHT */}
        <p className="text-center text-sm text-white opacity-80">
          © {new Date().getFullYear()} SwiftMove. All rights reserved.
        </p>

      </div>
    </footer>
  );
};
