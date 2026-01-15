import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { LOCATION_DATA } from "../constants";

export function ContactSection() {
  return (
    <section className="flex flex-col items-center justify-center gap-12 sm:gap-16 lg:gap-[100px] px-4 sm:px-6 lg:px-0 py-12 sm:py-16 lg:py-[100px] w-full bg-[#eef1fa]">
      <header className="flex flex-col items-center sm:items-start gap-2.5">
        <h2 className="flex items-center justify-center w-fit [font-family:'Lato',Helvetica] font-normal text-black text-2xl sm:text-3xl lg:text-4xl tracking-[0] leading-[normal] whitespace-nowrap">
          <span className="font-bold">Warehouse </span>
          <span className="[font-family:'Lato',Helvetica] font-normal text-[#141414] text-2xl sm:text-3xl lg:text-4xl tracking-[0]">
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

        {LOCATION_DATA.map((location) => (
          <div
            key={location.id}
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
                  <div className="[font-family:'Graphik-Medium',Helvetica] font-medium text-[#979797] text-[8px] sm:text-[9px] lg:text-[10px] tracking-[0] leading-[normal] whitespace-nowrap">
                    {location.country}
                  </div>
                  <div className="[font-family:'Graphik-Medium',Helvetica] font-medium text-body text-xs sm:text-sm lg:text-sm tracking-[0] leading-[normal] whitespace-nowrap">
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
        <Button
          variant="outline"
          className="px-6 sm:px-8 lg:px-[50px] py-3 sm:py-4 lg:py-[25px] h-auto rounded-xl border-[#2c2d5b] hover:bg-transparent w-full sm:w-auto"
        >
          <span className="[font-family:'Lato',Helvetica] font-extrabold text-simblue text-base sm:text-lg lg:text-lg text-center tracking-[0] leading-[normal]">
            Request Quote
          </span>
        </Button>
        <Button className="px-6 sm:px-8 lg:px-[50px] py-3 sm:py-4 lg:py-[25px] h-auto bg-simblue hover:bg-simblue/90 rounded-xl w-full sm:w-auto">
          <span className="[font-family:'Lato',Helvetica] font-extrabold text-[#ffffff] text-base sm:text-lg lg:text-lg text-center tracking-[0] leading-[normal]">
            Join Now
          </span>
        </Button>
      </div>
    </section>
  );
}
