import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Link } from "react-router-dom";

const locationData = [
  {
    top: "top-[20%] sm:top-[25%] lg:top-[133px]",
    left: "left-[60%] sm:left-[65%] lg:left-[984px]",
    flag: "/group-7028.png",
    country: "Malaysia",
    count: "10,000",
  },
  {
    top: "top-[50%] sm:top-[55%] lg:top-[323px]",
    left: "left-[60%] sm:left-[65%] lg:left-[982px]",
    flag: "/group-7028-1.png",
    country: "India",
    count: "25,000",
  },
  {
    top: "top-[35%] sm:top-[40%] lg:top-[218px]",
    left: "left-[20%] sm:left-[25%] lg:left-[191px]",
    flag: "/group-7028-2.png",
    country: "Uae",
    count: "15,000",
  },
];

export const FooterSection = () => {
  return (
    <section className="flex w-full flex-col items-center justify-center gap-12 bg-slate-100 px-4 py-12 text-foreground sm:gap-16 sm:px-6 sm:py-16 lg:gap-[100px] lg:px-0 lg:py-[100px] dark:bg-slate-900">
      <header className="flex flex-col items-center sm:items-start gap-2.5">
        <h2 className="flex w-fit items-center justify-center whitespace-nowrap text-2xl font-normal leading-normal text-foreground sm:text-3xl lg:text-4xl">
          <span className="font-bold">Warehouse </span>
          <span className="text-foreground text-2xl font-normal sm:text-3xl lg:text-4xl">
            Onsite
          </span>
        </h2>
        <div className="w-[100px] sm:w-[130px] h-1 bg-[#ff383c]" />
      </header>

      <div className="relative w-full max-w-7xl h-[400px] sm:h-[500px] lg:h-[823px]">
        <img
          className="absolute -top-3 left-0 w-full h-[500px] sm:h-[600px] lg:h-[1034px] object-cover"
          alt="World map showing warehouse locations"
          src="/group-2.png"
        />

        {locationData.map((location, index) => (
          <div
            key={`location-${index}`}
            className={`absolute ${location.top} ${location.left} w-[90px] sm:w-[100px] lg:w-[111px] h-[60px] sm:h-[65px] lg:h-[73px] flex flex-col shadow-[0px_3.01px_15.43px_#14004206,0px_6.84px_27.93px_#14004208,0px_11.9px_36.95px_#14004209,0px_18.91px_41.85px_#14004209,0px_29.17px_42.29px_#1400420a,0px_45.52px_40.19px_#1400420a,0px_75.57px_49.1px_#1400420c]`}
          >
            <Card className="w-[90px] sm:w-[100px] lg:w-[111px] h-[45px] sm:h-[48px] lg:h-[52px] border-0 shadow-none">
              <CardContent className="flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5">
                <img
                  className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8"
                  alt={`${location.country} flag`}
                  src={location.flag}
                />
                <div className="flex flex-col items-start gap-0.5">
                  <div className="whitespace-nowrap text-[8px] font-medium leading-normal text-muted-foreground sm:text-[9px] lg:text-[10px]">
                    {location.country}
                  </div>
                  <div className="whitespace-nowrap text-xs font-medium leading-normal text-foreground sm:text-sm">
                    {location.count}
                  </div>
                </div>
              </CardContent>
            </Card>
            <img
              className="ml-[20px] sm:ml-[23px] lg:ml-[26.6px] w-[18px] sm:w-[20px] lg:w-[24.45px] h-[16px] sm:h-[18px] lg:h-[21.19px]"
              alt="Location pointer"
              src="/polygon-2.svg"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-[30px]">
        {/* REQUEST QUOTE */}
        <Link to="/booking" className="w-full sm:w-auto">
          <Button
            variant="outline"
            className="h-auto w-full rounded-xl border-primary px-6 py-3 hover:bg-accent sm:px-8 sm:py-4 lg:px-[50px] lg:py-[25px]"
          >
            <span className="text-center text-base font-extrabold text-primary sm:text-lg">
              Request Quote
            </span>
          </Button>
        </Link>

        {/* JOIN NOW */}
        <Link to="/signup" className="w-full sm:w-auto">
          <Button className="h-auto w-full rounded-xl bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90 sm:px-8 sm:py-4 lg:px-[50px] lg:py-[25px]">
            <span className="text-center text-base font-extrabold text-primary-foreground sm:text-lg">
              Join Now
            </span>
          </Button>
        </Link>
      </div>
      
    </section>
  );
};
