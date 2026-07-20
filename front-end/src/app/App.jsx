import { RouterProvider } from "react-router";
import { router } from "./routes";
import { useEffect } from "react";
import { NotificationProvider } from "./context/NotificationContext";
function App() {
  useEffect(() => {
    const applyDirection = (pathname) => {
      const isArabic = pathname.startsWith("/ar");
      document.documentElement.dir = isArabic ? "rtl" : "ltr";
      document.documentElement.lang = isArabic ? "ar" : "en";
    };
    applyDirection(window.location.pathname);
    const unsubscribe = router.subscribe((state) => {
      applyDirection(state.location.pathname);
    });
    return unsubscribe;
  }, []);
  return <NotificationProvider><RouterProvider router={router} /></NotificationProvider>;
}
export {
  App as default
};
