import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { ProtectedRoute } from "./routes/ProtectedRoute";

import { LogisticsLanding } from "./LogisticsLanding.jsx";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";

// Auth
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import { ProfilePage } from "./pages/ProfilePage";

// Main pages
import { AboutPage } from "./pages/AboutPage.jsx";
import { ServicesPage } from "./pages/ServicesPage";
import { SolutionsPage } from "./pages/SolutionsPage";
import { IndustriesPage } from "./pages/IndustriesPage";
import { BookingPage } from "./pages/BookingPage";

// Services
import { WarehousingPage } from "./pages/services/WarehousingPage";
import { FreightPage } from "./pages/services/FreightPage";
import { PackagingPage } from "./pages/services/PackagingPage";

// Solutions
import { EcommercePage } from "./pages/solutions/EcommercePage";
import { EnterprisePage } from "./pages/solutions/EnterprisePage";

// Industries
import { RetailPage } from "./pages/industries/RetailPage";
import { ManufacturingPage } from "./pages/industries/ManufacturingPage";

function Layout({ dark, setDark, children }) {
  const location = useLocation();
  const hideLayout = ["/login", "/signup"].includes(location.pathname);

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-background text-foreground">
        {!hideLayout && <Header dark={dark} setDark={setDark} />}
        <main className="main-content">{children}</main>
        {!hideLayout && <Footer />}
      </div>
    </div>
  );
}

export default function App() {
  const [dark, setDark] = useState(false);

  return (
    <Router>
      <Layout dark={dark} setDark={setDark}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LogisticsLanding />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
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
          <Route path="/industries/manufacturing" element={<ManufacturingPage />} />

          {/* Protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}
