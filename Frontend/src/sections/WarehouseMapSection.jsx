import { Button } from "../components/ui/button";

const services = [
  {
    icon: "/group-6920.png",
    title: "Warehousing Services",
    description:
      "A pay as-you-go solution for: pallet storage, inventory management, fulfillment(e.g. pick and pack), in/out-bound solutions, and more.",
  },
  {
    icon: "/group-6921.png",
    title: "Global Freight",
    description:
      "Search and compare the best shipping rates among dozens of trusted logistic partners for the last mile delivery and freight.",
  },
  {
    icon: "/group-6921-1.png",
    title: "Packaging Solutions",
    description:
      "Our packaging solutions are optimized for each individual customer and are selected based on on the customer's specific needs and requirements.",
  },
];

export const WarehouseMapSection = () => {
  return (
    <section className="flex flex-col items-center justify-center gap-12 sm:gap-16 lg:gap-[100px] px-4 sm:px-6 lg:px-[150px] py-12 sm:py-16 lg:py-[100px] bg-[#f4f6f9] w-full">
      <div className="flex flex-col lg:flex-row items-center justify-between w-full max-w-7xl gap-8">
        <div className="flex flex-col items-start lg:items-start justify-center gap-2.5">
          <h2 className="flex items-center justify-center lg:justify-start w-fit [font-family:'Lato',Helvetica] font-normal text-black text-2xl sm:text-3xl lg:text-4xl tracking-[0] leading-[normal] whitespace-nowrap">
            <span className="font-bold">Services </span>
            <span className="[font-family:'Lato',Helvetica] font-normal text-[#141414] text-2xl sm:text-3xl lg:text-4xl tracking-[0]">
              We Offer
            </span>
          </h2>
          <div className="w-[100px] sm:w-[130px] h-1 bg-simorange" />
        </div>

        <img
          className="w-[150px] sm:w-[180px] lg:w-[201px] h-[150px] sm:h-[180px] lg:h-[211px]"
          alt="Group"
          src="/group-6928.png"
        />
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-[75px] w-full max-w-7xl">
        {services.map((service, index) => (
          <div
            key={index}
            className="flex flex-col items-center lg:items-start gap-5 w-full lg:w-auto"
          >
            <div className="flex flex-col items-center lg:items-start justify-center gap-[15px]">
              <img
                className="w-[80px] sm:w-[95px] lg:w-[110px] h-[80px] sm:h-[95px] lg:h-[110px] -mt-[20px] sm:-mt-[25px] -ml-[20px] sm:-ml-[25px]"
                alt={service.title}
                src={service.icon}
              />
              <h3 className="flex items-center justify-center w-fit [font-family:'Lato',Helvetica] font-semibold text-simblue text-xl sm:text-2xl text-center tracking-[0] leading-[normal]">
                {service.title}
              </h3>
            </div>
            <p className="flex items-center justify-center w-full max-w-[330px] [font-family:'Lato',Helvetica] font-normal text-text-1 text-sm sm:text-base lg:text-sm tracking-[0] leading-[21px] text-center lg:text-left">
              {service.description}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 sm:gap-6 lg:gap-[30px]">
        <Button className="flex items-center justify-center gap-2.5 px-6 sm:px-8 lg:px-[50px] py-3 sm:py-4 lg:py-[25px] bg-simblue rounded-xl h-auto hover:bg-simblue/90">
          <span className="flex items-center justify-center w-fit [font-family:'Lato',Helvetica] font-extrabold text-[#ffffff] text-base sm:text-lg lg:text-lg text-center tracking-[0] leading-[normal]">
            Join Now
          </span>
        </Button>
      </div>
    </section>
  );
};

