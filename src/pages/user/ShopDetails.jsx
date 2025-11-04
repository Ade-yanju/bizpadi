import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ShopDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [investAmount, setInvestAmount] = useState("");
  const [investing, setInvesting] = useState(false);
  const [modal, setModal] = useState({ show: false, type: "", message: "" });

  const API_BASE =
    (typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_API_BASE_URL) ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000";

  const token = localStorage.getItem("token");

  /* ---------------- Fetch Shop ---------------- */
  useEffect(() => {
    const fetchShop = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/api/shops/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setShop(res.data.shop);
      } catch (err) {
        console.error("Error fetching shop:", err);
        setModal({
          show: true,
          type: "error",
          message: "Failed to load shop details. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, [API_BASE, id, token]);

  /* ---------------- Handle Investment ---------------- */
  const handleInvest = async () => {
    if (!investAmount)
      return setModal({
        show: true,
        type: "error",
        message: "Please enter an amount to invest.",
      });

    if (investAmount < shop.minAmount)
      return setModal({
        show: true,
        type: "error",
        message: `Minimum investment is ₦${shop.minAmount.toLocaleString()}`,
      });

    if (investAmount > shop.maxAmount)
      return setModal({
        show: true,
        type: "error",
        message: `Maximum investment is ₦${shop.maxAmount.toLocaleString()}`,
      });

    try {
      setInvesting(true);
      const res = await axios.post(
        `${API_BASE}/api/investments`,
        { shopId: shop._id, amount: Number(investAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setModal({
        show: true,
        type: "success",
        message: res.data.message || "Investment successful ✅",
      });
      setInvestAmount("");
    } catch (err) {
      console.error("Investment failed:", err);
      setModal({
        show: true,
        type: "error",
        message:
          err.response?.data?.message ||
          "❌ Failed to complete investment. Please try again.",
      });
    } finally {
      setInvesting(false);
    }
  };

  /* ---------------- Loading / Empty States ---------------- */
  if (loading)
    return (
      <div style={styles.loading}>
        <p>Loading shop details...</p>
      </div>
    );

  if (!shop)
    return (
      <div style={styles.page}>
        <p style={{ textAlign: "center" }}>Shop not found.</p>
      </div>
    );

  const progress = (shop.filledSlots / shop.totalSlots) * 100 || 0;

  /* ---------------- UI ---------------- */
  return (
    <div style={styles.page}>
      <button onClick={() => navigate("/shops")} style={styles.backBtn}>
        ← Back to Marketplace
      </button>

      <h2 style={styles.title}>{shop.name}</h2>
      <p style={styles.desc}>{shop.description}</p>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <b>Duration:</b> {shop.durationDays} days
        </div>
        <div style={styles.statCard}>
          <b>Daily Return:</b> {shop.dailyPercent}%
        </div>
        <div style={styles.statCard}>
          <b>Min Investment:</b> ₦{shop.minAmount.toLocaleString()}
        </div>
        <div style={styles.statCard}>
          <b>Max Investment:</b> ₦{shop.maxAmount.toLocaleString()}
        </div>
        <div style={styles.statCard}>
          <b>Total Slots:</b> {shop.totalSlots}
        </div>
      </div>

      {/* Progress */}
      <div style={styles.progressBox}>
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressBar,
              width: `${progress}%`,
            }}
          ></div>
        </div>
        <p style={styles.progressText}>
          {Math.round(progress)}% filled ({shop.filledSlots}/{shop.totalSlots})
        </p>
      </div>

      {/* Invest Section */}
      <div style={styles.investBox}>
        <h3 style={styles.investTitle}>Invest Now</h3>
        <input
          type="number"
          value={investAmount}
          onChange={(e) => setInvestAmount(e.target.value)}
          placeholder="Enter amount"
          style={styles.input}
        />
        <button
          onClick={handleInvest}
          style={{
            ...styles.primaryBtn,
            opacity: investing || shop.status !== "Active" ? 0.6 : 1,
            cursor:
              investing || shop.status !== "Active" ? "not-allowed" : "pointer",
          }}
          disabled={investing || shop.status !== "Active"}
        >
          {investing ? "Processing..." : "Confirm Investment"}
        </button>
      </div>

      {/* Modal Feedback */}
      {modal.show && (
        <div style={styles.modalOverlay}>
          <div
            style={{
              ...styles.modal,
              borderColor:
                modal.type === "error" ? "#ef4444" : "rgba(34,197,94,0.6)",
            }}
          >
            <h3
              style={{
                color: modal.type === "error" ? "#ef4444" : "#22c55e",
                marginBottom: ".5rem",
              }}
            >
              {modal.type === "error" ? "Error" : "Success"}
            </h3>
            <p style={{ color: "#e2e8f0", marginBottom: "1rem" }}>
              {modal.message}
            </p>
            <button
              onClick={() => setModal({ show: false, type: "", message: "" })}
              style={styles.closeBtn}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Styles ---------- */
const styles = {
  page: {
    color: "#e2e8f0",
    fontFamily: "Inter, sans-serif",
    padding: "1rem",
    maxWidth: "700px",
    margin: "auto",
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    color: "#e2e8f0",
  },
  backBtn: {
    background: "none",
    color: "#60a5fa",
    border: "none",
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: "0.5rem",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 800,
    marginBottom: "0.3rem",
    textAlign: "center",
  },
  desc: { color: "#94a3b8", margin: "0.5rem 0 1rem", textAlign: "center" },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "0.8rem",
    marginBottom: "1rem",
  },
  statCard: {
    background: "#111827",
    border: "1px solid #1f2937",
    padding: "0.8rem",
    borderRadius: "8px",
    textAlign: "center",
  },
  progressBox: { marginTop: "1rem" },
  progressTrack: {
    height: "8px",
    borderRadius: "8px",
    background: "#1f2937",
    overflow: "hidden",
  },
  progressBar: { height: "8px", background: "#3b82f6", transition: "0.3s" },
  progressText: { fontSize: "0.85rem", color: "#94a3b8", marginTop: "0.3rem" },
  investBox: {
    marginTop: "1.5rem",
    background: "#111827",
    padding: "1rem",
    borderRadius: "12px",
    border: "1px solid #1f2937",
  },
  investTitle: {
    fontWeight: 700,
    marginBottom: "0.6rem",
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: "0.6rem",
    background: "#0b1220",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#fff",
    marginBottom: "0.8rem",
  },
  primaryBtn: {
    width: "100%",
    padding: "0.7rem",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: 700,
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    padding: "1rem",
  },
  modal: {
    backgroundColor: "#1e293b",
    borderRadius: "10px",
    padding: "1.5rem",
    width: "100%",
    maxWidth: "400px",
    textAlign: "center",
    border: "2px solid rgba(255,255,255,0.1)",
    boxShadow: "0 0 25px rgba(0,0,0,0.4)",
  },
  closeBtn: {
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: ".6rem 1.2rem",
    cursor: "pointer",
    fontWeight: "600",
  },
};
