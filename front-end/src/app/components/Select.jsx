import { forwardRef } from "react";
import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";
const Select = forwardRef(
  ({ label, error, options, className, ...props }, ref) => {
    return <div className="w-full">
        {label && <label className="block mb-1.5 text-sm font-medium text-[#2E3A24]">
            {label}
          </label>}
        <div className="relative">
          <select
      ref={ref}
      className={clsx(
        "w-full px-4 py-2.5 pr-10 rounded-xl",
        "bg-white border border-[#4E4631]/15 text-[#2E3A24]",
        "text-sm transition-all duration-200 appearance-none cursor-pointer",
        "focus:outline-none focus:ring-2 focus:ring-[#6A7B4D]/30 focus:border-[#6A7B4D]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        error && "border-[#D4183D] focus:ring-[#D4183D]/25",
        className
      )}
      {...props}
    >
            {options.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6B50] pointer-events-none" />
        </div>
        {error && <p className="mt-1.5 text-xs text-[#D4183D]">{error}</p>}
      </div>;
  }
);
Select.displayName = "Select";
export {
  Select
};
