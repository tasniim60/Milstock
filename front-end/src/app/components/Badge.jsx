import { clsx } from "clsx";
const Badge = ({ variant, children, className, size = "md" }) => {
  return <span
    className={clsx(
      "inline-flex items-center gap-1 rounded-lg font-medium tracking-wide",
      size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
      {
        "bg-[#5B8A4A]/12 text-[#3d6b2e] border border-[#5B8A4A]/20": variant === "success",
        "bg-[#B8862A]/12 text-[#8a6014] border border-[#B8862A]/20": variant === "warning",
        "bg-[#D4183D]/10 text-[#D4183D] border border-[#D4183D]/20": variant === "danger",
        "bg-[#6A7B4D]/12 text-[#4B5B3A] border border-[#6A7B4D]/20": variant === "info",
        "bg-[#4E4631]/10 text-[#4E4631] border border-[#4E4631]/15": variant === "pending",
        "bg-[#E0E1B7]/60 text-[#2E3A24] border border-[#4E4631]/12": variant === "neutral"
      },
      className
    )}
  >
      <span
    className={clsx("w-1.5 h-1.5 rounded-full flex-shrink-0", {
      "bg-[#5B8A4A]": variant === "success",
      "bg-[#B8862A]": variant === "warning",
      "bg-[#D4183D]": variant === "danger",
      "bg-[#6A7B4D]": variant === "info",
      "bg-[#4E4631]": variant === "pending",
      "bg-[#4B5B3A]": variant === "neutral"
    })}
  />
      {children}
    </span>;
};
export {
  Badge
};
