import * as LabelPrimitive from "@radix-ui/react-label";
import { cva } from "class-variance-authority";
import * as React from "react";
import { cn } from "../../utils";

const labelVariants = cva(
  "text-[13px] font-semibold leading-5 text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

const Label = React.forwardRef(
  ({ className, ...props }, ref) => (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants(), className)}
      {...props}
    />
  ),
);
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
