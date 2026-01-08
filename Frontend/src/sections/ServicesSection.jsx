import { Badge } from "../components/ui/badge";


const operationSteps = [
  {
    number: "1",
    title: "Connect",
    titleColor: "text-[#00c8b3]",
    description:
      "You're currently running your store on Shopify, WooCommerce, or any other platform. As a first step, you'll connect your store with our platform.",
    imageSrc: "/image-3.png",
    imageAlt: "Image",
    imageWidth: "w-full max-w-[400px] lg:max-w-[600.94px]",
    imageHeight: "h-auto max-h-[300px] lg:h-[400px]",
    imagePosition: "right",
    imageClass: "object-cover",
  },
  {
    number: "2",
    title: "Store",
    titleColor: "text-[#00c0e8]",
    description:
      "Then, you can send us your inventory and the fun begins. We'll choose a delivery day together so your fulfilment is not interrupted.",
    imageSrc: "/rectangle-1314.png",
    imageAlt: "Rectangle",
    imageWidth: "w-full max-w-[400px]",
    imageHeight: "h-auto max-h-[300px] lg:h-[400px]",
    imagePosition: "left",
    imageClass: "object-cover",
  },
  {
    number: "3",
    title: "Ship",
    titleColor: "text-[#00c3d0]",
    description:
      "We pick, pack and ship all incoming orders directly from our own warehouse until 12pm on the same day,",
    imageSrc: "/91fa59e6781adbdced82e349bb595d99-1-1.png",
    imageAlt: "Img",
    imageWidth: "w-full max-w-[400px]",
    imageHeight: "h-auto max-h-[300px] lg:h-[400px]",
    imagePosition: "right",
    imageClass: "object-contain",
  },
];

export const ServicesSection = () => {
  return (
    <section className="relative w-full py-16 sm:py-20 lg:py-[147px] px-4">
      <div className="max-w-7xl mx-auto flex flex-col gap-8 sm:gap-12 lg:gap-[50px]">
        <div className="flex justify-center">
          <div className="inline-flex flex-col items-start gap-2.5">
            <div className="flex items-center justify-center [font-family:'Lato',Helvetica] font-normal text-black text-2xl sm:text-3xl lg:text-4xl tracking-[0] leading-[normal] whitespace-nowrap">
              <span className="font-bold">Operation </span>
              <span className="[font-family:'Lato',Helvetica] font-normal text-[#141414] text-2xl sm:text-3xl lg:text-4xl tracking-[0]">
                Mode
              </span>
            </div>
            <div className="w-[100px] sm:w-[130px] h-1 bg-[#ff383c]" />
          </div>
        </div>

        <div className="relative flex flex-col gap-12 sm:gap-16 lg:gap-[50px]">
          {operationSteps.map((step, index) => (
            <div
              key={index}
              className={`flex flex-col ${step.imagePosition === "left" ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-8 lg:gap-[250px]`}
            >
              <div className="inline-flex flex-col items-start gap-6 sm:gap-8 lg:gap-10 flex-shrink-0 w-full lg:w-auto">
                <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-[30px]">
                  <Badge className="inline-flex flex-col items-center justify-center gap-2.5 px-[14px] sm:px-[18px] py-[8px] sm:py-[10.5px] bg-[#230b34] rounded-[100px] hover:bg-[#230b34]">
                    <div className="[font-family:'Lato',Helvetica] font-bold text-[#f8f8fa] text-xl sm:text-2xl text-center tracking-[0] leading-[normal]">
                      {step.number}
                    </div>
                  </Badge>
                  <h3
                    className={`[font-family:'Lato',Helvetica] font-black text-2xl sm:text-3xl lg:text-[40px] tracking-[0] leading-[normal] text-center sm:text-left ${step.titleColor}`}
                  >
                    {step.title}
                  </h3>
                </div>
                <p className="w-full max-w-[400px] [font-family:'Lato',Helvetica] font-normal text-text-1 text-sm sm:text-base lg:text-sm tracking-[0] leading-[normal] text-center sm:text-left">
                  {step.description}
                </p>
              </div>
              <div className="w-full flex justify-center lg:justify-end">
                <img
                  className={`${step.imageWidth} ${step.imageHeight} ${step.imageClass}`}
                  alt={step.imageAlt}
                  src={step.imageSrc}
                />
              </div>
            </div>
          ))}

          <img
            className="absolute top-[200px] sm:top-[300px] lg:top-[346px] left-[50px] sm:left-[100px] lg:left-[175px] w-[300px] sm:w-[450px] lg:w-[603px] h-[300px] sm:h-[450px] lg:h-[609px] pointer-events-none hidden lg:block"
            alt="Group"
            src="/group-6934.png"
          />
        </div>
      </div>

      <img
        className="absolute top-[-7px] left-[-50px] w-[150px] sm:w-[200px] lg:w-[251px] h-[150px] sm:h-[200px] lg:h-[281px] pointer-events-none hidden sm:block"
        alt="Group"
        src="/group-6928-1.png"
      />
    </section>
  );
};
