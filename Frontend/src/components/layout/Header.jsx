import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MenuIcon, XIcon, ChevronDownIcon } from "lucide-react";
import { Button } from "../ui/button";
import { getAuthFromStorage, clearAuthStorage } from "../../utils/auth";

export function Header({ dark, setDark }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdown, setDropdown] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { token, role } = getAuthFromStorage();

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
                {item.children && <ChevronDownIcon className="w-4 h-4" />}
              </Link>

              {item.children && dropdown === item.label && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border rounded-lg shadow-lg">
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
            onClick={() => setDark?.(!dark)}
            className="w-9 h-9 rounded-md bg-gray-100 hover:bg-gray-200"
          >
            {dark ? "☀️" : "🌙"}
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
        <button
          className="lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <XIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t shadow-lg">
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
