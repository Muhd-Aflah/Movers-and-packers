import { ChevronDownIcon, MenuIcon, XIcon } from "lucide-react";
import { Button } from "../ui/button";
import { useToggle } from "../../hooks/useToggle";
import { NAVIGATION_ITEMS } from "../../constants";
import { useBreakpoint } from "../../hooks/useMediaQuery";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearAuthStorage, getAuthFromStorage } from "../../utils/auth";
import { useState } from "react";

export function Header({ dark, setDark }) {
  const [isMobileMenuOpen, toggleMobileMenu, , setFalse] = useToggle(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const { isMobile } = useBreakpoint();
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = getAuthFromStorage();

  const handleNavLinkClick = () => {
    if (isMobile) setFalse();
    setActiveDropdown(null);
  };

  const handleLogout = () => {
    clearAuthStorage();
    setFalse();
    navigate("/");
  };

  return (
    <header className="w-full py-6 relative overflow-visible">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between relative">
        {/* LOGO */}
        <Link to="/" onClick={handleNavLinkClick}>
          <img
            src="/swiftmove-logo.png"
            alt="SwiftMove"
            className=" h-10           
    sm:h-12         
    md:h-14        
    lg:h-16        
    xl:h-18         
    w-auto"
          />
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
          {NAVIGATION_ITEMS.map((item) => (
            <div
              key={`desktop-${item.href}`} // ✅ FIXED KEY
              className="relative"
              onMouseEnter={() => !isMobile && setActiveDropdown(item.label)}
              onMouseLeave={() => !isMobile && setActiveDropdown(null)}
            >
              <Link
                to={item.href}
                onClick={handleNavLinkClick}
                className={`flex items-center gap-1 ${
                  location.pathname === item.href
                    ? "text-blue-600"
                    : "text-gray-800 hover:text-blue-600"
                }`}
              >
                {item.label}
                {item.hasDropdown && <ChevronDownIcon className="w-4 h-4" />}
              </Link>

              {item.hasDropdown && (
                <div
                  className={`absolute top-full left-0 mt-2 w-48 bg-white border rounded-lg shadow-lg transition ${
                    activeDropdown === item.label
                      ? "opacity-100 visible"
                      : "opacity-0 invisible"
                  }`}
                >
                  {item.children.map((child) => (
                    <Link
                      key={`${item.href}-${child.href}`} // ✅ SAFE KEY
                      to={child.href}
                      onClick={handleNavLinkClick}
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
            className="w-9 h-9 rounded-md bg-muted hover:bg-accent"
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
              <Button variant="secondary" onClick={handleLogout}>
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
        <button onClick={toggleMobileMenu} className="lg:hidden">
          {isMobileMenuOpen ? <XIcon /> : <MenuIcon />}
        </button>

        {/* MOBILE MENU */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white shadow-lg z-50">
            <button
              onClick={() => {
                setDark?.(!dark);
                setFalse();
              }}
              className="w-full px-5 py-3 bg-gray-100"
            >
              {dark ? "Light Mode ☀️" : "Dark Mode 🌙"}
            </button>

            {NAVIGATION_ITEMS.map((item) => (
              <div
                key={`desktop-${item.href}`}
                className="relative"
                onMouseEnter={() => setActiveDropdown(item.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link to={item.href} className="flex items-center gap-1">
                  {item.label}
                  {item.hasDropdown && <ChevronDownIcon className="w-4 h-4" />}
                </Link>

                {item.hasDropdown && (
                  <div
                    className={`absolute top-full left-0 mt-2 w-48
        bg-white rounded-lg shadow-lg border
        z-[9999]
        ${activeDropdown === item.label ? "block" : "hidden"}`}
                  >
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        className="block px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
