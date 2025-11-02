import React from "react";

export default function Topbar() {
  return (
    <div style={styles.topbar}>
      <input type="text" placeholder="Search..." style={styles.search} />

      <div style={styles.profile}>
        <div style={styles.avatar}>A</div>
      </div>
    </div>
  );
}

const styles = {
  topbar: {
    height: "60px",
    backgroundColor: "#1e293b",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 1rem",
    color: "#fff",
  },
  search: {
    width: "250px",
    padding: "0.5rem",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#334155",
    color: "#fff",
  },
  profile: {
    display: "flex",
    alignItems: "center",
  },
  avatar: {
    backgroundColor: "#38bdf8",
    width: "35px",
    height: "35px",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "600",
    cursor: "pointer",
  },
};
