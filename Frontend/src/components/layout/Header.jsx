import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MenuIcon, XIcon, ChevronDownIcon, Moon, Sun } from "lucide-react";
import { Button } from "../ui/button";
import { getAuthFromStorage, clearAuthStorage } from "../../utils/auth";
import { useApp } from "../../store/appContext";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdown, setDropdown] = useState(null);
  const navRef = useRef(null);
  const headerRef = useRef(null);
  const dropdownTriggerRef = useRef(null);
  const menuTriggerRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useApp();
  const dark = theme === "dark";
  const { token } = getAuthFromStorage();

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!navRef.current?.contains(event.target)) setDropdown(null);
      if (mobileOpen && !headerRef.current?.contains(event.target)) setMobileOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (dropdown) {
        setDropdown(null);
        dropdownTriggerRef.current?.focus();
      } else if (mobileOpen) {
        setMobileOpen(false);
        menuTriggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [dropdown, mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
    setDropdown(null);
  }, [location.pathname]);

  const logout = () => {
    clearAuthStorage();
    setMobileOpen(false);
    navigate("/login");
  };

  const NAV_ITEMS = [
    { label: "About", href: "/about" },
    {
      label: "Services",
      href: "/services",
      children: [
        { label: "Warehousing", href: "/services/warehousing" },
        { label: "Freight", href: "/services/freight" },
        { label: "Packaging", href: "/services/packaging" },
      ],
    },
    { label: "Solutions", href: "/solutions" },
    { label: "Industries", href: "/industries" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header ref={headerRef} className="sticky top-0 z-[60] w-full border-b border-border bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* LOGO */}
        <Link to="/" className="flex items-center hover:opacity-90 transition">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            <span className="text-blue-600">Swift</span>
            <span className="text-red-600">Move</span>
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <nav ref={navRef} aria-label="Main navigation" className="hidden items-center gap-8 text-sm font-medium lg:flex">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.href}
              className="relative flex flex-row items-center gap-1"
              onMouseEnter={() => item.children && setDropdown(item.label)}
              onMouseLeave={(event) => {
                if (item.children && !event.currentTarget.contains(event.relatedTarget)) setDropdown(null);
              }}
            >
              <Link
                to={item.href}
                aria-current={location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(`${item.href}/`)) ? "page" : undefined}
                className={`flex items-center gap-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(`${item.href}/`)) ? "text-primary" : "text-foreground hover:text-primary"}`}
              >
                {item.label}
              </Link>

              {item.children && (
                <button
                  type="button"
                  onClick={() => setDropdown(dropdown === item.label ? null : item.label)}
                  ref={dropdownTriggerRef}
                  aria-label={`${dropdown === item.label ? "Close" : "Open"} ${item.label} menu`}
                  aria-expanded={dropdown === item.label}
                  aria-controls={`nav-${item.label.toLowerCase()}`}
                  className="inline-flex rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              )}

              {item.children && (
                <div id={`nav-${item.label.toLowerCase()}`} hidden={dropdown !== item.label} className="absolute left-0 top-full z-[70] w-56 pt-2">
                  <div className="rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      to={child.href}
                      aria-current={location.pathname === child.href ? "page" : undefined}
                      onClick={() => setDropdown(null)}
                      className={`block rounded-lg px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${location.pathname === child.href ? "bg-accent font-semibold text-accent-foreground" : "text-popover-foreground hover:bg-accent"}`}
                    >
                      {child.label}
                    </Link>
                  ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* DESKTOP ACTIONS */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            type="button"
            onClick={() => setTheme(dark ? "light" : "dark")}
            aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
            title={`Switch to ${dark ? "light" : "dark"} theme`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            {dark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
          </button>

          {token ? (
            <>
              <Button asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild>
                <Link to="/profile">Profile</Link>
              </Button>
              <Button variant="secondary" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                variant="signin"
              >
                <Link to="/login">Sign In</Link>
              </Button>
              <Button
                asChild
                variant="signup"
              >
                <Link to="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>

        {/* MOBILE TOGGLE */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setTheme(dark ? "light" : "dark")}
            aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
            title={`Switch to ${dark ? "light" : "dark"} theme`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {dark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
          </button>
          <button
            type="button"
            ref={menuTriggerRef}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-slate-100"
          >
            {mobileOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div id="mobile-navigation" className="border-t border-border bg-background text-foreground shadow-lg lg:hidden">
          <nav className="flex flex-col p-6 gap-4">
            {NAV_ITEMS.map((item) => (
              <div key={item.href}>
                <Link
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(`${item.href}/`)) ? "page" : undefined}
                  className={`flex min-h-11 items-center justify-between rounded-lg px-2 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(`${item.href}/`)) ? "text-primary" : "text-foreground hover:text-primary"}`}
                >
                  {item.label}
                </Link>

                {item.children && (
                  <div className="ml-4 mt-2 space-y-2">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={location.pathname === child.href ? "page" : undefined}
                        className={`block rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${location.pathname === child.href ? "bg-accent font-semibold text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="pt-4 border-t space-y-3">
              {token ? (
                <>
                  <Button asChild className="w-full">
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                  <Button
                    onClick={logout}
                    className="w-full"
                    variant="secondary"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    variant="signin"
                    className="w-full"
                  >
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button
                    asChild
                    variant="signup"
                    className="w-full"
                  >
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
