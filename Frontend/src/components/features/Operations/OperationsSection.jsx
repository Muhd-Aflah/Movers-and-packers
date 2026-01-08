import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { FORM_FIELDS } from "../../../constants";
import { useForm } from "../../../hooks/useForm";

const validationSchema = {
  origin: (value) => (!value ? "Origin is required" : ""),
  destination: (value) => (!value ? "Destination is required" : ""),
  weight: (value) => (!value ? "Weight is required" : isNaN(value) ? "Weight must be a number" : ""),
};

export function OperationsSection() {
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm(
    {
      origin: "",
      destination: "",
      weight: "",
    },
    validationSchema
  );

  const onSubmit = async (formData) => {
    try {
      console.log("Form submitted:", formData);
      // TODO: Implement actual API call
      alert("Price calculation feature coming soon!");
    } catch (error) {
      console.error("Submission error:", error);
    }
  };

  return (
    <section className="flex flex-col items-center justify-center gap-4 sm:gap-6 p-6 sm:p-8 lg:p-9 bg-[#ffffff] rounded-[20px] sm:rounded-[25px] lg:rounded-[30px] shadow-[0px_0px_25px_#96969633] mx-4 sm:mx-6 lg:mx-auto max-w-6xl">
      <form onSubmit={(e) => e.preventDefault()} className="w-full">
        <div className="flex flex-col lg:flex-row items-end gap-4 sm:gap-6 lg:gap-[22px] w-full">
          {FORM_FIELDS.map((field) => (
            <div key={field.id} className="relative w-full lg:w-[250px] h-[79px]">
              <div className="absolute top-[15px] left-0 w-full h-16 bg-[#ffffff] rounded-xl border border-solid border-[#979797]" />

              <div className="inline-flex flex-col items-start justify-center gap-2 absolute top-[39px] left-4">
                <div className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto]">
                  <div className="inline-flex items-center gap-2.5 relative flex-[0_0_auto]">
                    {field.iconType === "bg" ? (
                      <div className="relative w-4 h-4">
                        <div className="relative top-px left-0.5 w-[11px] h-[13px] bg-[url(/location.svg)] bg-[100%_100%]" />
                      </div>
                    ) : (
                      <img
                        className="relative w-4 h-4"
                        alt={`${field.label} icon`}
                        src={field.icon}
                      />
                    )}

                    <div className="relative flex items-center justify-center w-fit [font-family:'Lato',Helvetica] font-normal text-[#979797] text-xs text-center tracking-[0] leading-[normal] whitespace-nowrap">
                      {field.placeholder}
                    </div>
                  </div>
                </div>
              </div>

              <Label
                htmlFor={field.id}
                className="inline-flex items-center justify-center gap-2.5 p-2 absolute top-0 left-4 bg-white"
              >
                <span className="relative flex items-center justify-center w-fit mt-[-1.00px] [font-family:'Graphik-Medium',Helvetica] font-medium text-[#979797] text-sm text-center tracking-[0] leading-[normal] whitespace-nowrap">
                  {field.label}
                </span>
              </Label>

              <input
                type="text"
                id={field.id}
                name={field.id}
                value={values[field.id]}
                onChange={handleChange}
                onBlur={handleBlur}
                className="absolute top-[39px] left-4 w-full h-8 bg-transparent outline-none"
                placeholder={field.placeholder}
              />
              
              {errors[field.id] && touched[field.id] && (
                <span className="absolute bottom-0 left-4 text-red-500 text-xs">
                  {errors[field.id]}
                </span>
              )}
            </div>
          ))}

          <Button 
            type="button"
            onClick={() => handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="flex flex-col w-full lg:w-[250px] items-center justify-center gap-2.5 p-4 sm:p-6 lg:p-7 bg-simblue rounded-xl hover:bg-simblue/90 disabled:opacity-50"
          >
            <span className="relative flex items-center justify-center w-fit mt-[-1.00px] [font-family:'Lato',Helvetica] font-extrabold text-white text-sm text-center tracking-[0] leading-[normal]">
              {isSubmitting ? "Calculating..." : "Check Price"}
            </span>
          </Button>
        </div>
      </form>
    </section>
  );
}
