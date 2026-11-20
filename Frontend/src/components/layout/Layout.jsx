import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { PortalLayout } from "./PortalLayout";
import { useLocation } from "react-router-dom";
import { useApp } from "../../store/appContext";
import { getAuthFromStorage } from "../../utils/auth";

export function Layout() {
  const { theme } = useApp();
  const { pathname } = useLocation();
  const { role } = getAuthFromStorage();
  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isAccountArea = pathname === "/profile" || pathname === "/payment";
  const isCustomerBooking = pathname === "/booking" && role === "user";
  const isPortalPage = isDashboard || (isAccountArea && Boolean(role)) || isCustomerBooking;

  return (
    <div className={`min-h-screen min-w-0 w-full flex flex-col bg-background text-foreground transition-colors duration-200 ${theme}`}>
      {isPortalPage ? (
        <PortalLayout role={role}><Outlet /></PortalLayout>
      ) : (
        <>
          <Header />
          <main className="flex-1"><Outlet /></main>
          <Footer />
        </>
      )}
    </div>
  );
}
