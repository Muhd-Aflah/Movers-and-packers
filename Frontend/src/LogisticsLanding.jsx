import { ContactSection as FooterSection } from "./components/features/Contact/ContactSection";
import { HeaderSection } from "./components/layout/Header";
import { HeroSection } from "./components/features/Hero/HeroSection";
import { OperationsSection as OperationModeSection } from "./components/features/Operations/OperationsSection";
import { Footer as SearchBarSection } from "./components/layout/Footer";
import { ServicesSection } from "./components/features/Services/ServicesSection";
import { WarehouseSection as WarehouseMapSection } from "./components/features/Warehouse/WarehouseSection";

export const LogisticsLanding = () => {
  return (
    <div className="relative w-full bg-white overflow-hidden">
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

      <div className="relative z-10 flex flex-col w-full">
        <HeaderSection />
        <HeroSection />
        <OperationModeSection />
        <WarehouseMapSection />
        <ServicesSection />
        <FooterSection />
        <SearchBarSection />
      </div>
    </div>
  );
};
