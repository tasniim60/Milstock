import { clsx } from "clsx";
const Card = ({ children, className, padding = true, ...props }) => {
  return <div
    className={clsx(
      "bg-card rounded-2xl border border-border shadow-sm",
      padding && "p-5 sm:p-6",
      className
    )}
    {...props}
  >
      {children}
    </div>;
};
const CardHeader = ({
  children,
  className
}) => {
  return <div
    className={clsx(
      "mil-card-header mb-5 pb-4 border-b border-border flex items-center justify-between gap-3",
      className
    )}
  >
      {children}
    </div>;
};
const CardTitle = ({
  children,
  className
}) => {
  return <h3
    className={clsx(
      "text-[#2E3A24]",
      className
    )}
  >
      {children}
    </h3>;
};
const CardContent = ({
  children,
  className
}) => {
  return <div className={clsx(className)}>{children}</div>;
};
export {
  Card,
  CardContent,
  CardHeader,
  CardTitle
};
