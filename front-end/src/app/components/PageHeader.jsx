import { Button } from "./Button";
const PageHeader = ({ title, subtitle, action, actions, badge }) => {
  const headerActions = actions || (action ? [action] : []);
  return <div className="mb-8 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-[#2E3A24] truncate">{title}</h1>
          {badge && badge}
        </div>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {headerActions.length > 0 && <div className="flex flex-wrap items-center justify-end gap-2 flex-shrink-0">
        {headerActions.map((item) => <Button
          key={item.label}
          variant={item.variant || "primary"}
          onClick={item.onClick}
          disabled={item.disabled}
          className="flex items-center gap-2"
        >
          {item.icon && <item.icon className="w-4 h-4" />}
          {item.label}
        </Button>)}
      </div>}
    </div>;
};
export {
  PageHeader
};
