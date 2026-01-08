import { ChevronDownIcon, MenuIcon, XIcon } from "lucide-react";
import { Button } from "../ui/button";
import { useToggle } from "../../hooks/useToggle";
import { NAVIGATION_ITEMS } from "../../constants";
import { useBreakpoint } from "../../hooks/useMediaQuery";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearAuthStorage, getAuthFromStorage } from "../../utils/auth";
import { useState, useEffect } from "react";

export function Header() {
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

  const handleDropdownToggle = (itemName) => {
    setActiveDropdown(activeDropdown === itemName ? null : itemName);
  };

  const handleDropdownMouseEnter = (itemName) => {
    if (!isMobile) {
      setActiveDropdown(itemName);
    }
  };

  const handleDropdownMouseLeave = () => {
    if (!isMobile) {
      setActiveDropdown(null);
    }
  };

  return (
    <header className="w-full py-6">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between relative">
        {/* LOGO */}
        <Link to="/" className="flex items-center" onClick={handleNavLinkClick}>
          <img
            src="/swiftmove-logo.png"
            alt="SwiftMove"
            className="h-14 w-auto"
          />
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
          {NAVIGATION_ITEMS.map((item) => (
            <div
              key={item.href}
              className="relative"
              onMouseEnter={() => handleDropdownMouseEnter(item.label)}
              onMouseLeave={handleDropdownMouseLeave}
            >
              <Link
                to={item.href}
                onClick={handleNavLinkClick}
                className={`flex items-center gap-1 transition-colors ${
                  location.pathname === item.href
                    ? "text-blue-600"
                    : "text-gray-800 hover:text-blue-600"
                }`}
              >
                {item.label}
                {item.hasDropdown && <ChevronDownIcon className="w-4 h-4" />}
              </Link>
              {item.hasDropdown && (
                <div className={`absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 transition-all duration-200 ${
                  activeDropdown === item.label ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}>
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      to={child.href}
                      onClick={handleNavLinkClick}
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* DESKTOP BUTTONS */}
        <div className="hidden lg:flex items-center gap-3">
          {token ? (
            <>
              <Button
                asChild
                className="px-5 py-2 rounded-lg bg-gray-900 text-white"
              >
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild className="px-5 py-2 rounded-lg bg-blue-600 text-white">
                <Link to="/profile">Profile</Link>
              </Button>
              <Button
                type="button"
                onClick={handleLogout}
                className="px-5 py-2 rounded-lg bg-gray-100 text-gray-900"
                variant="secondary"
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button asChild className="px-5 py-2 rounded-lg bg-gray-900 text-white">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild className="px-5 py-2 rounded-lg bg-blue-600 text-white">
                <Link to="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>

        {/* MOBILE TOGGLE */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          {isMobileMenuOpen ? <XIcon /> : <MenuIcon />}
        </button>

        {/* MOBILE MENU */}
        <div className={`lg:hidden absolute top-full left-0 right-0 bg-white shadow-lg z-50 ${
          isMobileMenuOpen ? 'block' : 'hidden'
        }`}>
          <nav className="flex flex-col p-6 gap-4">
            {NAVIGATION_ITEMS.map((item) => (
              <div key={item.href}>
                <Link
                  to={item.href}
                  onClick={() => {
                    handleNavLinkClick();
                    if (item.hasDropdown) {
                      handleDropdownToggle(item.label);
                    }
                  }}
                  className={`flex items-center justify-between text-sm font-medium py-2 border-b ${
                    location.pathname === item.href
                      ? "text-blue-600"
                      : "text-gray-800"
                  }`}
                >
                  {item.label}
                  {item.hasDropdown && <ChevronDownIcon className="w-4 h-4" />}
                </Link>
                {item.hasDropdown && activeDropdown === item.label && (
                  <div className="pl-4 pt-2 pb-4 space-y-2">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        onClick={handleNavLinkClick}
                        className="block py-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-4 mt-2 border-t flex flex-col gap-3">
              {token ? (
                <>
                  <Button asChild className="w-full px-5 py-2 rounded-lg bg-gray-900 text-white">
                    <Link to="/dashboard" onClick={handleNavLinkClick}>
                      Dashboard
                    </Link>
                  </Button>
                  <Button asChild className="w-full px-5 py-2 rounded-lg bg-blue-600 text-white">
                    <Link to="/profile" onClick={handleNavLinkClick}>
                      Profile
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-5 py-2 rounded-lg bg-gray-100 text-gray-900"
                    variant="secondary"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild className="w-full px-5 py-2 rounded-lg bg-gray-900 text-white">
                    <Link to="/login" onClick={handleNavLinkClick}>
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild className="w-full px-5 py-2 rounded-lg bg-blue-600 text-white">
                    <Link to="/signup" onClick={handleNavLinkClick}>
                      Sign Up
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
