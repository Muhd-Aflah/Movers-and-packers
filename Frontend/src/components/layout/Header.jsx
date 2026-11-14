import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MenuIcon, XIcon, ChevronDownIcon, Moon, Sun } from "lucide-react";
import { Button } from "../ui/button";
import { getAuthFromStorage, clearAuthStorage } from "../../utils/auth";
import { useApp } from "../../store/appContext";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdown, setDropdown] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useApp();
  const dark = theme === "dark";
  const { token } = getAuthFromStorage();

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
    <header className="w-full bg-white border-b relative z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* LOGO */}
        <Link to="/" className="flex items-center hover:opacity-90 transition">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            <span className="text-blue-600">Swift</span>
            <span className="text-red-600">Move</span>
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.href}
              className="relative"
              onMouseEnter={() => setDropdown(item.label)}
              onMouseLeave={() => setDropdown(null)}
            >
              <Link
                to={item.href}
                className={`flex items-center gap-1 ${
                  location.pathname.startsWith(item.href)
                    ? "text-blue-600"
                    : "text-gray-800 hover:text-blue-600"
                }`}
              >
                {item.label}
              </Link>

              {item.children && (
                <button
                  type="button"
                  onClick={() => setDropdown(dropdown === item.label ? null : item.label)}
                  aria-label={`${dropdown === item.label ? "Close" : "Open"} ${item.label} menu`}
                  aria-expanded={dropdown === item.label}
                  aria-controls={`nav-${item.label.toLowerCase()}`}
                  className="ml-1 inline-flex rounded p-1 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              )}

              {item.children && dropdown === item.label && (
                <div id={`nav-${item.label.toLowerCase()}`} className="absolute top-full left-0 mt-2 w-48 bg-white border rounded-xl shadow-lg p-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      to={child.href}
                      className="block px-4 py-3 text-sm hover:bg-gray-100"
                    >
                      {child.label}
                    </Link>
                  ))}
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
              <Button asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild>
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
        <div id="mobile-navigation" className="lg:hidden bg-white border-t shadow-lg">
          <nav className="flex flex-col p-6 gap-4">
            {NAV_ITEMS.map((item) => (
              <div key={item.href}>
                <Link
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex justify-between items-center font-medium"
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
                        className="block text-sm text-gray-600"
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
                  <Button asChild className="w-full">
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button asChild className="w-full">
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
