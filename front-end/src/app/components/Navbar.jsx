import { Link, useLocation, useNavigate } from "react-router";
import { useState } from "react";
import { Bell, ChevronDown, Globe, LogOut, Repeat, User } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { clearStoredAuth } from "../lib/auth";

const pageTitleMap = {
  "/admin/dashboard": "Command Dashboard",
  "/admin/inventory": "Inventory Management",
  "/admin/inventory/add": "Add Inventory Item",
  "/admin/inventory/logs": "Movement Logs",
  "/admin/inventory/expiration": "Expiration Monitor",
  "/admin/inventory/warehouses": "Warehouse Locations",
  "/admin/requests": "Request Management",
  "/admin/requests/pending": "Pending Approvals",
  "/admin/notifications": "Notifications",
  "/admin/reports": "Reports & Analytics",
  "/admin/audit-logs": "Audit Logs",
  "/admin/users": "User Management",
  "/admin/settings": "System Settings",
  "/admin/consumptions": "Consumption Monitor",
  "/admin/waste-analysis": "Waste Analysis",
  "/admin/profile": "My Profile",
  "/admin/help": "Help Center",
  "/user/dashboard": "Kitchen Dashboard",
  "/user/inventory": "Available Stock",
  "/user/consumptions": "Consumption",
  "/user/consumptions/new": "Record Consumption",
  "/user/waste-analysis": "Waste Analysis",
  "/user/requests": "My Requests",
  "/user/requests/create": "Create Request",
  "/user/notifications": "Notifications",
  "/supplier/dashboard": "Supplier Dashboard",
  "/supplier/orders": "Supplier Orders",
  "/supplier/notifications": "Notifications",
  "/profile": "My Profile",
  "/help": "Help Center",
};

const subtitleMap = {
  "/admin/dashboard": "Overview of inventory operations",
  "/admin/inventory": "Manage all stock items",
  "/admin/reports": "Analytics and reporting",
  "/admin/consumptions": "Monitor consumption across warehouses",
  "/admin/waste-analysis": "Analyze expired and damaged stock waste",
  "/user/dashboard": "Monitor your kitchen supply",
  "/user/consumptions": "Track consumption from your assigned warehouse",
  "/user/consumptions/new": "Record stock used by your unit",
  "/user/waste-analysis": "Analyze expired and damaged stock waste",
};

const getRoleText = (userRole) => {
  if (userRole === "admin") return { title: "Admin", subtitle: "Administrator" };
  if (userRole === "supplier") return { title: "Supplier", subtitle: "Supplier Portal" };
  return { title: "Kitchen User", subtitle: "Requester" };
};

const Navbar = ({ userRole }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const title = pageTitleMap[location.pathname] ?? "MilStock";
  const subtitle = subtitleMap[location.pathname];
  const notifPath = userRole === "admin" ? "/admin/notifications" : userRole === "supplier" ? "/supplier/notifications" : "/user/notifications";
  const arPath = userRole === "admin" ? "/ar/admin/dashboard" : userRole === "supplier" ? "/ar/supplier/dashboard" : "/ar/user/dashboard";
  const roleText = getRoleText(userRole);

  const requireLoginForSwitch = () => {
    clearStoredAuth();
    navigate("/login", { replace: true });
  };

  return <div className="h-16 bg-white border-b border-[#4E4631]/10 px-6 flex items-center justify-between gap-4 sticky top-0 z-10 shadow-[0_1px_3px_rgba(46,58,36,0.06)]">
    <div className="min-w-0">
      <h2 className="text-[#2E3A24] leading-none truncate">{title}</h2>
      {subtitle && <p className="text-xs text-[#5A6B50] mt-0.5">{subtitle}</p>}
    </div>

    <div className="flex items-center gap-2 flex-shrink-0">
      <Link
        to={arPath}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#4B5B3A]/20 text-[#4B5B3A] hover:bg-[#4B5B3A]/8 transition-colors"
      >
        <Globe className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">العربية</span>
      </Link>

      <Link
        to={notifPath}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#4B5B3A]/8 transition-colors text-[#4E4631]"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-[#D4183D] text-white text-[10px] leading-4 text-center rounded-full ring-2 ring-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>}
      </Link>

      <div className="relative">
        <button
          type="button"
          onClick={() => setUserMenuOpen((open) => !open)}
          className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg hover:bg-[#4B5B3A]/8 transition-colors border-l border-[#4E4631]/10"
          aria-haspopup="menu"
          aria-expanded={userMenuOpen}
        >
          <div className="w-7 h-7 rounded-lg bg-[#6A7B4D] flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-[#2E3A24] leading-none">{roleText.title}</p>
            <p className="text-[10px] text-[#5A6B50] mt-0.5">{roleText.subtitle}</p>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-[#5A6B50] hidden sm:block transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
        </button>

        {userMenuOpen && <div role="menu" className="absolute right-0 mt-2 w-56 rounded-xl border border-[#4E4631]/10 bg-white p-2 shadow-lg z-30">
          <Link
            to="/profile"
            onClick={() => setUserMenuOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#2E3A24] hover:bg-[#ECEEE2]"
          >
            <User className="w-4 h-4 text-[#5A6B50]" />
            Profile
          </Link>
          <button
            type="button"
            onClick={requireLoginForSwitch}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#2E3A24] hover:bg-[#ECEEE2]"
          >
            <Repeat className="w-4 h-4 text-[#5A6B50]" />
            Switch user
          </button>
          <button
            type="button"
            onClick={requireLoginForSwitch}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#8A1F11] hover:bg-[#D4183D]/10"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>}
      </div>
    </div>
  </div>;
};

export {
  Navbar
};
