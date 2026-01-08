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
import { ServicesPage } from "./pages/ServicesPage";
import { SolutionsPage } from "./pages/SolutionsPage";
import { IndustriesPage } from "./pages/IndustriesPage";
import { InsightsPage } from "./pages/InsightsPage";
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

function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Routes>
            {/* Home */}
            <Route path="/" element={<LogisticsLanding />} />
            
            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            
            {/* Main pages */}
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/solutions" element={<SolutionsPage />} />
            <Route path="/industries" element={<IndustriesPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/booking" element={<BookingPage />} />
            
            {/* Service sub-pages */}
            <Route path="/services/warehousing" element={<WarehousingPage />} />
            <Route path="/services/freight" element={<FreightPage />} />
            <Route path="/services/packaging" element={<PackagingPage />} />
            
            {/* Solution sub-pages */}
            <Route path="/solutions/ecommerce" element={<EcommercePage />} />
            <Route path="/solutions/enterprise" element={<EnterprisePage />} />
            
            {/* Industry sub-pages */}
            <Route path="/industries/retail" element={<RetailPage />} />
            <Route path="/industries/manufacturing" element={<ManufacturingPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
