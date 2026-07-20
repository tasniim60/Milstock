import { Button } from "./Button";
import { clsx } from "clsx";
const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  className
}) => {
  return <div
    className={clsx(
      "flex flex-col items-center justify-center text-center px-6",
      compact ? "py-10" : "py-20",
      className
    )}
  >
      <div className="p-5 bg-[#4B5B3A]/8 rounded-2xl border border-[#4B5B3A]/12 mb-5 inline-flex">
        <Icon className="w-10 h-10 text-[#4B5B3A]/60" />
      </div>
      <h3 className="text-[#2E3A24] mb-2">{title}</h3>
      <p className="text-[#5A6B50] max-w-sm leading-relaxed mb-6">{description}</p>
      {action && <Button onClick={action.onClick} className="flex items-center gap-2">
          {action.icon && <action.icon className="w-4 h-4" />}
          {action.label}
        </Button>}
    </div>;
};
export {
  EmptyState
};
