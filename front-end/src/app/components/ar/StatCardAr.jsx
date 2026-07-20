import { clsx } from "clsx";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router";
const colorConfig = {
  primary: {
    iconBg: "bg-[#6A7B4D]/12",
    iconColor: "text-[#6A7B4D]",
    accent: "border-r-[#6A7B4D]"
  },
  warning: {
    iconBg: "bg-[#B8862A]/12",
    iconColor: "text-[#B8862A]",
    accent: "border-r-[#B8862A]"
  },
  danger: {
    iconBg: "bg-[#D4183D]/10",
    iconColor: "text-[#D4183D]",
    accent: "border-r-[#D4183D]"
  },
  success: {
    iconBg: "bg-[#5B8A4A]/12",
    iconColor: "text-[#5B8A4A]",
    accent: "border-r-[#5B8A4A]"
  }
};
const StatCardAr = ({
  title,
  value,
  icon: Icon,
  trend,
  color = "primary",
  to,
  onClick
}) => {
  const config = colorConfig[color];
  const navigate = useNavigate();
  const clickable = Boolean(to || onClick);
  const activate = () => {
    if (onClick) onClick();
    else if (to) navigate(to);
  };
  const handleKeyDown = (event) => {
    if (!clickable) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate();
    }
  };
  return <div
    role={clickable ? "button" : void 0}
    tabIndex={clickable ? 0 : void 0}
    onClick={clickable ? activate : void 0}
    onKeyDown={handleKeyDown}
    className={clsx(
      "bg-card rounded-2xl border border-border shadow-sm p-5",
      "border-r-4 hover:shadow-md transition-all duration-200",
      clickable && "cursor-pointer hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#6A7B4D]/30",
      config.accent
    )}
  >
      {
    /* Top row — RTL: icon on left (trailing), text on right (leading) */
  }
      <div dir="rtl" className="flex items-start justify-between mb-4">
        <p className="text-sm text-muted-foreground leading-snug text-right pl-2">{title}</p>
        <div className={clsx("p-2.5 rounded-xl flex-shrink-0", config.iconBg)}>
          <Icon className={clsx("w-5 h-5", config.iconColor)} />
        </div>
      </div>

      {
    /* Value */
  }
      <p className="text-3xl font-bold text-[#2E3A24] mb-3 tracking-tight text-right">{value}</p>

      {
    /* Trend */
  }
      {trend && <div className="flex items-center gap-1.5 justify-end">
          {trend.isPositive ? <TrendingUp className="w-3.5 h-3.5 text-[#5B8A4A]" /> : <TrendingDown className="w-3.5 h-3.5 text-[#D4183D]" />}
          <span
    className={clsx(
      "text-xs font-medium",
      trend.isPositive ? "text-[#5B8A4A]" : "text-[#D4183D]"
    )}
  >
            {trend.value}
          </span>
        </div>}
    </div>;
};
export {
  StatCardAr
};
