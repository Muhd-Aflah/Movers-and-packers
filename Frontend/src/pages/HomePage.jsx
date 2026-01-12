import { HeroSection } from "../sections/HeroSection";
import { ServicesSection } from "../sections/ServicesSection";
import { OperationModeSection } from "../sections/OperationModeSection";
import { WarehouseMapSection } from "../sections/WarehouseMapSection";
import { FooterSection } from "../sections/FooterSection";

export function HomePage() {
  return (
   <div className="relative w-full bg-white overflow-visible">

      <img
        src="/group-7031.png"
        alt=""
        className="hidden lg:block absolute top-0 left-0 w-[500px] h-[870px] opacity-20 pointer-events-none -z-10"
      />

      <img
        src="/group-6922.png"
        alt=""
        className="hidden lg:block absolute top-[180px] right-[100px] w-[110px] h-[110px] opacity-20 pointer-events-none -z-10"
      />

      <img
        src="/gemini-generated-image-txpkkltxpkkltxpk-removebg-preview-2.png"
        alt=""
        className="hidden lg:block absolute top-0 left-0 w-[350px] h-[165px] opacity-20 pointer-events-none -z-10"
      />

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex flex-col w-full">
        <HeroSection />
        <OperationModeSection />
        <WarehouseMapSection />
        <ServicesSection />
        <FooterSection />
      </div>
    </div>
  );
}
