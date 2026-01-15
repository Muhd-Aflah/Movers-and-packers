import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./routes/ProtectedRoute";

import { LogisticsLanding } from "./LogisticsLanding.jsx";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";

// Auth
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfilePage } from "./pages/ProfilePage";

// Role dashboards
import { AdminDashboard } from "./pages/AdminDashboard";
import { ProviderDashboard } from "./pages/ProviderDashboard";
import { UserDashboard } from "./pages/UserDashboard";

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

export default function App() {
  const [dark, setDark] = useState(false);

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-background text-foreground">
        <Router>
          <Header dark={dark} setDark={setDark} />

          <main className="main-content">
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
              <Route
                path="/industries/manufacturing"
                element={<ManufacturingPage />}
              />

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

              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/provider"
                element={
                  <ProtectedRoute allowedRoles={["provider"]}>
                    <ProviderDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/user"
                element={
                  <ProtectedRoute allowedRoles={["user"]}>
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>

          <Footer />
        </Router>
      </div>
    </div>
  );
}
