import { FOOTER_LINKS } from "../../constants";

export function Footer() {
  return (
    <footer className="w-full bg-simblue px-4 sm:px-6 lg:px-[150px] py-8 sm:py-12 lg:py-[50px]">
      <div className="flex flex-col items-center justify-center gap-8 sm:gap-12 lg:gap-[50px]">
        <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-[168px] w-full max-w-7xl">
          {/* Company Info */}
          <div className="flex flex-col items-start gap-5 w-full lg:w-auto">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            <span className="text-blue-600">Swift</span>
            <span className="text-red-600">Move</span>
          </span>

            <div className="w-full max-w-[300px] lg:w-[220px] [font-family:'League_Spartan',Helvetica] font-normal text-[#ffffff] text-sm tracking-[0] leading-[21px]">
              <span className="[font-family:'League_Spartan',Helvetica] font-normal text-[#ffffff] text-sm tracking-[0] leading-[21px]">
                SwiftMove
              </span>
              <span className="[font-family:'Lato',Helvetica]">
                {" "}
                delivers an unparalleled customer service through dedicated
                customer teams, engaged people working in an agile culture, and
                a global footprint
              </span>
            </div>
          </div>

          {/* Explore Links */}
          <div className="flex flex-col items-start gap-5 w-full lg:w-auto">
            <div className="[font-family:'Lato',Helvetica] font-bold text-[#ffffff] text-base sm:text-lg tracking-[0] leading-[normal]">
              Explore
            </div>

            <div className="flex flex-col items-start justify-center gap-2.5">
              {FOOTER_LINKS.explore.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="[font-family:'Lato',Helvetica] font-medium text-[#ffffff] text-sm tracking-[0] leading-[normal] cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Legal Links */}
          <div className="flex flex-col items-start gap-5 w-full lg:w-auto">
            <div className="[font-family:'Lato',Helvetica] font-bold text-[#ffffff] text-base sm:text-lg tracking-[0] leading-[normal]">
              Legal
            </div>

            <div className="flex flex-col gap-3">
              {FOOTER_LINKS.legal.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="[font-family:'Lato',Helvetica] font-medium text-[#ffffff] text-sm tracking-[0] leading-[normal] cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Social Media */}
          <div className="flex flex-col items-start gap-5 w-full lg:w-auto">
            <div className="[font-family:'Lato',Helvetica] font-bold text-[#ffffff] text-base sm:text-lg tracking-[0] leading-[normal]">
              Social Media
            </div>

            <img
              className="flex-[0_0_auto] w-32 h-8 sm:w-auto sm:h-auto"
              alt="Social icons"
              src="/social-icons.svg"
            />
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="w-full mt-8 pt-4 border-t border-white/30">
          <p className="text-center text-sm text-white opacity-80">
            © {new Date().getFullYear()} SwiftMove. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
