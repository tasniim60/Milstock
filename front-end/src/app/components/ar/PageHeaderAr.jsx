import { clsx } from "clsx";
import { Button } from "../Button";
const PageHeaderAr = ({
  title,
  subtitle,
  action,
  actions,
  badge,
  className
}) => {
  const headerActions = actions || (action ? [action] : []);
  return <div dir="rtl" className={clsx("mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="text-right flex-1 min-w-0">
        <div className="flex items-start gap-3 justify-start mb-1">
          <h1 className="text-[#2E3A24] whitespace-normal break-words leading-tight">{title}</h1>
          {badge && badge}
        </div>
        {subtitle && <p className="text-sm text-muted-foreground leading-6 break-words">{subtitle}</p>}
      </div>
      {headerActions.length > 0 && <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
        {headerActions.map((item) => <Button
          key={item.label}
          variant={item.variant || "primary"}
          onClick={item.onClick}
          disabled={item.disabled}
          className="flex items-center gap-2 flex-row-reverse"
        >
          {item.icon && <item.icon className="w-4 h-4" />}
          {item.label}
        </Button>)}
      </div>}
    </div>;
};
export {
  PageHeaderAr
};
