import React from "react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";

export default function AdminLayout({ children }) {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ flex: 1, backgroundColor: "#0f172a" }}>
        <Topbar />
        <div style={{ padding: "1.5rem", color: "#fff" }}>{children}</div>
      </div>
    </div>
  );
}
