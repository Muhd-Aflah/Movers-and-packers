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
    <section className="flex w-full flex-col items-center justify-center gap-12 bg-slate-100 px-4 py-12 text-foreground sm:gap-16 sm:px-6 sm:py-16 lg:gap-[100px] lg:px-[150px] lg:py-[100px] dark:bg-slate-900">
      <div className="flex flex-col lg:flex-row items-center justify-between w-full max-w-7xl gap-8">
        <div className="flex flex-col items-start lg:items-start justify-center gap-2.5">
          <h2 className="flex w-fit items-center justify-center whitespace-nowrap text-2xl font-normal leading-normal text-foreground sm:text-3xl lg:justify-start lg:text-4xl">
            <span className="font-bold">Services </span>
            <span className="text-foreground text-2xl font-normal sm:text-3xl lg:text-4xl">
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
              <h3 className="flex w-fit items-center justify-center text-center text-xl font-semibold leading-normal text-simblue dark:text-blue-300 sm:text-2xl">
                {service.title}
              </h3>
            </div>
            <p className="flex w-full max-w-[330px] items-center justify-center text-center text-sm leading-[21px] text-muted-foreground sm:text-base lg:text-left lg:text-sm">
              {service.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
