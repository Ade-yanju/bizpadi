// src/App.js
import React from "react";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";

// PAGES
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

import Dashboard from "./pages/app/Dashboard";
import Shops from "./pages/app/Shops";
import ShopDetails from "./pages/app/ShopDetails";
import Positions from "./pages/app/Positions";
import Wallet from "./pages/app/Wallet";
import Transactions from "./pages/app/Transactions";
import KYC from "./pages/app/KYC";
import BankAccounts from "./pages/app/BankAccounts";
import Transfers from "./pages/app/Transfers";
import Withdraw from "./pages/app/Withdraw";
import Settings from "./pages/app/Settings";

import AdminHome from "./pages/admin/AdminHome";
import AdminShops from "./pages/admin/AdminShops";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminKYC from "./pages/admin/AdminKYC";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";

import NotFound from "./pages/NotFound";

// GUARDS (must return <Outlet/> when allowed)
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";

// Minimal shells (not layouts; just provide an Outlet)
function PublicShell() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Outlet />
    </div>
  );
}
function AppShell() {
  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <Outlet />
    </div>
  );
}
function AdminShell() {
  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <Outlet />
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <PublicShell />,
    children: [
      { path: "/", element: <Landing /> },
      { path: "/auth/login", element: <Login /> },
      { path: "/auth/register", element: <Register /> },
      { path: "/auth/forgot-password", element: <ForgotPassword /> },
      { path: "/auth/reset-password/:token", element: <ResetPassword /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
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
    element: <AdminRoute />,
    children: [
      {
        element: <AdminShell />,
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

export default function App() {
  return <RouterProvider router={router} />;
}
