// src/routes/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { isLoggedIn } from "../services/auth"; // make sure this returns boolean

export default function ProtectedRoute() {
  return isLoggedIn() ? <Outlet /> : <Navigate to="/auth/login" replace />;
}
