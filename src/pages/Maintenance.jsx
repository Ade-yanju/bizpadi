import React, { useEffect, useState } from "react";

export default function Maintenance({ message, start, end }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      if (!end) return;
      const diff = new Date(end) - new Date();
      if (diff <= 0) {
        setRemaining("We’ll be back any moment!");
        clearInterval(interval);
        return;
      }
      const hrs = Math.floor(diff / 1000 / 3600);
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      setRemaining(`${hrs}h ${mins}m ${secs}s remaining`);
    }, 1000);

    return () => clearInterval(interval);
  }, [end]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>🚧 Under Maintenance</h1>
        <p style={styles.text}>
          {message || "We’re upgrading for a better experience."}
        </p>
        {remaining && <p style={styles.countdown}>{remaining}</p>}
        {start && (
          <p style={styles.small}>
            Started: {new Date(start).toLocaleString()}
          </p>
        )}
        {end && (
          <p style={styles.small}>
            Expected End: {new Date(end).toLocaleString()}
          </p>
        )}
        <div style={styles.footer}>
          © {new Date().getFullYear()} VelvPay Systems
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    backgroundColor: "#0f172a",
    color: "#e2e8f0",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
  },
  card: {
    textAlign: "center",
    background: "#111827",
    padding: "2rem 3rem",
    borderRadius: "12px",
    border: "1px solid #1f2937",
    boxShadow: "0 0 40px rgba(0,0,0,0.4)",
  },
  title: { fontSize: "2rem", fontWeight: 800, marginBottom: "1rem" },
  text: { color: "#94a3b8", marginBottom: "1rem", fontSize: "1rem" },
  countdown: { color: "#60a5fa", fontWeight: 700, marginBottom: "0.5rem" },
  small: { color: "#64748b", fontSize: "0.85rem" },
  footer: { color: "#475569", fontSize: "0.8rem", marginTop: "1rem" },
};
