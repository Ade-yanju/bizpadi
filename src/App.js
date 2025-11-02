// client/src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import ShopyLanding from "./components/ShopyLanding";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

import UserLayout from "./layouts/UserLayout";
import UserDashboard from "./pages/user/UserDashboard";
import ShopMarketplace from "./pages/user/ShopMarketplace";
import Transactions from "./pages/user/Transactions";
import ShopDetails from "./pages/user/ShopDetails";
import DepositFunds from "./pages/user/DepositFunds";
import MyInvestments from "./pages/user/MyInvestments";
import WithdrawFunds from "./pages/user/WithdrawFunds";
import FundTransfer from "./pages/user/FundTransfer";
import KYCVerification from "./pages/user/KYCVerification";
import Profile from "./pages/user/Profile";
import Support from "./pages/user/Support";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import VirtualShops from "./pages/admin/VirtualShops";
import Users from "./pages/admin/Users";
import Withdrawals from "./pages/admin/Withdrawals";
import FundTransferAdmin from "./pages/admin/FundTransfer";
import AdminKYC from "./pages/admin/AdminKYC";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminSupport from "./pages/admin/AdminSupport";

import Maintenance from "./pages/Maintenance";

const API_BASE =
  import.meta.env?.VITE_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  if (!token || !role) return <Navigate to="/auth/login" replace />;
  if (role === "admin") return <Navigate to="/admin/home" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  if (!token) return <Navigate to="/auth/login" replace />;
  if (role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
};

export default function App() {
  const [maintenance, setMaintenance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/admin/settings/system`);
        if (cancelled) return;
        // server returns array of settings
        const arr = Array.isArray(res.data) ? res.data : [];
        const map = {};
        arr.forEach((r) => (map[r.key] = r.value));
        const now = Date.now();
        const start = map.maintenance_start
          ? new Date(map.maintenance_start).getTime()
          : null;
        const end = map.maintenance_end
          ? new Date(map.maintenance_end).getTime()
          : null;
        const inWindow = start && end ? now >= start && now <= end : false;
        const active = map.maintenance_mode || inWindow;
        if (active) {
          setMaintenance({
            message: map.maintenance_message,
            start: map.maintenance_start,
            end: map.maintenance_end,
          });
        } else {
          setMaintenance(null);
        }
      } catch (err) {
        console.warn("Could not fetch system settings:", err.message || err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => (cancelled = true);
  }, []);

  // If maintenance AND user is not admin, render maintenance page
  const role = localStorage.getItem("role");
  if (!loading && maintenance && role !== "admin") {
    return (
      <Maintenance
        message={maintenance.message}
        start={maintenance.start}
        end={maintenance.end}
      />
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<ShopyLanding />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password/:token" element={<ResetPassword />} />

        {/* User */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserLayout>
                <UserDashboard />
              </UserLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/shops"
          element={
            <ProtectedRoute>
              <UserLayout>
                <ShopMarketplace />
              </UserLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/support"
          element={
            <ProtectedRoute>
              <UserLayout>
                <Support />
              </UserLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/investments"
          element={
            <ProtectedRoute>
              <UserLayout>
                <MyInvestments />
              </UserLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <UserLayout>
                <Transactions />
              </UserLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/deposit"
          element={
            <ProtectedRoute>
              <UserLayout>
                <DepositFunds />
              </UserLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/withdraw"
          element={
            <ProtectedRoute>
              <UserLayout>
                <WithdrawFunds />
              </UserLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/transfer"
          element={
            <ProtectedRoute>
              <UserLayout>
                <FundTransfer />
              </UserLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/shops/:id"
          element={
            <ProtectedRoute>
              <UserLayout>
                <ShopDetails />
              </UserLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/kyc"
          element={
            <ProtectedRoute>
              <UserLayout>
                <KYCVerification />
              </UserLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserLayout>
                <Profile />
              </UserLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin/home"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/shops"
          element={
            <AdminRoute>
              <AdminLayout>
                <VirtualShops />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/kyc"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminKYC />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/support"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminSupport />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminLayout>
                <Users />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/withdrawals"
          element={
            <AdminRoute>
              <AdminLayout>
                <Withdrawals />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminSettings />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/fund-transfer"
          element={
            <AdminRoute>
              <AdminLayout>
                <FundTransferAdmin />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="*"
          element={
            <div style={{ padding: 20, color: "#fff" }}>Page Not Found</div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
