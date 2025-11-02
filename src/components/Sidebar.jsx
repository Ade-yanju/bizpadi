import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: "Dashboard", path: "/admin/home" },
    { label: "User Management", path: "/admin/users" },
    { label: "Virtual Shops", path: "/admin/shops" },
    { label: "Fund Transfer", path: "/admin/fund-transfer" },
    { label: "Withdrawals", path: "/admin/withdrawals" },
    { label: "KYC", path: "/admin/kyc" },
    { label: "Settings", path: "/admin/settings" },
    { label: "Support", path: "/admin/support" },
  ];

  return (
    <div style={styles.sidebar}>
      <h2 style={styles.logo}>Admin</h2>

      <nav>
        {menuItems.map((menu) => (
          <div
            key={menu.path}
            onClick={() => navigate(menu.path)}
            style={{
              ...styles.menuItem,
              backgroundColor:
                location.pathname === menu.path ? "#1e293b" : "transparent",
            }}
          >
            {menu.label}
          </div>
        ))}
      </nav>

      <div style={styles.logout} onClick={() => navigate("/auth/login")}>
        Logout
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: "240px",
    backgroundColor: "#0f172a",
    color: "#fff",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "100vh",
  },
  logo: {
    color: "#38bdf8",
    fontWeight: "700",
    fontSize: "1.4rem",
    marginBottom: "2rem",
  },
  menuItem: {
    padding: "0.8rem 1rem",
    borderRadius: "8px",
    cursor: "pointer",
    marginBottom: "0.5rem",
    fontSize: "0.95rem",
    transition: "0.2s",
  },
  logout: {
    backgroundColor: "#dc2626",
    padding: "0.75rem",
    textAlign: "center",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
};
