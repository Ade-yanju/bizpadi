import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export default function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [maintenanceMsg, setMaintenanceMsg] = useState("");
  const [modal, setModal] = useState({ show: false, type: "", message: "" });

  const API_BASE =
    import.meta.env?.VITE_API_BASE_URL ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000";

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  /* ------------------ FETCH ALL DASHBOARD DATA ------------------ */
  const fetchAll = async () => {
    try {
      setLoading(true);
      const [userRes, walletRes, investRes, txRes, settingsRes] =
        await Promise.all([
          axios.get(`${API_BASE}/api/auth/me`, { headers }),
          axios.get(`${API_BASE}/api/wallet`, { headers }),
          axios.get(`${API_BASE}/api/investments`, { headers }),
          axios.get(`${API_BASE}/api/wallet/transactions`, { headers }),
          axios.get(`${API_BASE}/api/admin/settings/system`, { headers }),
        ]);

      const fetchedUser = userRes.data.user;
      setUser(fetchedUser);
      setWallet(walletRes.data.wallet);
      setInvestments(investRes.data.investments || []);
      setTransactions(txRes.data.transactions || []);

      // save user name globally to sync with profile updates
      if (fetchedUser?.name) localStorage.setItem("userName", fetchedUser.name);

      const settingsObj = {};
      settingsRes.data.forEach((s) => (settingsObj[s.key] = s.value));
      setSettings(settingsObj);

      setMaintenanceMsg(
        settingsObj.maintenance_mode
          ? settingsObj.maintenance_message ||
              "⚙️ The system is under maintenance."
          : ""
      );
    } catch (err) {
      console.error("Dashboard load error:", err);
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/auth/login");
      } else {
        setModal({
          show: true,
          type: "error",
          message:
            err.response?.data?.message ||
            "Failed to load dashboard data. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();

    // Auto-refresh every 30s
    const interval = setInterval(fetchAll, 30000);

    // Live update when name changes in Profile
    const handleNameChange = () => {
      const newName = localStorage.getItem("userName");
      setUser((prev) => ({ ...prev, name: newName }));
    };
    window.addEventListener("storage", handleNameChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleNameChange);
    };
  }, [token]);

  /* ------------------ COMPUTED METRICS ------------------ */
  const totalPortfolioValue = useMemo(
    () => investments.reduce((sum, i) => sum + (i.currentValue || 0), 0),
    [investments]
  );

  const todaysProfit = useMemo(
    () => investments.reduce((sum, i) => sum + (i.profit || 0), 0),
    [investments]
  );

  const pieData = investments.map((i) => ({
    name: i.shopName || i.name,
    value: i.currentValue || 0,
  }));

  const COLORS = ["#38bdf8", "#22c55e", "#f97316", "#eab308", "#a855f7"];

  /* ------------------ UI ------------------ */
  if (loading)
    return (
      <div style={styles.loadingPage}>
        <p>Loading your dashboard...</p>
      </div>
    );

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.headerBox}>
        <h1 style={styles.welcome}>
          Welcome back, {user?.name?.split(" ")[0] || "User"} 👋
        </h1>
        <p style={styles.sub}>
          Here’s an overview of your wallet, investments, and performance.
        </p>
      </div>

      {/* Maintenance Notice */}
      {settings.maintenance_mode && (
        <div style={styles.maintenanceBanner}>
          <p>{maintenanceMsg}</p>
        </div>
      )}

      {/* Metrics Summary */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <p style={styles.metricLabel}>Wallet Balance</p>
          <p style={styles.metricValue}>
            ₦{(wallet?.balance || 0).toLocaleString()}
          </p>
        </div>
        <div style={styles.metricCard}>
          <p style={styles.metricLabel}>Portfolio Value</p>
          <p style={styles.metricValue}>
            ₦{totalPortfolioValue.toLocaleString()}
          </p>
        </div>
        <div style={styles.metricCard}>
          <p style={styles.metricLabel}>Today’s Profit</p>
          <p
            style={{
              ...styles.metricValue,
              color: todaysProfit >= 0 ? "#22c55e" : "#ef4444",
            }}
          >
            {todaysProfit >= 0 ? "+" : "-"}₦{Math.abs(todaysProfit).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={styles.actionRow}>
        <button style={styles.primaryBtn} onClick={() => navigate("/deposit")}>
          💳 Deposit
        </button>
        <button
          style={styles.secondaryBtn}
          onClick={() => navigate("/withdraw")}
        >
          💸 Withdraw
        </button>
        <button style={styles.secondaryBtn} onClick={() => navigate("/shops")}>
          🏪 Explore Shops
        </button>
      </div>

      {/* Grid Layout */}
      <div style={styles.dashboardGrid}>
        {/* Investments List */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>My Investments</h3>
          {investments.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Shop</th>
                    <th style={styles.th}>Shares</th>
                    <th style={styles.th}>Value</th>
                    <th style={styles.th}>Profit/Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.map((inv) => (
                    <tr key={inv._id}>
                      <td style={styles.td}>{inv.shopName}</td>
                      <td style={styles.td}>{inv.shares}</td>
                      <td style={styles.td}>
                        ₦{(inv.currentValue || 0).toLocaleString()}
                      </td>
                      <td
                        style={{
                          ...styles.td,
                          color:
                            inv.profit && inv.profit >= 0
                              ? "#22c55e"
                              : "#ef4444",
                        }}
                      >
                        {inv.profit >= 0 ? "+" : "-"}₦
                        {Math.abs(inv.profit || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={styles.emptyText}>No active investments yet.</p>
          )}
          <button
            style={styles.linkBtn}
            onClick={() => navigate("/investments")}
          >
            View All →
          </button>
        </div>

        {/* Portfolio Pie */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Portfolio Breakdown</h3>
          {pieData.length > 0 ? (
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" outerRadius={100}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={styles.tooltip}
                    formatter={(v, name) => [`₦${v.toLocaleString()}`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={styles.emptyText}>No investments yet to chart.</p>
          )}
        </div>
      </div>

      {/* Transactions */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Recent Transactions</h3>
        {transactions.length > 0 ? (
          transactions.slice(0, 5).map((t) => (
            <div key={t._id} style={styles.txRow}>
              <span>{t.type}</span>
              <span
                style={{
                  color: t.amount >= 0 ? "#22c55e" : "#ef4444",
                  fontWeight: 700,
                }}
              >
                {t.amount >= 0 ? "+" : "-"}₦
                {Math.abs(t.amount).toLocaleString()}
              </span>
            </div>
          ))
        ) : (
          <p style={styles.emptyText}>No transactions yet.</p>
        )}
        <button
          style={styles.linkBtn}
          onClick={() => navigate("/transactions")}
        >
          View All →
        </button>
      </div>

      {/* Modal for Errors */}
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
              {modal.type === "error" ? "Error" : "Notice"}
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
    padding: "1.5rem",
    maxWidth: "1200px",
    margin: "auto",
    width: "100%",
  },
  headerBox: { textAlign: "center", marginBottom: "1.5rem" },
  welcome: { fontSize: "1.8rem", fontWeight: 800, marginBottom: ".3rem" },
  sub: { color: "#94a3b8", fontSize: "0.95rem" },
  maintenanceBanner: {
    background: "#7f1d1d",
    color: "#fecaca",
    border: "1px solid #b91c1c",
    borderRadius: "8px",
    padding: "0.8rem",
    marginBottom: "1rem",
    fontWeight: 600,
    textAlign: "center",
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  metricCard: {
    backgroundColor: "#111827",
    borderRadius: "12px",
    padding: "1rem",
    border: "1px solid #1f2937",
    textAlign: "center",
  },
  metricLabel: { color: "#94a3b8", marginBottom: "0.3rem" },
  metricValue: { fontSize: "1.5rem", fontWeight: 800, color: "#38bdf8" },
  actionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.8rem",
    justifyContent: "center",
    marginBottom: "1.5rem",
  },
  primaryBtn: {
    backgroundColor: "#2563eb",
    padding: "0.75rem 1.2rem",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    color: "#fff",
  },
  secondaryBtn: {
    backgroundColor: "#1f2937",
    border: "1px solid #334155",
    padding: "0.75rem 1.2rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
    color: "#fff",
  },
  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "1rem",
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: "12px",
    padding: "1rem",
    border: "1px solid #1f2937",
  },
  "@media (min-width: 768px)": {
    dashboardGrid: {
      gridTemplateColumns: "2fr 1fr",
    },
  },
  cardTitle: { fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.8rem" },
  table: { width: "100%", borderSpacing: 0 },
  th: {
    textAlign: "left",
    color: "#94a3b8",
    padding: "0.6rem",
    borderBottom: "1px solid #1f2937",
  },
  td: { padding: "0.6rem" },
  emptyText: {
    color: "#64748b",
    fontSize: "0.9rem",
    padding: "0.5rem 0",
    textAlign: "center",
  },
  tooltip: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "6px",
    color: "#e2e8f0",
    fontSize: "0.85rem",
  },
  txRow: {
    display: "flex",
    justifyContent: "space-between",
    borderBottom: "1px dashed #1f2937",
    padding: "0.6rem 0",
    fontSize: "0.95rem",
  },
  linkBtn: {
    display: "block",
    margin: "0.5rem auto 0",
    background: "none",
    border: "none",
    color: "#3b82f6",
    cursor: "pointer",
    fontWeight: 600,
  },
  loadingPage: {
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
};
