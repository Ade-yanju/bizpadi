// src/routes/AppRouter.jsx
import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Import pages directly first (no lazy) to debug:
import Landing from "../pages/Landing";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";

import Dashboard from "../pages/app/Dashboard";
import Shops from "../pages/app/Shops";
import ShopDetails from "../pages/app/ShopDetails";
import Positions from "../pages/app/Positions";
import Wallet from "../pages/app/Wallet";
import Transactions from "../pages/app/Transactions";
import KYC from "../pages/app/KYC";
import BankAccounts from "../pages/app/BankAccounts";
import Transfers from "../pages/app/Transfers";
import Withdraw from "../pages/app/Withdraw";
import Settings from "../pages/app/Settings";

import AdminHome from "../pages/admin/AdminHome";
import AdminShops from "../pages/admin/AdminShops";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminKYC from "../pages/admin/AdminKYC";
import AdminWithdrawals from "../pages/admin/AdminWithdrawals";
import AdminTransactions from "../pages/admin/AdminTransactions";
import AdminReports from "../pages/admin/AdminReports";
import AdminSettings from "../pages/admin/AdminSettings";

import NotFound from "../pages/NotFound";

// Simple guards that render <Outlet/> when allowed
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";

// Super-simple “inline layouts” so you don't need PublicLayout right now
function MinimalPublic({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>{children}</div>
  );
}
function MinimalAppShell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>{children}</div>
  );
}
function MinimalAdminShell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>{children}</div>
  );
}

const router = createBrowserRouter([
  {
    element: (
      <MinimalPublic>
        <div />
      </MinimalPublic>
    ),
    children: [
      { path: "/", element: <Landing /> },
      { path: "/auth/login", element: <Login /> },
      { path: "/auth/register", element: <Register /> },
      { path: "/auth/forgot-password", element: <ForgotPassword /> },
      { path: "/auth/reset-password/:token", element: <ResetPassword /> },
    ],
  },
  {
    element: <ProtectedRoute />, // must return <Outlet/> when authed
    children: [
      {
        element: (
          <MinimalAppShell>
            <div />
          </MinimalAppShell>
        ),
        children: [
          { path: "/dashboard", element: <Dashboard /> },
          { path: "/shops", element: <Shops /> },
          { path: "/shops/:id", element: <ShopDetails /> },
          { path: "/positions", element: <Positions /> },
          { path: "/wallet", element: <Wallet /> },
          { path: "/transactions", element: <Transactions /> },
          { path: "/kyc", element: <KYC /> },
          { path: "/bank-accounts", element: <BankAccounts /> },
          { path: "/transfers", element: <Transfers /> },
          { path: "/withdraw", element: <Withdraw /> },
          { path: "/settings", element: <Settings /> },
        ],
      },
    ],
  },
  {
    element: <AdminRoute />, // must return <Outlet/> when isAdmin
    children: [
      {
        element: (
          <MinimalAdminShell>
            <div />
          </MinimalAdminShell>
        ),
        children: [
          { path: "/admin", element: <AdminHome /> },
          { path: "/admin/shops", element: <AdminShops /> },
          { path: "/admin/users", element: <AdminUsers /> },
          { path: "/admin/kyc", element: <AdminKYC /> },
          { path: "/admin/withdrawals", element: <AdminWithdrawals /> },
          { path: "/admin/transactions", element: <AdminTransactions /> },
          { path: "/admin/reports", element: <AdminReports /> },
          { path: "/admin/settings", element: <AdminSettings /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
