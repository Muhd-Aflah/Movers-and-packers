import { Button } from "../components/ui/button";

export const HeroSection = () => {
  return (
    <section className="w-full py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">

          {/* LEFT CONTENT */}
          <div className="flex flex-col gap-6 max-w-xl">
            <p className="text-sm font-semibold text-gray-600">
              Quick & reliable
            </p>

            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
              Warehousing <br />
              <span className="text-blue-500">and logistics</span> <br />
              solution.
            </h1>

            <p className="text-gray-600 text-base">
              ShipUp delivers unparalleled customer service through dedicated
              teams, agile processes, and a global logistics footprint.
            </p>

          <Button className="px-7 sm:px-8 lg:px-[50px] py-3 sm:py-4 lg:py-[20px] h-auto bg-simblue hover:bg-simblue/90 rounded-xl w-[24px]">
              Join Now
            </Button>
          </div>

          <div className="w-full flex justify-center lg:justify-end">
            <img
              src="/91fa59e6781adbdced82e349bb595d99-1.png"
              alt="Logistics illustration"
              className="w-full max-w-md lg:max-w-2xl h-auto"
            />
          </div>

        </div>
      </div>
    </section>
  );
};
