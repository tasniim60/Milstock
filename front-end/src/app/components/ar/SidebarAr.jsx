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
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  MapPin,
  Calendar,
  Shield,
  Clock,
  Menu,
  X,
  Globe
} from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "../BrandLogo";
import { clearStoredAuth } from "../../lib/auth";
import { useNotifications } from "../../context/NotificationContext";
const adminNavGroups = [
  {
    label: "\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
    items: [
      { label: "\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645", path: "/ar/admin/dashboard", icon: LayoutDashboard }
    ]
  },
  {
    label: "\u0627\u0644\u0645\u062E\u0632\u0648\u0646",
    items: [
      {
        label: "\u0627\u0644\u0645\u062E\u0632\u0648\u0646",
        path: "/ar/admin/inventory",
        icon: Package,
        children: [
          { label: "\u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0635\u0646\u0627\u0641", path: "/ar/admin/inventory", icon: Package },
          { label: "\u0625\u0636\u0627\u0641\u0629 \u0635\u0646\u0641", path: "/ar/admin/inventory/add", icon: Package },
          { label: "\u0633\u062C\u0644 \u0627\u0644\u062D\u0631\u0643\u0629", path: "/ar/admin/inventory/logs", icon: Clock },
          { label: "\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u0627\u0633\u062A\u0647\u0644\u0627\u0643", path: "/ar/admin/consumptions", icon: FileText },
          { label: "\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629", path: "/ar/admin/inventory/expiration", icon: Calendar },
          { label: "\u0627\u0644\u0645\u0633\u062A\u0648\u062F\u0639\u0627\u062A", path: "/ar/admin/inventory/warehouses", icon: MapPin }
        ]
      }
    ]
  },
  {
    label: "\u0627\u0644\u0639\u0645\u0644\u064A\u0627\u062A",
    items: [
      { label: "\u0627\u0644\u0637\u0644\u0628\u0627\u062A", path: "/ar/admin/requests", icon: FileText, badge: 12 },
      { label: "\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A", path: "/ar/admin/notifications", icon: Bell, badge: 5 }
    ]
  },
  {
    label: "\u0627\u0644\u062A\u062D\u0644\u064A\u0644\u0627\u062A",
    items: [
      {
        label: "\u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631",
        path: "/ar/admin/reports",
        icon: BarChart3,
        children: [
          { label: "\u0627\u0644\u062A\u062D\u0644\u064A\u0644\u0627\u062A", path: "/ar/admin/reports", icon: BarChart3 },
          { label: "\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0647\u062F\u0631", path: "/ar/admin/waste-analysis", icon: BarChart3 },
          { label: "\u0633\u062C\u0644 \u0627\u0644\u0639\u0645\u0644\u064A\u0627\u062A", path: "/ar/admin/audit-logs", icon: Shield }
        ]
      }
    ]
  },
  {
    label: "\u0627\u0644\u0625\u062F\u0627\u0631\u0629",
    items: [
      { label: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646", path: "/ar/admin/users", icon: Users },
      { label: "\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645", path: "/ar/admin/settings", icon: Settings }
    ]
  }
];
const userNavGroups = [
  {
    label: "\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
    items: [
      { label: "\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645", path: "/ar/user/dashboard", icon: LayoutDashboard }
    ]
  },
  {
    label: "\u0627\u0644\u0645\u062E\u0632\u0648\u0646",
    items: [
      { label: "\u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u0645\u062A\u0627\u062D", path: "/ar/user/inventory", icon: Package },
      { label: "\u0627\u0644\u0627\u0633\u062A\u0647\u0644\u0627\u0643", path: "/ar/user/consumptions", icon: FileText },
      { label: "\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0647\u062F\u0631", path: "/ar/user/waste-analysis", icon: BarChart3 }
    ]
  },
  {
    label: "\u0627\u0644\u0637\u0644\u0628\u0627\u062A",
    items: [
      { label: "\u0637\u0644\u0628\u0627\u062A\u064A", path: "/ar/user/requests", icon: FileText },
      { label: "\u0625\u0646\u0634\u0627\u0621 \u0637\u0644\u0628", path: "/ar/user/requests/create", icon: FileText }
    ]
  },
  {
    label: "\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A",
    items: [
      { label: "\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A", path: "/ar/user/notifications", icon: Bell, badge: 3 }
    ]
  }
];
const supplierNavGroups = [
  {
    label: "\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
    items: [
      { label: "\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645", path: "/ar/supplier/dashboard", icon: LayoutDashboard },
      { label: "\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0645\u0648\u0631\u062F", path: "/ar/supplier/orders", icon: FileText },
      { label: "\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A", path: "/ar/supplier/notifications", icon: Bell, badge: 3 }
    ]
  }
];
const SidebarAr = ({ userRole }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState([]);
  const { unreadCount } = useNotifications();
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
      "h-screen bg-[#2E3A24] text-[#E0E1B7] flex flex-col border-l border-white/[0.06]",
      "transition-all duration-300 ease-in-out relative",
      collapsed ? "w-[72px]" : "w-[256px]"
    )}
  >
      {
    /* Brand */
  }
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.06] flex-shrink-0">
        {
    /* RTL: Logo first (→ RIGHT/leading in RTL), collapse button second (→ LEFT/trailing in RTL) */
  }
        {!collapsed && <BrandLogo
    className="text-right"
    subtitle={userRole === "admin" ? "Admin Portal" : userRole === "supplier" ? "supplier Portal" : "Kitchen Portal"}
  />}
        {!collapsed && <button
    onClick={() => setCollapsed(true)}
    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
    aria-label="Collapse sidebar"
  >
            <ChevronLeft className="w-4 h-4" />
          </button>}
        {collapsed && <>
            <BrandLogo compact className="mx-auto" />
            {
    /* Expand button: protrudes to the LEFT (facing content area) */
  }
            <button
    onClick={() => setCollapsed(false)}
    className="absolute -left-3 top-[30px] w-6 h-6 bg-[#4B5B3A] rounded-full flex items-center justify-center shadow-md border border-white/10 hover:bg-[#6A7B4D] transition-colors z-10"
    aria-label="Expand sidebar"
  >
              <ChevronRight className="w-3 h-3 text-white" />
            </button>
          </>}
      </div>

      {
    /* Navigation */
  }
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-hide">
        {navGroups.map((group) => <div key={group.label} className="mb-3">
            {
    /* Group label */
  }
            {!collapsed && <p className="text-[10px] font-semibold text-[#E0E1B7]/40 tracking-widest uppercase px-3 py-1.5 mb-1 text-right">
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
      /* Active indicator bar — RTL: left side (facing content) */
    }
                    {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#6A7B4D] rounded-r-full" />}

                    {
      /* Icon always on the right side in RTL */
    }
                    <item.icon
      className={clsx(
        "w-[18px] h-[18px] flex-shrink-0 transition-colors",
        active ? "text-[#6A7B4D]" : "text-[#E0E1B7]/50 group-hover:text-[#E0E1B7]/80"
      )}
    />

                    {!collapsed && <>
                        <span className="flex-1 text-sm font-medium text-right">{item.label}</span>
                        {item.children && <ChevronDown
      className={clsx(
        "w-3.5 h-3.5 text-[#E0E1B7]/40 transition-transform duration-200",
        expanded && "rotate-180"
      )}
    />}
                        {item.badge !== void 0 && <span className="ms-auto px-1.5 py-0.5 bg-[#D4183D] text-white text-[10px] font-bold rounded-md leading-none">
                            {item.badge}
                          </span>}
                      </>}
                    {collapsed && item.badge !== void 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D4183D] rounded-full" />}
                  </Link>

                  {
      /* Submenu */
    }
                  {item.children && expanded && !collapsed && <div className="mt-0.5 mb-1 mr-3 pr-3 border-r border-white/[0.08] space-y-0.5">
                      {item.children.map((child) => <Link
      key={child.path}
      to={child.path}
      className={clsx(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 text-sm",
        isActive(child.path) ? "bg-[#4B5B3A]/50 text-white" : "text-[#E0E1B7]/60 hover:bg-white/[0.05] hover:text-[#E0E1B7]/90"
      )}
    >
                          <child.icon className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                          <span className="flex-1 text-right">{child.label}</span>
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
    to="/ar/profile"
    title={collapsed ? "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A" : void 0}
    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#E0E1B7]/70 hover:bg-white/[0.06] hover:text-[#E0E1B7] transition-colors"
  >
          <User className="w-[18px] h-[18px] flex-shrink-0 opacity-60" />
          {!collapsed && <span className="flex-1 text-sm text-right">الملف الشخصي</span>}
        </Link>
        <Link
    to={userRole === "admin" ? "/admin/dashboard" : userRole === "supplier" ? "/supplier/dashboard" : "/user/dashboard"}
    title={collapsed ? "English" : void 0}
    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#C9A961] hover:bg-[#C9A961]/10 transition-colors"
  >
          <Globe className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span className="flex-1 text-sm font-medium text-right">English</span>}
        </Link>
        <Link
    to="/ar/login"
    onClick={clearStoredAuth}
    title={collapsed ? "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C" : void 0}
    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#E0E1B7]/60 hover:bg-[#D4183D]/15 hover:text-[#ff8a80] transition-colors"
  >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span className="flex-1 text-sm text-right">تسجيل الخروج</span>}
        </Link>
      </div>
    </div>;
};
const MobileNavAr = ({ userRole }) => {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const baseNavGroups = userRole === "admin" ? adminNavGroups : userRole === "supplier" ? supplierNavGroups : userNavGroups;
  const navGroups = baseNavGroups.map((group) => ({
    ...group,
    items: group.items.map((item) => item.path?.includes("notifications") ? { ...item, badge: unreadCount || void 0 } : item),
  }));
  const allNavPaths = navGroups.flatMap((group) => group.items.flatMap((item) => [item.children ? item.children[0].path : item.path, ...(item.children?.map((child) => child.path) || [])]));
  const activePath = allNavPaths
    .filter((path) => location.pathname === path || location.pathname.startsWith(path + "/"))
    .sort((a, b) => b.length - a.length)[0] || "";
  const isActive = (path) => path === activePath;
  const allItems = navGroups.flatMap((g) => g.items);
  const bottomItems = allItems.slice(0, 5).map((item) => ({
    label: item.label,
    path: item.children ? item.children[0].path : item.path,
    icon: item.icon,
    badge: item.badge
  }));
  return <>
      {
    /* Mobile top bar */
  }
      <div dir="rtl" className="lg:hidden fixed top-0 right-0 left-0 z-50 h-14 bg-[#2E3A24] text-[#E0E1B7] border-b border-white/[0.08] px-3 flex items-center justify-between gap-3">
        <button
    onClick={() => setDrawerOpen(true)}
    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-lg transition-colors"
    aria-label="فتح القائمة"
  >
          <Menu className="w-5 h-5" />
        </button>
        <BrandLogo
    subtitle={userRole === "admin" ? "Admin" : userRole === "supplier" ? "supplier" : "Kitchen"}
    className="absolute left-1/2 top-1/2 min-w-0 -translate-x-1/2 -translate-y-1/2 text-left [&>div:first-child]:w-7 [&>div:first-child]:h-7 [&_p:first-child]:text-sm [&_p:last-child]:text-[9px]"
  />
        <Link
    to={userRole === "admin" ? "/ar/admin/notifications" : userRole === "supplier" ? "/ar/supplier/notifications" : "/ar/user/notifications"}
    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-white/10 transition-colors"
  >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && <span className="absolute -top-1 -left-1 min-w-4 h-4 px-1 bg-[#D4183D] text-white text-[10px] leading-4 text-center rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>}
        </Link>
      </div>

      {
    /* Drawer */
  }
      {drawerOpen && <div dir="rtl" className="lg:hidden fixed inset-0 z-50">
          <div
    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
    onClick={() => setDrawerOpen(false)}
  />
          <div className="absolute right-0 top-0 h-full w-[min(22rem,calc(100vw-1rem))] bg-[#2E3A24] text-[#E0E1B7] overflow-y-auto flex flex-col shadow-2xl">
            <div className="min-h-16 flex items-center justify-between gap-3 px-4 border-b border-white/[0.08]">
              <BrandLogo
    subtitle={userRole === "admin" ? "Admin Portal" : userRole === "supplier" ? "supplier Portal" : "Kitchen Portal"}
    className="min-w-0 flex-row-reverse text-right [&>div:first-child]:w-8 [&>div:first-child]:h-8"
  />
              <button
    onClick={() => setDrawerOpen(false)}
    className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
    aria-label="إغلاق القائمة"
  >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {navGroups.map((group) => <div key={group.label} className="mb-3">
                  <p className="text-[10px] font-semibold text-[#E0E1B7]/40 tracking-widest uppercase px-3 pt-3 pb-1.5 text-right">
                    {group.label}
                  </p>
                  {group.items.map((item) => <Link
    key={item.path}
    to={item.children ? item.children[0].path : item.path}
    onClick={() => setDrawerOpen(false)}
    className={clsx(
      "flex items-center justify-between gap-3 px-3 py-3 rounded-xl transition-all min-h-11",
      isActive(item.children ? item.children[0].path : item.path) ? "bg-[#4B5B3A]/60 text-white" : "text-[#E0E1B7]/70 hover:bg-white/[0.06]"
    )}
  >
                      <span className="min-w-0 flex flex-1 items-center gap-3">
                        <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                        <span className="min-w-0 flex-1 text-sm font-medium text-right leading-5">{item.label}</span>
                      </span>
                      {item.badge !== void 0 && <span className="flex-shrink-0 px-1.5 py-0.5 bg-[#D4183D] text-white text-[10px] font-bold rounded-md leading-none">
                          {item.badge}
                        </span>}
                    </Link>)}
                </div>)}
            </nav>
            <div className="p-3 border-t border-white/[0.06] space-y-1">
              <Link to="/ar/profile" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-[#E0E1B7]/70 hover:bg-white/[0.06]">
                <User className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="min-w-0 flex-1 text-sm text-right">الملف الشخصي</span>
              </Link>
              <Link to={userRole === "admin" ? "/admin/dashboard" : userRole === "supplier" ? "/supplier/dashboard" : "/user/dashboard"} onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-[#C9A961] hover:bg-[#C9A961]/10">
                <Globe className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="min-w-0 flex-1 text-sm font-medium text-right">English</span>
              </Link>
              <Link to="/ar/login" onClick={() => { clearStoredAuth(); setDrawerOpen(false); }} className="flex items-center gap-3 px-3 py-3 rounded-xl text-[#E0E1B7]/60 hover:bg-[#D4183D]/15">
                <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="min-w-0 flex-1 text-sm text-right">تسجيل الخروج</span>
              </Link>
            </div>
          </div>
        </div>}

      {
    /* Bottom tab bar */
  }
      <div dir="rtl" className="lg:hidden fixed bottom-0 right-0 left-0 z-40 bg-[#2E3A24] text-[#E0E1B7] border-t border-white/[0.08] safe-area-pb">
        <div className="flex items-stretch justify-around gap-1 px-1 py-1">
          {bottomItems.map((item) => {
    const active = isActive(item.path);
    return <Link
      key={item.path}
      to={item.path}
      className={clsx(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1.5 py-2 rounded-xl transition-colors relative",
        active ? "text-white" : "text-[#E0E1B7]/50 hover:text-[#E0E1B7]/80"
      )}
    >
                <div className={clsx(
      "p-1.5 rounded-lg transition-colors",
      active ? "bg-[#4B5B3A]" : ""
    )}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-[9px] truncate max-w-full text-center leading-tight">{item.label}</span>
                {item.badge && <span className="absolute top-1 left-2 w-2 h-2 bg-[#D4183D] rounded-full" />}
              </Link>;
  })}
        </div>
      </div>
    </>;
};
export {
  MobileNavAr,
  SidebarAr
};
