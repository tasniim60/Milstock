import { Link, useLocation } from "react-router";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Package,
  FileText,
  Bell,
  BarChart3,
  Users,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Shield,
  Clock,
  Globe,
  ChevronDown
} from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { clearStoredAuth } from "../lib/auth";
import { useNotifications } from "../context/NotificationContext";
const adminNavGroups = [
  {
    label: "MAIN",
    items: [
      { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard }
    ]
  },
  {
    label: "INVENTORY",
    items: [
      {
        label: "Inventory",
        path: "/admin/inventory",
        icon: Package,
        children: [
          { label: "All Items", path: "/admin/inventory", icon: Package },
          { label: "Add Item", path: "/admin/inventory/add", icon: Package },
          { label: "Movement Logs", path: "/admin/inventory/logs", icon: Clock },
          { label: "Consumption Monitor", path: "/admin/consumptions", icon: FileText },
          { label: "Expiration Monitor", path: "/admin/inventory/expiration", icon: Calendar },
          { label: "Warehouses", path: "/admin/inventory/warehouses", icon: MapPin }
        ]
      }
    ]
  },
  {
    label: "OPERATIONS",
    items: [
      { label: "Requests", path: "/admin/requests", icon: FileText, badge: 12 },
      { label: "Notifications", path: "/admin/notifications", icon: Bell, badge: 5 }
    ]
  },
  {
    label: "ANALYTICS",
    items: [
      {
        label: "Reports",
        path: "/admin/reports",
        icon: BarChart3,
        children: [
          { label: "Analytics", path: "/admin/reports", icon: BarChart3 },
          { label: "Waste Analysis", path: "/admin/waste-analysis", icon: BarChart3 },
          { label: "Audit Logs", path: "/admin/audit-logs", icon: Shield }
        ]
      }
    ]
  },
  {
    label: "ADMINISTRATION",
    items: [
      { label: "User Management", path: "/admin/users", icon: Users },
      { label: "System Settings", path: "/admin/settings", icon: Settings }
    ]
  }
];
const userNavGroups = [
  {
    label: "MAIN",
    items: [
      { label: "Dashboard", path: "/user/dashboard", icon: LayoutDashboard }
    ]
  },
  {
    label: "INVENTORY",
    items: [
      { label: "Available Stock", path: "/user/inventory", icon: Package },
      { label: "Consumption", path: "/user/consumptions", icon: FileText },
      { label: "Waste Analysis", path: "/user/waste-analysis", icon: BarChart3 }
    ]
  },
  {
    label: "REQUESTS",
    items: [
      { label: "My Requests", path: "/user/requests", icon: FileText },
      { label: "Create Request", path: "/user/requests/create", icon: FileText }
    ]
  },
  {
    label: "NOTIFICATIONS",
    items: [
      { label: "Notifications", path: "/user/notifications", icon: Bell, badge: 3 }
    ]
  }
];
const supplierNavGroups = [
  {
    label: "MAIN",
    items: [
      { label: "Dashboard", path: "/supplier/dashboard", icon: LayoutDashboard },
      { label: "Orders", path: "/supplier/orders", icon: FileText },
      { label: "Notifications", path: "/supplier/notifications", icon: Bell, badge: 3 }
    ]
  }
];
const Sidebar = ({ userRole }) => {
  const location = useLocation();
  const { unreadCount } = useNotifications();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState([]);
  const baseNavGroups = userRole === "admin" ? adminNavGroups : userRole === "supplier" ? supplierNavGroups : userNavGroups;
  const navGroups = baseNavGroups.map((group) => ({
    ...group,
    items: group.items.map((item) => item.path?.includes("notifications") ? { ...item, badge: unreadCount || void 0 } : item),
  }));
  const toggleExpand = (path) => {
    setExpandedItems(
      (prev) => prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };
  const allNavPaths = navGroups.flatMap((group) => group.items.flatMap((item) => [item.path, ...(item.children?.map((child) => child.path) || [])]));
  const activePath = allNavPaths
    .filter((path) => location.pathname === path || location.pathname.startsWith(path + "/"))
    .sort((a, b) => b.length - a.length)[0] || "";
  const isActive = (path) => path === activePath;
  const isGroupActive = (item) => isActive(item.path) || (item.children?.some((c) => isActive(c.path)) ?? false);
  return <div
    className={clsx(
      "h-screen bg-[#2E3A24] text-[#E0E1B7] flex flex-col border-r border-white/[0.06]",
      "transition-all duration-300 ease-in-out",
      collapsed ? "w-[72px]" : "w-[256px]"
    )}
  >
      {
    /* Brand */
  }
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.06] flex-shrink-0">
        {!collapsed && <BrandLogo subtitle={userRole === "admin" ? "Admin Portal" : userRole === "supplier" ? "supplier Portal" : "Kitchen Portal"} />}
        {collapsed && <BrandLogo compact className="mx-auto" />}
        {!collapsed && <button
    onClick={() => setCollapsed(true)}
    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
    aria-label="Collapse sidebar"
  >
            <ChevronLeft className="w-4 h-4" />
          </button>}
        {collapsed && <button
    onClick={() => setCollapsed(false)}
    className="absolute -right-3 top-[30px] w-6 h-6 bg-[#4B5B3A] rounded-full flex items-center justify-center shadow-md border border-white/10 hover:bg-[#6A7B4D] transition-colors z-10"
    aria-label="Expand sidebar"
  >
            <ChevronRight className="w-3 h-3 text-white" />
          </button>}
      </div>

      {
    /* Navigation */
  }
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-hide">
        {navGroups.map((group) => <div key={group.label} className="mb-3">
            {
    /* Group label */
  }
            {!collapsed && <p className="text-[10px] font-semibold text-[#E0E1B7]/40 tracking-widest uppercase px-3 py-1.5 mb-1">
                {group.label}
              </p>}
            {collapsed && <div className="h-px bg-white/[0.06] mx-2 my-2" />}

            {group.items.map((item) => {
    const active = isGroupActive(item);
    const expanded = expandedItems.includes(item.path);
    return <div key={item.path}>
                  <Link
      to={item.children ? "#" : item.path}
      onClick={(e) => {
        if (item.children) {
          e.preventDefault();
          toggleExpand(item.path);
        }
      }}
      title={collapsed ? item.label : void 0}
      className={clsx(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative",
        active ? "bg-[#4B5B3A]/60 text-white" : "text-[#E0E1B7]/70 hover:bg-white/[0.06] hover:text-[#E0E1B7]"
      )}
    >
                    {
      /* Active indicator bar */
    }
                    {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#6A7B4D] rounded-r-full" />}
                    <item.icon
      className={clsx(
        "w-[18px] h-[18px] flex-shrink-0 transition-colors",
        active ? "text-[#6A7B4D]" : "text-[#E0E1B7]/50 group-hover:text-[#E0E1B7]/80"
      )}
    />
                    {!collapsed && <>
                        <span className="flex-1 text-sm font-medium">{item.label}</span>
                        {item.badge !== void 0 && <span className="px-1.5 py-0.5 bg-[#D4183D] text-white text-[10px] font-bold rounded-md leading-none">
                            {item.badge}
                          </span>}
                        {item.children && <ChevronDown
      className={clsx(
        "w-3.5 h-3.5 text-[#E0E1B7]/40 transition-transform duration-200",
        expanded && "rotate-180"
      )}
    />}
                      </>}
                    {collapsed && item.badge !== void 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D4183D] rounded-full" />}
                  </Link>

                  {
      /* Submenu */
    }
                  {item.children && expanded && !collapsed && <div className="mt-0.5 mb-1 ml-3 pl-3 border-l border-white/[0.08] space-y-0.5">
                      {item.children.map((child) => <Link
      key={child.path}
      to={child.path}
      className={clsx(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 text-sm",
        isActive(child.path) ? "bg-[#4B5B3A]/50 text-white" : "text-[#E0E1B7]/60 hover:bg-white/[0.05] hover:text-[#E0E1B7]/90"
      )}
    >
                          <child.icon className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                          <span>{child.label}</span>
                        </Link>)}
                    </div>}
                </div>;
  })}
          </div>)}
      </nav>

      {
    /* Footer */
  }
      <div className="px-2 py-3 border-t border-white/[0.06] space-y-0.5 flex-shrink-0">
        <Link
    to="/profile"
    title={collapsed ? "Profile" : void 0}
    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#E0E1B7]/70 hover:bg-white/[0.06] hover:text-[#E0E1B7] transition-colors"
  >
          <User className="w-[18px] h-[18px] flex-shrink-0 opacity-60" />
          {!collapsed && <span className="text-sm">Profile</span>}
        </Link>
        <Link
    to={userRole === "admin" ? "/ar/admin/dashboard" : userRole === "supplier" ? "/ar/supplier/dashboard" : "/ar/user/dashboard"}
    title={collapsed ? "\u0627\u0644\u0639\u0631\u0628\u064A\u0629" : void 0}
    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#C9A961] hover:bg-[#C9A961]/10 transition-colors"
  >
          <Globe className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">العربية</span>}
        </Link>
        <Link
    to="/login"
    onClick={clearStoredAuth}
    title={collapsed ? "Logout" : void 0}
    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#E0E1B7]/60 hover:bg-[#D4183D]/15 hover:text-[#ff8a80] transition-colors"
  >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span className="text-sm">Logout</span>}
        </Link>
      </div>
    </div>;
};
export {
  Sidebar
};
