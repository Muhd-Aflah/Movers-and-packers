import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import { Layout } from "../components/layout/Layout";

// Public pages
import { HomePage } from "../pages/HomePage";
import { AboutPage } from "../pages/AboutPage";
import { ServicesPage } from "../pages/ServicesPage";
import { SolutionsPage } from "../pages/SolutionsPage";
import { ContactPage } from "../pages/ContactPage";
import { LoginPage } from "../pages/LoginPage";
import { SignupPage } from "../pages/SignupPage";

// Admin Pages
import { AdminUsersPage } from "../pages/admin/AdminUsersPage";
import { AdminOrdersPage } from "../pages/admin/AdminOrdersPage";
import { AdminPaymentsPage } from "../pages/admin/AdminPaymentsPage";
import { AdminProvidersPage } from "../pages/admin/AdminProvidersPage";

// Dashboards
import { DashboardRedirect } from "./DashboardRedirect";
import { ProfilePage } from "../pages/ProfilePage";
import { UserDashboard } from "../dashboards/UserDashboard";
import { ProviderDashboard } from "../dashboards/ProviderDashboard";
import { AdminDashboard } from "../dashboards/AdminDashboard";

// Features
import { BookingPage } from "../pages/BookingPage";
import { PaymentPage } from "../pages/PaymentPage";

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
      { path: "solutions", element: <SolutionsPage /> },
      { path: "contact", element: <ContactPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
      { path: "provider/signup", element: <SignupPage /> },

      // User features
      {
        path: "booking",
        element: (
          <ProtectedRoute allowedRoles={["user"]}>
            <BookingPage />
          </ProtectedRoute>
        ),
      },
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
          <ProtectedRoute allowedRoles={["user", "provider", "admin"]}>
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
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderDashboard />
          </ProtectedRoute>
        ),
        children: [
          {
            path: "available-moves",
            element: <div>Provider Available Moves (TODO)</div>,
          },
          {
            path: "my-jobs",
            element: <div>Provider My Jobs (TODO)</div>,
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
          { path: "payments", element: <AdminPaymentsPage /> },
        ],
      },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
