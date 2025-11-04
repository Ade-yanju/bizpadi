import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ShopMarketplace() {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modal, setModal] = useState({ show: false, type: "", message: "" });

  const API_BASE =
    (typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_API_BASE_URL) ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000";

  const token = localStorage.getItem("token");

  /* ---------------- Fetch all shops ---------------- */
  useEffect(() => {
    const fetchShops = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/api/shops`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setShops(res.data.shops || []);
      } catch (err) {
        console.error("Error fetching shops:", err);
        setModal({
          show: true,
          type: "error",
          message:
            err.response?.data?.message ||
            "Failed to load shops. Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchShops();
  }, [API_BASE, token]);

  /* ---------------- Filter + Search ---------------- */
  const filtered = useMemo(() => {
    return shops.filter((shop) => {
      const matchesQuery = shop.name
        ?.toLowerCase()
        .includes(query.toLowerCase());
      const matchesCategory =
        categoryFilter === "All" || shop.category === categoryFilter;
      const matchesStatus =
        statusFilter === "All" || shop.status === statusFilter;
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [shops, query, categoryFilter, statusFilter]);

  /* ---------------- UI States ---------------- */
  if (loading)
    return (
      <div style={styles.loading}>
        <p>Loading shops...</p>
      </div>
    );

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>Virtual Shop Marketplace</h2>
      <p style={styles.subtext}>
        Explore verified businesses open for investment.
      </p>

      {/* Filters */}
      <div style={styles.filterBox}>
        <input
          type="text"
          placeholder="Search shops"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={styles.search}
        />

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={styles.select}
        >
          <option>All</option>
          <option>Technology</option>
          <option>Agriculture</option>
          <option>Fashion</option>
          <option>Food</option>
          <option>Services</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={styles.select}
        >
          <option>All</option>
          <option>Active</option>
          <option>Closed</option>
          <option>Fully Funded</option>
        </select>
      </div>

      {/* Shops Grid */}
      <div style={styles.grid}>
        {filtered.length === 0 ? (
          <p style={{ color: "#94a3b8", textAlign: "center" }}>
            No shops match your filters.
          </p>
        ) : (
          filtered.map((shop) => (
            <div key={shop._id} style={styles.card}>
              <div style={styles.cardBody}>
                <h3 style={styles.cardTitle}>{shop.name}</h3>
                <p style={styles.cardDesc}>{shop.description}</p>

                <p style={styles.cardMeta}>
                  Duration: <b>{shop.durationDays}</b> days <br />
                  Daily Return: <b>{shop.dailyPercent}%</b>
                </p>

                <p style={styles.cardMeta}>
                  ₦{shop.minAmount.toLocaleString()} – ₦
                  {shop.maxAmount.toLocaleString()}
                </p>

                <p
                  style={{
                    ...styles.status,
                    color:
                      shop.status === "Active"
                        ? "#22c55e"
                        : shop.status === "Fully Funded"
                        ? "#f59e0b"
                        : "#94a3b8",
                  }}
                >
                  {shop.status}
                </p>

                <button
                  style={{
                    ...styles.buyBtn,
                    opacity: shop.status === "Closed" ? 0.6 : 1,
                    cursor:
                      shop.status === "Closed" ? "not-allowed" : "pointer",
                  }}
                  onClick={() => navigate(`/shops/${shop._id}`)}
                  disabled={shop.status === "Closed"}
                >
                  {shop.status === "Active" ? "View & Invest" : "View Details"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for Error Handling */}
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
              {modal.type === "error" ? "Error" : "Message"}
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

/* ------- STYLES ------- */
const styles = {
  page: {
    fontFamily: "Inter, sans-serif",
    color: "#e2e8f0",
    padding: "1rem",
    maxWidth: "1200px",
    margin: "auto",
  },
  heading: {
    fontSize: "1.6rem",
    fontWeight: 800,
    marginBottom: "0.3rem",
    textAlign: "center",
  },
  subtext: { color: "#94a3b8", marginBottom: "1.2rem", textAlign: "center" },
  filterBox: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.6rem",
    marginBottom: "1.5rem",
    justifyContent: "center",
  },
  search: {
    flex: "1 1 200px",
    minWidth: "180px",
    padding: "0.65rem",
    borderRadius: "8px",
    backgroundColor: "#0b1220",
    color: "#fff",
    border: "1px solid #334155",
  },
  select: {
    padding: "0.65rem",
    borderRadius: "8px",
    backgroundColor: "#1e293b",
    color: "#e2e8f0",
    border: "1px solid #334155",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "1rem",
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: "12px",
    border: "1px solid #1f2937",
    transition: "transform .25s ease",
  },
  cardBody: { padding: "1rem" },
  cardTitle: { fontSize: "1.1rem", fontWeight: 700 },
  cardDesc: { color: "#94a3b8", margin: "0.3rem 0" },
  cardMeta: { fontSize: "0.9rem", color: "#cbd5e1" },
  status: { marginTop: "0.5rem", fontWeight: 700 },
  buyBtn: {
    width: "100%",
    backgroundColor: "#2563eb",
    padding: "0.65rem",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 700,
    marginTop: "0.6rem",
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    color: "#e2e8f0",
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
  error: { textAlign: "center", color: "#ef4444", padding: "2rem" },
};
