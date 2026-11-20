import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  CreditCard,
  LayoutDashboard,
  Menu,
  Moon,
  PackageCheck,
  Sun,
  Truck,
  Users,
  X,
  MapPin,
  Settings,
} from "lucide-react";
import { useApp } from "../../store/appContext";
import { clearAuthStorage, getAuthFromStorage } from "../../utils/auth";
import { NotificationCenter } from "./NotificationCenter";

const PORTAL_NAVIGATION = {
  user: {
    title: "Customer Portal",
    links: [
      { to: "/dashboard/user", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/dashboard/user#bookings", label: "My Bookings", icon: Truck },
      { to: "/booking", label: "Get a Quote", icon: CreditCard },
      { label: "Saved Addresses", icon: MapPin, unavailable: true },
      { to: "/profile", label: "Profile", icon: Users },
      { label: "Settings", icon: Settings, unavailable: true },
    ],
  },
  admin: {
    title: "Admin Panel",
    links: [
      { to: "/dashboard/admin", label: "Overview", icon: LayoutDashboard, end: true },
      { to: "/dashboard/admin/orders", label: "Bookings", icon: BriefcaseBusiness },
      { to: "/dashboard/admin/users", label: "Customers", icon: Users },
      { to: "/dashboard/admin/providers", label: "Movers", icon: Truck },
      { to: "/dashboard/admin/packing-estimates", label: "Packing Estimates", icon: PackageCheck },
      { to: "/dashboard/admin/payments", label: "Payments", icon: CreditCard },
      { to: "/dashboard/admin/payment-reconciliation", label: "Reconciliation", icon: CreditCard },
      { to: "/profile", label: "Profile", icon: Users },
    ],
  },
  mover: {
    title: "Mover Portal",
    links: [
      { to: "/dashboard/provider", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/dashboard/provider/available-moves", label: "Available Moves", icon: Truck },
      { to: "/dashboard/provider/my-jobs", label: "My Jobs", icon: BriefcaseBusiness },
      { to: "/profile", label: "Profile", icon: Users },
    ],
  },
};

const getCustomerName = () => {
  try {
    const name = getAuthFromStorage().user?.name;
    return typeof name === "string" ? name.trim() || "there" : "there";
  }
  catch { return "there"; }
};

export function PortalLayout({ role, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, setTheme } = useApp();
  const location = useLocation();
  const isDark = theme === "dark";
  const config = PORTAL_NAVIGATION[role];

  const navLinks = (mobile = false) => config.links.map(({ to, label, icon: Icon, end, unavailable }) => {
    if (unavailable) return (
      <span key={label} aria-disabled="true" title="Not available yet" className="flex min-h-11 cursor-not-allowed items-center gap-3 rounded-control px-3 py-2 text-sm font-medium text-slate-500">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{label}</span><span className="ml-auto text-[10px] uppercase tracking-wide text-slate-500">Soon</span>
      </span>
    );

    if (role === "user") return (
      <NavLink
        key={to}
        to={to}
        end={end}
        onClick={() => mobile && setMobileOpen(false)}
        className={({ isActive }) => {
          const hash = location.hash;
          const selected = label === "My Bookings"
            ? isActive && hash === "#bookings"
            : label === "Dashboard"
              ? isActive && hash !== "#bookings"
              : isActive;
          return `flex min-h-11 items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${selected ? "bg-white/15 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`;
        }}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </NavLink>
    );

    return (
      <NavLink
        key={to}
        to={to}
        end={end}
        onClick={() => mobile && setMobileOpen(false)}
        className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${isActive ? "bg-white/15 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </NavLink>
    );
  });

  const logout = () => {
    clearAuthStorage();
    navigate("/login", { replace: true });
  };

  const portalActions = () => (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
        className="inline-flex h-11 w-11 items-center justify-center rounded-control border border-slate-200 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sm-primary dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
      >
        {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
      </button>
      <NotificationCenter role={role} />
      <button
        type="button"
        onClick={logout}
        className="min-h-11 rounded-control border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sm-primary dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
      >
        Log out
      </button>
    </div>
  );

  const homeTo = role === "user" ? "/" : role === "admin" ? "/dashboard/admin" : "/dashboard/provider";

  useEffect(() => {
    if (role !== "user" || !mobileOpen) return undefined;
    const closeOnEscape = (event) => { if (event.key === "Escape") setMobileOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [role, mobileOpen]);

  if (!config) return <div className="min-h-screen bg-sm-background p-4 dark:bg-slate-950">{children}</div>;

  if (role === "user") {
    const savedUser = getCustomerName();
    const initials = savedUser.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
    const customerThemeControl = (
      <div className="grid grid-cols-2 rounded-control bg-white/10 p-1" aria-label="Color theme">
        <button type="button" aria-pressed={!isDark} onClick={() => setTheme("light")} className={`flex min-h-10 items-center justify-center gap-2 rounded-lg px-2 text-xs font-semibold ${!isDark ? "bg-white text-slate-900 shadow" : "text-slate-300 hover:bg-white/10"}`}>
          <Sun className="h-3.5 w-3.5" aria-hidden="true" />Light
        </button>
        <button type="button" aria-pressed={isDark} onClick={() => setTheme("dark")} className={`flex min-h-10 items-center justify-center gap-2 rounded-lg px-2 text-xs font-semibold ${isDark ? "bg-white text-slate-900 shadow dark:bg-white dark:text-slate-900" : "text-slate-300 hover:bg-white/10"}`}>
          <Moon className="h-3.5 w-3.5" aria-hidden="true" />Dark
        </button>
      </div>
    );
    const customerLogout = <button type="button" onClick={logout} className="mt-3 min-h-11 w-full rounded-control px-3 text-left text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Log out</button>;

    return (
      <div className="min-h-screen min-w-0 w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-blue-700 focus:shadow-lg">Skip to main content</a>
        <aside className="sticky top-0 hidden h-screen min-w-0 flex-col bg-slate-900 px-4 py-6 text-white lg:flex">
          <Link to="/" aria-label="SwiftMove home" className="mb-8 px-3 text-xl font-extrabold tracking-tight focus-visible:rounded-control"><span className="text-blue-400">Swift</span>Move</Link>
          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Customer Portal</p>
          <nav aria-label="Customer portal navigation" className="space-y-1">{navLinks()}</nav>
        </aside>

        <div className="min-w-0 w-full">
          <header className="sticky top-0 z-30 flex min-h-16 min-w-0 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-6 lg:px-7">
            <Link to="/" aria-label="SwiftMove home" className="shrink-0 text-lg font-extrabold tracking-tight lg:hidden"><span className="text-blue-600 dark:text-blue-400">Swift</span>Move</Link>
            <span className="hidden min-w-0 text-sm font-semibold text-slate-700 dark:text-slate-200 lg:block">Customer Portal</span>
            <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
              <button type="button" onClick={() => setTheme(isDark ? "light" : "dark")} aria-label={`Switch to ${isDark ? "light" : "dark"} theme`} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-slate-100 dark:hover:bg-slate-800">
                {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
              </button>
              <NotificationCenter role="user" />
              <Link to="/profile" aria-label="Open your profile" title="Profile" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white ring-2 ring-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:bg-blue-500 dark:ring-blue-950">{initials}</Link>
              <button type="button" onClick={logout} className="hidden min-h-10 shrink-0 rounded-control border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 lg:inline-flex lg:items-center">Log out</button>
              <button type="button" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-slate-100 dark:hover:bg-slate-800 lg:hidden" aria-label={mobileOpen ? "Close customer navigation" : "Open customer navigation"} aria-expanded={mobileOpen} aria-controls="customer-mobile-navigation" onClick={() => setMobileOpen((open) => !open)}>
                {mobileOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
              </button>
            </div>
          </header>

          {mobileOpen && <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" />}
          <nav id="customer-mobile-navigation" aria-label="Customer portal navigation" className={`fixed inset-y-0 left-0 z-50 w-[min(18rem,85vw)] flex-col bg-slate-900 px-4 py-6 text-white shadow-2xl lg:hidden ${mobileOpen ? "flex" : "hidden"}`}>
            <div className="mb-8 flex items-center justify-between px-3"><Link to="/" onClick={() => setMobileOpen(false)} className="text-xl font-extrabold tracking-tight"><span className="text-blue-400">Swift</span>Move</Link><button type="button" onClick={() => setMobileOpen(false)} aria-label="Close customer navigation" className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-200 hover:bg-white/10"><X aria-hidden="true" /></button></div>
            <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Customer Portal</p>
            <div className="space-y-1">{navLinks(true)}</div>
            <div className="mt-auto border-t border-white/10 pt-4">{customerThemeControl}{customerLogout}</div>
          </nav>

          <main id="main-content" className="mx-auto min-w-0 w-full max-w-[1600px] p-4 sm:p-6 xl:p-8">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-shell min-h-screen bg-sm-background text-slate-900 dark:bg-slate-950 dark:text-slate-100 lg:flex">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-sm-primary-text focus:shadow-lg">
        Skip to main content
      </a>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto bg-sm-navy px-4 py-6 text-white lg:flex">
        <Link to={homeTo} className="mb-8 px-3 text-xl font-extrabold tracking-tight focus-visible:rounded-control">
          <span className="text-blue-400">Swift</span><span>Move</span>
        </Link>
        <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{config.title}</p>
        <nav aria-label={`${config.title} navigation`} className="space-y-1">{navLinks()}</nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
          <Link to={homeTo} className="text-lg font-extrabold tracking-tight lg:hidden">
            <span className="text-blue-600 dark:text-blue-400">Swift</span>Move
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden pr-2 text-sm font-semibold text-slate-700 dark:text-slate-200 lg:inline">{config.title}</span>
            {portalActions()}
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-control text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sm-primary dark:text-slate-100 dark:hover:bg-slate-800 lg:hidden"
              aria-label={mobileOpen ? "Close portal navigation" : "Open portal navigation"}
              aria-expanded={mobileOpen}
              aria-controls="portal-mobile-navigation"
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </div>
        </header>

        <nav
          id="portal-mobile-navigation"
          aria-label={`${config.title} navigation`}
          hidden={!mobileOpen}
          className="space-y-1 bg-sm-navy px-4 py-4 text-white lg:hidden"
        >
          {navLinks(true)}
        </nav>

        <main id="main-content" className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
