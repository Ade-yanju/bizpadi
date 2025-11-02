// src/routes/AdminRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { isAdmin } from "../services/auth";

export default function AdminRoute() {
  return isAdmin() ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
