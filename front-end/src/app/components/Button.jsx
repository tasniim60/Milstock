import { forwardRef } from "react";
import { clsx } from "clsx";
const Button = forwardRef(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => {
    return <button
      ref={ref}
      className={clsx(
        "rounded-xl transition-all duration-200 font-medium inline-flex items-center justify-center gap-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        {
          /* Primary — #6A7B4D */
          "bg-[#6A7B4D] text-white hover:bg-[#5A6B3D] active:scale-[0.98] shadow-sm": variant === "primary",
          /* Secondary — #4B5B3A */
          "bg-[#4B5B3A] text-white hover:bg-[#3B4B2A] active:scale-[0.98]": variant === "secondary",
          /* Danger */
          "bg-[#D4183D] text-white hover:bg-[#A82F24] active:scale-[0.98]": variant === "danger",
          /* Outline */
          "border border-[#4B5B3A]/40 text-[#2E3A24] bg-transparent hover:bg-[#4B5B3A]/8 active:scale-[0.98]": variant === "outline",
          /* Ghost */
          "text-[#2E3A24] bg-transparent hover:bg-[#4B5B3A]/10 active:scale-[0.98]": variant === "ghost",
          "px-3 py-1.5 text-xs gap-1.5": size === "sm",
          "px-4 py-2 text-sm": size === "md",
          "px-6 py-3 text-base": size === "lg"
        },
        className
      )}
      {...props}
    >
        {children}
      </button>;
  }
);
Button.displayName = "Button";
export {
  Button
};
