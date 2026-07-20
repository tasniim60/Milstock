import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";
import { getLoginPath, getRoleHomePath, getStoredAuth } from "../lib/auth";

const ProtectedRoute = ({ allowedRole, children }) => {
  const location = useLocation();
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    setAuth(getStoredAuth());
  }, []);

  const isArabic = location.pathname.startsWith("/ar");

  if (!auth) {
    return <div className="min-h-screen bg-[#ECEEE2] flex items-center justify-center text-sm text-[#5A6B50]">
      Loading MilStock...
    </div>;
  }

  if (!auth.token || !auth.user || !auth.role) {
    return <Navigate to={getLoginPath(isArabic)} replace state={{ from: location.pathname }} />;
  }

  if (allowedRole && auth.role !== allowedRole) {
    return <Navigate to={getRoleHomePath(auth.role, isArabic)} replace />;
  }

  return children;
};

export {
  ProtectedRoute
};
