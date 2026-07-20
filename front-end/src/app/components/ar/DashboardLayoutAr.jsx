import { Outlet, useLocation } from "react-router";
import { SidebarAr, MobileNavAr } from "./SidebarAr";
import { NavbarAr } from "./NavbarAr";
import { getStoredAuth } from "../../lib/auth";
const DashboardLayoutAr = () => {
  const location = useLocation();
  const isAdmin = location.pathname.includes("/ar/admin");
  const isUser = location.pathname.includes("/ar/user");
  const isSupplier = location.pathname.includes("/ar/supplier");
  const storedRole = getStoredAuth().role;
  const userRole = isAdmin ? "admin" : isUser ? "user" : isSupplier ? "supplier" : storedRole || "user";
  return <div
    dir="rtl"
    className="flex min-h-screen bg-[#ECEEE2]"
    style={{ fontFamily: "'Cairo', 'IBM Plex Sans Arabic', sans-serif" }}
  >
      {
    /* Desktop sidebar — on the right in RTL */
  }
      <aside className="hidden lg:flex lg:flex-shrink-0 sticky top-0 h-screen z-30">
        <SidebarAr userRole={userRole} />
      </aside>

      {
    /* Mobile nav */
  }
      <MobileNavAr userRole={userRole} />

      {
    /* Main column: Navbar + Content */
  }
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-hidden">
        {
    /* Top navbar — desktop only */
  }
        <div className="hidden lg:block">
          <NavbarAr userRole={userRole} />
        </div>

        {
    /* Page content */
  }
        <main className="flex-1 overflow-auto min-w-0">
          {
    /* Mobile offset */
  }
          <div className="pt-14 pb-20 lg:pt-0 lg:pb-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>;
};
export {
  DashboardLayoutAr
};
