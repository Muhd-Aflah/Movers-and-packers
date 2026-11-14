import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import { Layout } from "../components/layout/Layout";

// Public pages
import { HomePage } from "../pages/HomePage";
import { AboutPage } from "../pages/AboutPage";
import { ServicesPage } from "../pages/ServicesPage";
import { WarehousingPage } from "../pages/services/WarehousingPage";
import { FreightPage } from "../pages/services/FreightPage";
import { PackagingPage } from "../pages/services/PackagingPage";
import { SolutionsPage } from "../pages/SolutionsPage";
import { EcommercePage } from "../pages/solutions/EcommercePage";
import { EnterprisePage } from "../pages/solutions/EnterprisePage";
import { IndustriesPage } from "../pages/IndustriesPage";
import { RetailPage } from "../pages/industries/RetailPage";
import { ManufacturingPage } from "../pages/industries/ManufacturingPage";
import { ContactPage } from "../pages/ContactPage";
import { LoginPage } from "../pages/LoginPage";
import { SignupPage } from "../pages/SignupPage";

// Admin Pages
import { AdminUsersPage } from "../pages/admin/AdminUsersPage";
import { AdminOrdersPage } from "../pages/admin/AdminOrdersPage";
import { AdminPaymentsPage } from "../pages/admin/AdminPaymentsPage";
import { AdminPaymentReconciliationPage } from "../pages/admin/AdminPaymentReconciliationPage";
import { AdminProvidersPage } from "../pages/admin/AdminProvidersPage";
import { AdminPackingEstimatesPage } from "../pages/admin/AdminPackingEstimatesPage";

// Dashboards
import { DashboardRedirect } from "./DashboardRedirect";
import { ProfilePage } from "../pages/ProfilePage";
import { UserDashboard } from "../dashboards/UserDashboard";
import { ProviderDashboard } from "../dashboards/ProviderDashboard";
import { AdminDashboard } from "../dashboards/AdminDashboard";
import { AvailableMoves } from "../components/provider/AvailableMoves";
import { ProviderJobs } from "../components/provider/ProviderJobs";

// Features
import { BookingPage } from "../pages/BookingPage";
import { PaymentPage } from "../pages/PaymentPage";
import { MoverApplicationPage } from "../pages/MoverApplicationPage";

// Auth
import { ProtectedRoute } from "../components/auth/ProtectedRoute";

const NotFoundPage = () => <div className="p-8">404</div>;

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      // Public
      { index: true, element: <HomePage /> },
      { path: "about", element: <AboutPage /> },
      { path: "services", element: <ServicesPage /> },
      { path: "services/warehousing", element: <WarehousingPage /> },
      { path: "services/freight", element: <FreightPage /> },
      { path: "services/packaging", element: <PackagingPage /> },
      { path: "solutions", element: <SolutionsPage /> },
      { path: "solutions/ecommerce", element: <EcommercePage /> },
      { path: "solutions/enterprise", element: <EnterprisePage /> },
      { path: "industries", element: <IndustriesPage /> },
      { path: "industries/retail", element: <RetailPage /> },
      { path: "industries/manufacturing", element: <ManufacturingPage /> },
      { path: "contact", element: <ContactPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
      { path: "provider/signup", element: <SignupPage /> },
      { path: "mover/application", element: <MoverApplicationPage /> },

      // User features
      { path: "booking", element: <BookingPage /> },
      {
        path: "payment",
        element: (
          <ProtectedRoute allowedRoles={["user"]}>
            <PaymentPage />
          </ProtectedRoute>
        ),
      },

      // Shared profile
      {
        path: "profile",
        element: (
          <ProtectedRoute allowedRoles={["user", "mover", "admin"]}>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },

      // Dashboard entry point (ROLE REDIRECT)
      {
        path: "dashboard",
        element: <DashboardRedirect />,
      },

      // USER DASHBOARD
      {
        path: "dashboard/user",
        element: (
          <ProtectedRoute allowedRoles={["user"]}>
            <UserDashboard />
          </ProtectedRoute>
        ),
      },

      // PROVIDER DASHBOARD
      {
        path: "dashboard/provider",
        element: (
          <ProtectedRoute allowedRoles={["mover"]} requireApprovedMover>
            <ProviderDashboard />
          </ProtectedRoute>
        ),
        children: [
          {
            path: "available-moves",
            element: <AvailableMoves />,
          },
          {
            path: "my-jobs",
            element: <ProviderJobs />,
          },
        ],
      },

      // ADMIN DASHBOARD
      {
        path: "dashboard/admin",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        ),
        children: [
          { path: "users", element: <AdminUsersPage /> },
          { path: "providers", element: <AdminProvidersPage /> },
          { path: "orders", element: <AdminOrdersPage /> },
          { path: "packing-estimates", element: <AdminPackingEstimatesPage /> },
          { path: "payments", element: <AdminPaymentsPage /> },
          { path: "payment-reconciliation", element: <AdminPaymentReconciliationPage /> },
        ],
      },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
