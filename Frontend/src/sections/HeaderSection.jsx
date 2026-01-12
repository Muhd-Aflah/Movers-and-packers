import { NavLink } from "react-router-dom";
import { ChevronDownIcon, MenuIcon, XIcon } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { useState } from "react";

const navigationItems = [
  { label: "About", path: "/about" },
  { label: "Services", path: "/services", hasDropdown: true },
  { label: "Solutions", path: "/solutions" },
];

export const HeaderSection = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  return (
    <header className="w-full h-20">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between relative">

        {/* LOGO */}
        <img
          src="/swiftmove-logo.png"
          alt="SwiftMove"
          className="h-14 w-auto"
        />

        {/* DESKTOP NAV */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
          {navigationItems.map((item) => (
            <NavLink
              key={`desktop-${item.path}`}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-1 transition-colors ${
                  isActive
                    ? "text-blue-600"
                    : "text-gray-800 hover:text-blue-600"
                }`
              }
            >
              {item.label}
              {item.hasDropdown && <ChevronDownIcon className="w-4 h-4" />}
            </NavLink>
          ))}
        </nav>

        {/* DESKTOP ACTIONS */}
        <div className="hidden lg:flex items-center gap-3">
          <Button className="bg-gray-900 text-white hover:bg-gray-800">
            Sign In
          </Button>
          <Button className="bg-indigo-900 text-white hover:bg-indigo-800">
            Sign Up
          </Button>
        </div>

        {/* MOBILE TOGGLE */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <XIcon /> : <MenuIcon />}
        </button>

        {/* MOBILE MENU */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-t shadow-lg z-50">
            <nav className="flex flex-col p-6 gap-4">
              {navigationItems.map((item) => (
                <NavLink
                  key={`mobile-${item.path}`}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between text-sm font-medium text-gray-800 hover:text-blue-600"
                >
                  {item.label}
                  {item.hasDropdown && <ChevronDownIcon className="w-4 h-4" />}
                </NavLink>
              ))}

              <div className="pt-4 border-t flex flex-col gap-3">
                <Button className="bg-gray-900 text-white hover:bg-gray-800">
                  Sign In
                </Button>
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  Sign Up
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
