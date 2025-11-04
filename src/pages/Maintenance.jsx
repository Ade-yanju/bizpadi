import React, { useEffect, useState } from "react";

export default function Maintenance({ message, start, end }) {
  const [remaining, setRemaining] = useState("");
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (!end) return;

    const interval = setInterval(() => {
      const diff = new Date(end) - new Date();

      if (diff <= 0) {
        setRemaining("Maintenance window completed.");
        setEnded(true);
        clearInterval(interval);
        return;
      }

      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      setRemaining(`${hrs}h ${mins}m ${secs}s remaining`);
    }, 1000);

    return () => clearInterval(interval);
  }, [end]);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>🚧 Under Maintenance</h1>
        <p style={styles.text}>
          {message || "We’re upgrading the system for better performance."}
        </p>

        {remaining && (
          <p
            style={{
              ...styles.countdown,
              color: ended ? "#22c55e" : "#60a5fa",
            }}
          >
            {remaining}
          </p>
        )}

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

        {ended && (
          <button onClick={handleRetry} style={styles.retryBtn}>
            🔄 Try Again
          </button>
        )}

        <div style={styles.footer}>
          © {new Date().getFullYear()} VelvPay Systems — All Rights Reserved.
        </div>
      </div>
    </div>
  );
}

/* ---------- Styles ---------- */
const styles = {
  wrapper: {
    backgroundColor: "#0f172a",
    color: "#e2e8f0",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    padding: "1.5rem",
    textAlign: "center",
  },
  card: {
    background: "linear-gradient(180deg, #111827 0%, #0b1220 100%)",
    padding: "2rem 1.5rem",
    borderRadius: "12px",
    border: "1px solid #1f2937",
    boxShadow: "0 0 25px rgba(0,0,0,0.5)",
    maxWidth: "420px",
    width: "100%",
    animation: "pulse 3s infinite ease-in-out",
  },
  title: {
    fontSize: "1.8rem",
    fontWeight: 800,
    marginBottom: "1rem",
    color: "#38bdf8",
  },
  text: {
    color: "#cbd5e1",
    marginBottom: "1rem",
    fontSize: "1rem",
    lineHeight: "1.5",
  },
  countdown: {
    fontWeight: 700,
    marginBottom: "0.5rem",
    transition: "all 0.3s ease",
  },
  small: {
    color: "#64748b",
    fontSize: "0.85rem",
    marginTop: "0.3rem",
  },
  retryBtn: {
    marginTop: "1rem",
    background: "#2563eb",
    border: "none",
    padding: "0.7rem 1.2rem",
    borderRadius: "8px",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 0.2s ease",
  },
  footer: {
    color: "#475569",
    fontSize: "0.8rem",
    marginTop: "1.5rem",
  },
};

/* Add animation */
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(
  `
  @keyframes pulse {
    0% { box-shadow: 0 0 20px rgba(59,130,246,0.1); }
    50% { box-shadow: 0 0 30px rgba(59,130,246,0.3); }
    100% { box-shadow: 0 0 20px rgba(59,130,246,0.1); }
  }
`,
  styleSheet.cssRules.length
);
