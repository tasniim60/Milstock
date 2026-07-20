import { Outlet, useLocation } from "react-router";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { Navbar } from "./Navbar";
import { getStoredAuth } from "../lib/auth";
const DashboardLayout = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const isUser = location.pathname.startsWith("/user");
  const isSupplier = location.pathname.startsWith("/supplier");
  const storedRole = getStoredAuth().role;
  const userRole = isAdmin ? "admin" : isUser ? "user" : isSupplier ? "supplier" : storedRole || "user";
  return <div dir="ltr" className="flex min-h-screen bg-[#ECEEE2]">
      {
    /* Desktop sidebar */
  }
      <aside className="hidden lg:flex lg:flex-shrink-0 sticky top-0 h-screen z-30">
        <Sidebar userRole={userRole} />
      </aside>

      {
    /* Mobile nav */
  }
      <MobileNav userRole={userRole} />

      {
    /* Main column: Navbar + Content */
  }
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-hidden">
        {
    /* Top navbar — desktop only */
  }
        <div className="hidden lg:block">
          <Navbar userRole={userRole} />
        </div>

        {
    /* Page content */
  }
        <main className="flex-1 overflow-auto min-w-0">
          {
    /* Mobile offset for top + bottom nav */
  }
          <div className="pt-14 pb-20 lg:pt-0 lg:pb-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>;
};
export {
  DashboardLayout
};
