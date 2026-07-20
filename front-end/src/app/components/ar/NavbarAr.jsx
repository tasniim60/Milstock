import { Link, useLocation, useNavigate } from "react-router";
import { useState } from "react";
import { Bell, ChevronDown, Globe, LogOut, Repeat, User } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import { clearStoredAuth } from "../../lib/auth";

const pageTitleMap = {
  "/ar/admin/dashboard": "لوحة تحكم المسؤول",
  "/ar/admin/inventory": "إدارة المخزون",
  "/ar/admin/inventory/add": "إضافة صنف جديد",
  "/ar/admin/inventory/logs": "سجل الحركة",
  "/ar/admin/inventory/expiration": "متابعة الصلاحية",
  "/ar/admin/inventory/warehouses": "مواقع المستودعات",
  "/ar/admin/consumptions": "متابعة الاستهلاك",
  "/ar/admin/waste-analysis": "تحليل الهدر",
  "/ar/admin/requests": "إدارة الطلبات",
  "/ar/admin/requests/pending": "الطلبات المعلّقة",
  "/ar/admin/notifications": "الإشعارات",
  "/ar/admin/reports": "التقارير والتحليلات",
  "/ar/admin/audit-logs": "سجل العمليات",
  "/ar/admin/users": "إدارة المستخدمين",
  "/ar/admin/settings": "إعدادات النظام",
  "/ar/user/dashboard": "لوحة تحكم الوحدة",
  "/ar/user/inventory": "المخزون المتاح",
  "/ar/user/consumptions": "الاستهلاك",
  "/ar/user/consumptions/new": "تسجيل استهلاك",
  "/ar/user/waste-analysis": "تحليل الهدر",
  "/ar/user/requests": "طلباتي",
  "/ar/user/requests/create": "إنشاء طلب",
  "/ar/user/notifications": "الإشعارات",
  "/ar/supplier/dashboard": "لوحة تحكم المورد",
  "/ar/supplier/orders": "طلبات المورد",
  "/ar/supplier/notifications": "الإشعارات",
  "/ar/profile": "الملف الشخصي",
  "/ar/help": "مركز المساعدة",
};

const subtitleMap = {
  "/ar/admin/dashboard": "نظرة شاملة على عمليات المخزون",
  "/ar/admin/inventory": "إدارة جميع أصناف المخزون",
  "/ar/admin/reports": "التحليلات والتقارير",
  "/ar/admin/consumptions": "متابعة الاستهلاك عبر كل المخازن",
  "/ar/admin/waste-analysis": "تحليل الأصناف منتهية الصلاحية والتالفة",
  "/ar/user/dashboard": "متابعة إمدادات وحدتك",
  "/ar/user/consumptions": "متابعة الاستهلاك من المخزن المسؤول عنه",
  "/ar/user/consumptions/new": "تسجيل الكميات المستخدمة بواسطة الوحدة",
  "/ar/user/waste-analysis": "تحليل الأصناف منتهية الصلاحية والتالفة",
};

const getRoleText = (userRole) => {
  if (userRole === "admin") return { title: "مسؤول", subtitle: "مدير النظام" };
  if (userRole === "supplier") return { title: "مورد", subtitle: "بوابة المورد" };
  return { title: "مستخدم وحدة", subtitle: "مقدم طلب" };
};

const NavbarAr = ({ userRole }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const title = pageTitleMap[location.pathname] ?? "MilStock";
  const subtitle = subtitleMap[location.pathname];
  const notifPath = userRole === "admin" ? "/ar/admin/notifications" : userRole === "supplier" ? "/ar/supplier/notifications" : "/ar/user/notifications";
  const enPath = userRole === "admin" ? "/admin/dashboard" : userRole === "supplier" ? "/supplier/dashboard" : "/user/dashboard";
  const roleText = getRoleText(userRole);

  const requireLoginForSwitch = () => {
    clearStoredAuth();
    navigate("/ar/login", { replace: true });
  };

  return <div dir="rtl" className="min-h-16 bg-white border-b border-[#4E4631]/10 px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-10 shadow-[0_1px_3px_rgba(46,58,36,0.06)]">
    <div className="min-w-0 flex-1 text-right">
      <h2 className="text-[#2E3A24] leading-tight whitespace-normal break-words">{title}</h2>
      {subtitle && <p className="text-xs text-[#5A6B50] mt-0.5 leading-5 break-words">{subtitle}</p>}
    </div>

    <div className="flex items-center gap-2 flex-shrink-0">
      <div className="relative">
        <button
          type="button"
          onClick={() => setUserMenuOpen((open) => !open)}
          className="flex items-center gap-2 flex-row-reverse pl-3 pr-2 py-1.5 rounded-lg hover:bg-[#4B5B3A]/8 transition-colors border-l border-[#4E4631]/10"
          aria-haspopup="menu"
          aria-expanded={userMenuOpen}
        >
          <div className="w-7 h-7 rounded-lg bg-[#6A7B4D] flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-[#2E3A24] leading-none">{roleText.title}</p>
            <p className="text-[10px] text-[#5A6B50] mt-0.5">{roleText.subtitle}</p>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-[#5A6B50] hidden sm:block transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
        </button>

        {userMenuOpen && <div role="menu" className="absolute right-0 mt-2 w-56 rounded-xl border border-[#4E4631]/10 bg-white p-2 text-right shadow-lg z-30">
          <Link
            to="/ar/profile"
            onClick={() => setUserMenuOpen(false)}
            className="flex items-center gap-2 flex-row-reverse rounded-lg px-3 py-2 text-sm text-[#2E3A24] hover:bg-[#ECEEE2]"
          >
            <User className="w-4 h-4 text-[#5A6B50]" />
            الملف الشخصي
          </Link>
          <button
            type="button"
            onClick={requireLoginForSwitch}
            className="flex w-full items-center gap-2 flex-row-reverse rounded-lg px-3 py-2 text-right text-sm text-[#2E3A24] hover:bg-[#ECEEE2]"
          >
            <Repeat className="w-4 h-4 text-[#5A6B50]" />
            تبديل المستخدم
          </button>
          <button
            type="button"
            onClick={requireLoginForSwitch}
            className="flex w-full items-center gap-2 flex-row-reverse rounded-lg px-3 py-2 text-right text-sm text-[#8A1F11] hover:bg-[#D4183D]/10"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>}
      </div>

      <Link
        to={notifPath}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#4B5B3A]/8 transition-colors text-[#4E4631]"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-[#D4183D] text-white text-[10px] leading-4 text-center rounded-full ring-2 ring-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>}
      </Link>

      <Link
        to={enPath}
        className="flex items-center gap-1.5 flex-row-reverse px-3 py-1.5 rounded-lg border border-[#4B5B3A]/20 text-[#4B5B3A] hover:bg-[#4B5B3A]/8 transition-colors"
      >
        <Globe className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">English</span>
      </Link>
    </div>
  </div>;
};

export {
  NavbarAr
};
