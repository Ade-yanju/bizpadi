import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

export default function UserLayout({ children }) {
  const navigate = useNavigate();

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Shops", path: "/shops" },
    { label: "Investments", path: "/investments" },
    { label: "Transactions", path: "/transactions" },
    { label: "Support", path: "/support" },
    { label: "KYC", path: "/kyc" },
    { label: "Profile", path: "/profile" },
  ];

  return (
    <div style={styles.wrapper}>
      {/* Top Navigation */}
      <div style={styles.navbar}>
        <div onClick={() => navigate("/dashboard")} style={styles.logo}>
          Virtual Shop
        </div>

        <div style={styles.navItems}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                ...styles.navLink,
                color: isActive ? "#38bdf8" : "#e2e8f0",
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div style={styles.profileArea}>
          <button
            style={styles.logoutBtn}
            onClick={() => navigate("/auth/login")}
          >
            Logout
          </button>

          <div style={styles.avatar}>U</div>
        </div>
      </div>

      {/* Screen Content */}
      <div style={styles.content}>{children}</div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    color: "#fff",
    fontFamily: "Inter, sans-serif",
  },
  navbar: {
    height: "70px",
    padding: "0 1.5rem",
    backgroundColor: "#1e293b",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #334155",
  },
  logo: {
    fontSize: "1.3rem",
    fontWeight: 700,
    cursor: "pointer",
    color: "#38bdf8",
  },
  navItems: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
  },
  navLink: {
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "0.95rem",
    transition: "0.2s",
  },
  profileArea: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#38bdf8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    cursor: "pointer",
  },
  logoutBtn: {
    backgroundColor: "#dc2626",
    border: "none",
    padding: "0.55rem 0.9rem",
    borderRadius: "8px",
    cursor: "pointer",
    color: "#fff",
    fontWeight: 600,
  },
  content: {
    padding: "1.5rem",
  },
};
