import { NavLink } from "react-router-dom";
import { ChevronDownIcon, MenuIcon, XIcon } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { useState } from "react";

const navigationItems = [
  { label: "Services", path: "/services", hasDropdown: true },
  { label: "Solutions", path: "/solutions" },
  { label: "Industries", path: "/industries" },
  { label: "Insights", path: "/insights" },
];

export const HeaderSection = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="w-full h-20">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between relative">
        <div className="flex items-center">
          <img
            src="/swiftmove-logo.png"
            alt="SwiftMove"
            className="h-14 w-auto"
          />
        </div>
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
          {NAVIGATION_ITEMS.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-1 transition-colors ${
                location.pathname === item.href
                  ? "text-blue-600"
                  : "text-gray-800 hover:text-blue-600"
              }`}
            >
              {item.label}
              {item.hasDropdown && <ChevronDownIcon className="w-4 h-4" />}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Button className="px-5 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800">
            Sign In
          </Button>

          <Button className="px-5 py-2 text-sm font-medium rounded-lg bg-indigo-900 text-white hover:bg-indigo-800">
            Sign Up
          </Button>
        </div>

        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <XIcon className="w-6 h-6 text-gray-700" />
          ) : (
            <MenuIcon className="w-6 h-6 text-gray-700" />
          )}
        </button>

        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
            <nav className="flex flex-col p-6 gap-4">
              {navigationItems.map((item, index) => (
                <button
                  key={index}
                  className="flex items-center justify-between text-sm font-medium text-gray-800 hover:text-blue-600"
                >
                  {item.label}
                  {item.hasDropdown && <ChevronDownIcon className="w-4 h-4" />}
                </button>
              ))}

              <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
                <Button className="w-full px-5 py-3 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800">
                  Sign In
                </Button>

                <Button className="w-full px-5 py-3 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700">
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
