import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { LogisticsLanding } from "./LogisticsLanding.jsx";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";

// Auth pages
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfilePage } from "./pages/ProfilePage";

// Main pages
import { AboutPage } from "./pages/AboutPage.jsx";
import { ServicesPage } from "./pages/ServicesPage";
import { SolutionsPage } from "./pages/SolutionsPage";
import { IndustriesPage } from "./pages/IndustriesPage";
import { BookingPage } from "./pages/BookingPage";

// Service sub-pages
import { WarehousingPage } from "./pages/services/WarehousingPage";
import { FreightPage } from "./pages/services/FreightPage";
import { PackagingPage } from "./pages/services/PackagingPage";

// Solution sub-pages
import { EcommercePage } from "./pages/solutions/EcommercePage";
import { EnterprisePage } from "./pages/solutions/EnterprisePage";

// Industry sub-pages
import { RetailPage } from "./pages/industries/RetailPage";
import { ManufacturingPage } from "./pages/industries/ManufacturingPage";

export default function App() {
  const [dark, setDark] = useState(false);

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-background text-foreground transition-colors">
        <Router>
          <Header dark={dark} setDark={setDark} />

          {/* TEMP THEME TOGGLE */}
          <button
            onClick={() => setDark(!dark)}
            className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-full bg-primary text-primary-foreground shadow-lg"
          >
            {dark ? "Light" : "Dark"}
          </button>

          <main className="main-content">
            <Routes>
              <Route path="/" element={<LogisticsLanding />} />

              {/* Auth */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />

              {/* Main */}
              <Route path="/about" element={<AboutPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/solutions" element={<SolutionsPage />} />
              <Route path="/industries" element={<IndustriesPage />} />
              <Route path="/booking" element={<BookingPage />} />

              {/* Services */}
              <Route path="/services/warehousing" element={<WarehousingPage />} />
              <Route path="/services/freight" element={<FreightPage />} />
              <Route path="/services/packaging" element={<PackagingPage />} />

              {/* Solutions */}
              <Route path="/solutions/ecommerce" element={<EcommercePage />} />
              <Route path="/solutions/enterprise" element={<EnterprisePage />} />

              {/* Industries */}
              <Route path="/industries/retail" element={<RetailPage />} />
              <Route
                path="/industries/manufacturing"
                element={<ManufacturingPage />}
              />
            </Routes>
          </main>

          <Footer />
        </Router>
      </div>
    </div>
  );
}
