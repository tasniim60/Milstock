import { forwardRef } from "react";
import { clsx } from "clsx";
const Input = forwardRef(
  ({ label, error, className, ...props }, ref) => {
    return <div className="w-full">
        {label && <label className="block mb-1.5 text-sm font-medium text-[#2E3A24]">
            {label}
          </label>}
        <input
      ref={ref}
      className={clsx(
        "w-full px-4 py-2.5 rounded-xl",
        "bg-white border border-[#4E4631]/15 text-[#2E3A24]",
        "text-sm transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-[#6A7B4D]/30 focus:border-[#6A7B4D]",
        "placeholder:text-[#5A6B50]/50",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#ECEEE2]",
        error && "border-[#D4183D] focus:ring-[#D4183D]/25 focus:border-[#D4183D]",
        className
      )}
      {...props}
    />
        {error && <p className="mt-1.5 text-xs text-[#D4183D]">{error}</p>}
      </div>;
  }
);
Input.displayName = "Input";
export {
  Input
};
