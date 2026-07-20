import { clsx } from "clsx";
const BrandLogo = ({
  compact = false,
  subtitle,
  textColor = "text-white",
  subtitleColor = "text-[#E0E1B7]/60",
  className
}) => <div className={clsx("flex items-center gap-2.5 min-w-0", className)}>
    <div
  className={clsx(
    "rounded-lg bg-black/15 flex items-center justify-center flex-shrink-0 overflow-hidden",
    compact ? "w-8 h-8" : "w-11 h-11"
  )}
>
      <img src="/milstock-logo.png" alt="MilStock logo" className="w-full h-full object-contain p-0.5" />
    </div>
    {!compact && <div className="min-w-0">
        <p className={clsx("font-bold tracking-wider leading-none truncate", textColor)}>MilStock</p>
        {subtitle && <p className={clsx("text-[10px] mt-1 truncate", subtitleColor)}>{subtitle}</p>}
      </div>}
  </div>;
export {
  BrandLogo
};
