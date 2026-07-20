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
  MapPin,
  Calendar,
  Shield,
  HelpCircle,
  Clock,
  Menu,
  X,
  Globe
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
      { label: "Inventory", path: "/admin/inventory", icon: Package },
      { label: "Movement Logs", path: "/admin/inventory/logs", icon: Clock },
      { label: "Expiration", path: "/admin/inventory/expiration", icon: Calendar },
      { label: "Warehouses", path: "/admin/inventory/warehouses", icon: MapPin }
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
      { label: "Reports", path: "/admin/reports", icon: BarChart3 },
      { label: "Audit Logs", path: "/admin/audit-logs", icon: Shield }
    ]
  },
  {
    label: "ADMINISTRATION",
    items: [
      { label: "Users", path: "/admin/users", icon: Users },
      { label: "Settings", path: "/admin/settings", icon: Settings }
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
      { label: "Available Stock", path: "/user/inventory", icon: Package }
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
    label: "ALERTS",
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
const MobileNav = ({ userRole }) => {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const baseNavGroups = userRole === "admin" ? adminNavGroups : userRole === "supplier" ? supplierNavGroups : userNavGroups;
  const navGroups = baseNavGroups.map((group) => ({
    ...group,
    items: group.items.map((item) => item.path?.includes("notifications") ? { ...item, badge: unreadCount || void 0 } : item),
  }));
  const allNavPaths = navGroups.flatMap((group) => group.items.map((item) => item.path));
  const activePath = allNavPaths
    .filter((path) => location.pathname === path || location.pathname.startsWith(path + "/"))
    .sort((a, b) => b.length - a.length)[0] || "";
  const isActive = (path) => path === activePath;
  const allItems = navGroups.flatMap((g) => g.items);
  const bottomItems = allItems.slice(0, 5);
  return <>
      {
    /* Mobile top bar */
  }
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[#2E3A24] text-[#E0E1B7] border-b border-white/[0.08] px-4 flex items-center justify-between">
        <button
    onClick={() => setDrawerOpen(true)}
    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
  >
          <Menu className="w-5 h-5" />
        </button>
        <BrandLogo
    subtitle={userRole === "admin" ? "Admin" : userRole === "supplier" ? "supplier" : "Kitchen"}
    className="[&>div:first-child]:w-7 [&>div:first-child]:h-7"
  />
        <Link
    to={userRole === "admin" ? "/admin/notifications" : userRole === "supplier" ? "/supplier/notifications" : "/user/notifications"}
    className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
  >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-[#D4183D] text-white text-[10px] leading-4 text-center rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>}
        </Link>
      </div>

      {
    /* Drawer */
  }
      {drawerOpen && <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-72 bg-[#2E3A24] text-[#E0E1B7] h-full overflow-y-auto flex flex-col shadow-2xl">
            <div className="h-14 flex items-center justify-between px-4 border-b border-white/[0.08]">
              <BrandLogo
    subtitle={userRole === "admin" ? "Admin Portal" : userRole === "supplier" ? "supplier Portal" : "Kitchen Portal"}
    className="[&>div:first-child]:w-7 [&>div:first-child]:h-7"
  />
              <button
    onClick={() => setDrawerOpen(false)}
    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
  >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-0.5">
              {navGroups.map((group) => <div key={group.label} className="mb-3">
                  <p className="text-[10px] font-semibold text-[#E0E1B7]/40 tracking-widest uppercase px-3 py-1.5">
                    {group.label}
                  </p>
                  {group.items.map((item) => <Link
    key={item.path}
    to={item.path}
    onClick={() => setDrawerOpen(false)}
    className={clsx(
      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
      isActive(item.path) ? "bg-[#4B5B3A]/60 text-white" : "text-[#E0E1B7]/70 hover:bg-white/[0.06]"
    )}
  >
                      <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                      <span className="flex-1 text-sm">{item.label}</span>
                      {item.badge !== void 0 && <span className="px-1.5 py-0.5 bg-[#D4183D] text-white text-[10px] rounded-md">
                          {item.badge}
                        </span>}
                    </Link>)}
                </div>)}
            </nav>
            <div className="p-3 border-t border-white/[0.06] space-y-0.5">
              <Link to="/profile" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#E0E1B7]/70 hover:bg-white/[0.06]">
                <User className="w-[18px] h-[18px]" />
                <span className="text-sm">Profile</span>
              </Link>
              <Link to="/help" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#E0E1B7]/70 hover:bg-white/[0.06]">
                <HelpCircle className="w-[18px] h-[18px]" />
                <span className="text-sm">Help</span>
              </Link>
              <Link
    to={userRole === "admin" ? "/ar/admin/dashboard" : userRole === "supplier" ? "/ar/supplier/dashboard" : "/ar/user/dashboard"}
    onClick={() => setDrawerOpen(false)}
    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#C9A961] hover:bg-[#C9A961]/10"
  >
                <Globe className="w-[18px] h-[18px]" />
                <span className="text-sm">العربية</span>
              </Link>
              <Link to="/login" onClick={() => { clearStoredAuth(); setDrawerOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#E0E1B7]/60 hover:bg-[#D4183D]/15">
                <LogOut className="w-[18px] h-[18px]" />
                <span className="text-sm">Logout</span>
              </Link>
            </div>
          </div>
          <div
    className="flex-1 bg-black/50 backdrop-blur-sm"
    onClick={() => setDrawerOpen(false)}
  />
        </div>}

      {
    /* Bottom tab bar */
  }
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#2E3A24] text-[#E0E1B7] border-t border-white/[0.08]">
        <div className="flex items-center justify-around py-1">
          {bottomItems.map((item) => {
    const active = isActive(item.path);
    return <Link
      key={item.path}
      to={item.path}
      className={clsx(
        "flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-colors relative min-w-0",
        active ? "text-white" : "text-[#E0E1B7]/50 hover:text-[#E0E1B7]/80"
      )}
    >
                <div
      className={clsx(
        "p-1.5 rounded-lg transition-colors",
        active ? "bg-[#4B5B3A]" : ""
      )}
    >
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-[9px] truncate max-w-[48px] text-center leading-none">
                  {item.label}
                </span>
                {item.badge && <span className="absolute top-1 right-1 w-2 h-2 bg-[#D4183D] rounded-full" />}
              </Link>;
  })}
        </div>
      </div>
    </>;
};
export {
  MobileNav
};
