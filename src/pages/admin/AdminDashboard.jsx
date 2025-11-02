import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE =
    (typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_API_BASE_URL) ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000";

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get(`${API_BASE}/api/admin/overview`, {
          headers,
        });
        setStats(res.data);

        // Generate light chart mock from invested total
        const today = new Date();
        const data = Array.from({ length: 10 }).map((_, i) => ({
          date: new Date(today.setDate(today.getDate() - i)).toLocaleDateString(
            "en-US",
            { month: "short", day: "numeric" }
          ),
          earnings:
            (res.data.totalInvested || 0) / 20 +
            Math.random() * ((res.data.totalInvested || 1000) / 50),
        }));
        setChartData(data.reverse());
      } catch (err) {
        console.error("Admin dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_BASE, token]);

  if (loading)
    return (
      <div style={styles.loadingPage}>
        <p>Loading admin data...</p>
      </div>
    );

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Admin Dashboard</h1>

      {/* KPI GRID */}
      <div style={styles.kpiGrid}>
        <KpiCard
          title="Total Users"
          value={stats.users?.toLocaleString()}
          onClick={() => navigate("/admin/users")}
        />
        <KpiCard
          title="Active Shops"
          value={stats.shops?.toLocaleString()}
          onClick={() => navigate("/admin/shops")}
        />
        <KpiCard
          title="Total Invested"
          value={`₦${(stats.totalInvested || 0).toLocaleString()}`}
          onClick={() => navigate("/admin/fund-transfer")}
        />
      </div>

      {/* CHART + ACTIVITY */}
      <div style={styles.twoCol}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Investment Trend</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeOpacity={0.15} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#cbd5e1", fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: "#cbd5e1", fontSize: 12 }}
                  tickFormatter={(v) => `₦${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  contentStyle={styles.tooltip}
                  labelStyle={{ color: "#cbd5e1" }}
                  formatter={(v) => [`₦${v.toLocaleString()}`, "Earnings"]}
                />
                <Line
                  type="monotone"
                  dataKey="earnings"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Recent Activity</h3>
          {stats.recentTransactions?.length > 0 ? (
            stats.recentTransactions.slice(0, 5).map((tx) => (
              <div key={tx._id} style={styles.txRow}>
                <span>{tx.type}</span>
                <span
                  style={{
                    color: tx.amount >= 0 ? "#22c55e" : "#ef4444",
                    fontWeight: 600,
                  }}
                >
                  {tx.amount >= 0 ? "+" : "-"}₦
                  {Math.abs(tx.amount).toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <p style={styles.empty}>No recent transactions</p>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div style={styles.actions}>
        <button
          style={styles.actionBtn}
          onClick={() => navigate("/admin/shops")}
        >
          🏬 Manage Shops
        </button>
        <button
          style={styles.actionBtn}
          onClick={() => navigate("/admin/withdrawals")}
        >
          💸 Review Withdrawals
        </button>
        <button
          style={styles.actionBtn}
          onClick={() => navigate("/admin/users")}
        >
          👥 View Users
        </button>
      </div>
    </div>
  );
}

/* --- KPI CARD --- */
function KpiCard({ title, value, onClick }) {
  return (
    <div style={styles.card} onClick={onClick}>
      <p style={styles.kpiTitle}>{title}</p>
      <h2 style={styles.kpiValue}>{value}</h2>
    </div>
  );
}

/* --- STYLES --- */
const styles = {
  page: {
    padding: "1rem",
    color: "#e2e8f0",
    fontFamily: "Inter, sans-serif",
  },
  heading: {
    fontSize: "1.8rem",
    fontWeight: 800,
    marginBottom: "1rem",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "1rem",
    marginBottom: "1.2rem",
  },
  card: {
    backgroundColor: "#111827",
    border: "1px solid #1f2937",
    borderRadius: "12px",
    padding: "1rem",
    transition: "transform 0.2s",
    cursor: "pointer",
  },
  kpiTitle: { color: "#94a3b8", fontSize: "0.9rem" },
  kpiValue: {
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#38bdf8",
    marginTop: "0.2rem",
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: "1rem",
    marginBottom: "1.2rem",
  },
  cardTitle: { fontWeight: 700, marginBottom: "0.6rem" },
  txRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0.5rem 0",
    borderBottom: "1px dashed #1f2937",
  },
  tooltip: {
    backgroundColor: "#0b1220",
    border: "1px solid #1f2937",
    color: "#fff",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.6rem",
  },
  actionBtn: {
    backgroundColor: "#2563eb",
    border: "none",
    color: "#fff",
    borderRadius: "8px",
    padding: "0.7rem 1rem",
    fontWeight: 600,
    cursor: "pointer",
    flex: "1 1 200px",
  },
  empty: { color: "#94a3b8", fontSize: "0.9rem", padding: "0.4rem 0" },
  loadingPage: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    color: "#e2e8f0",
  },
};
