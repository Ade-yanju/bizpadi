import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function TransactionsAnalytics() {
  const [transactions, setTransactions] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("All");
  const [dateRange, setDateRange] = useState("30");

  const API_BASE =
    import.meta.env?.VITE_API_BASE_URL ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000";

  const token = localStorage.getItem("token");

  /* --------------------------------------------
     1️⃣ Fetch transactions & investments
  -------------------------------------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [txRes, investRes] = await Promise.all([
          axios.get(`${API_BASE}/api/wallet/transactions`, { headers }),
          axios.get(`${API_BASE}/api/investments`, { headers }),
        ]);
        setTransactions(txRes.data.transactions || []);
        setInvestments(investRes.data.investments || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load analytics data.");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [API_BASE, token]);

  /* --------------------------------------------
     2️⃣ Derived metrics
  -------------------------------------------- */
  const categorizedTotals = useMemo(() => {
    const sums = {
      deposit: 0,
      withdrawal: 0,
      investment: 0,
      income: 0,
      transfer: 0,
    };
    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type && sums[tx.type] !== undefined) sums[tx.type] += amt;
    });
    return sums;
  }, [transactions]);

  const totalDeposited = categorizedTotals.deposit;
  const totalWithdrawn = categorizedTotals.withdrawal;
  const totalInvested = categorizedTotals.investment;
  const totalTransfer = categorizedTotals.transfer;

  // Calculate income generated from investments
  const totalIncomeGenerated = useMemo(() => {
    return investments.reduce(
      (sum, i) => sum + Number(i.profit || i.dailyIncome || 0),
      0
    );
  }, [investments]);

  const totalIncome = categorizedTotals.income + totalIncomeGenerated;
  const netFlow =
    totalDeposited + totalIncome - (totalWithdrawn + totalInvested);

  /* --------------------------------------------
     3️⃣ Filtering
  -------------------------------------------- */
  const filteredTx = useMemo(() => {
    let filtered = transactions;
    if (category !== "All")
      filtered = filtered.filter((t) => t.type === category);

    if (dateRange !== "All") {
      const days = parseInt(dateRange, 10);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      filtered = filtered.filter((t) => new Date(t.createdAt) >= cutoff);
    }
    return filtered.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [transactions, category, dateRange]);

  /* --------------------------------------------
     4️⃣ Chart Data
  -------------------------------------------- */
  const chartData = useMemo(() => {
    const daily = {};
    filteredTx.forEach((tx) => {
      const day = new Date(tx.createdAt).toLocaleDateString();
      if (!daily[day]) daily[day] = 0;
      daily[day] += tx.type === "withdrawal" ? -tx.amount : tx.amount;
    });
    return Object.keys(daily).map((date) => ({
      date,
      amount: daily[date],
    }));
  }, [filteredTx]);

  /* --------------------------------------------
     5️⃣ Export to CSV
  -------------------------------------------- */
  const exportToCSV = () => {
    if (!filteredTx.length) return alert("No data to export!");
    const headers = ["Type", "Amount", "Status", "Date"];
    const rows = filteredTx.map((t) => [
      t.type,
      t.amount,
      t.status,
      new Date(t.createdAt).toLocaleString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "transactions.csv";
    link.click();
  };

  /* --------------------------------------------
     6️⃣ Print Transactions
  -------------------------------------------- */
  const printTable = () => window.print();

  /* --------------------------------------------
     7️⃣ UI
  -------------------------------------------- */
  if (loading)
    return (
      <div style={styles.loading}>
        <p>Loading analytics...</p>
      </div>
    );

  if (error)
    return (
      <div style={styles.error}>
        <p>{error}</p>
      </div>
    );

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>📊 Transaction Analytics</h1>
      <p style={styles.subtitle}>
        Complete breakdown of your deposits, withdrawals, investments, and
        income generation.
      </p>

      {/* Summary */}
      <div style={styles.statsRow}>
        {[
          { label: "Deposited", value: totalDeposited, color: "#22c55e" },
          { label: "Withdrawn", value: totalWithdrawn, color: "#ef4444" },
          { label: "Invested", value: totalInvested, color: "#3b82f6" },
          { label: "Income", value: totalIncome, color: "#facc15" },
          { label: "Net Flow", value: netFlow, color: "#a78bfa" },
        ].map((s, i) => (
          <div key={i} style={{ ...styles.statCard, borderColor: s.color }}>
            <p style={{ ...styles.statLabel, color: s.color }}>{s.label}</p>
            <p style={styles.statValue}>₦{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={styles.filterRow}>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={styles.select}
        >
          <option>All</option>
          <option>deposit</option>
          <option>withdrawal</option>
          <option>investment</option>
          <option>income</option>
          <option>transfer</option>
        </select>

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          style={styles.select}
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="All">All Time</option>
        </select>

        <div style={styles.exportBtns}>
          <button style={styles.exportBtn} onClick={exportToCSV}>
            ⬇️ Export CSV
          </button>
          <button style={styles.printBtn} onClick={printTable}>
            🖨️ Print
          </button>
        </div>
      </div>

      {/* Chart */}
      <div style={styles.chartCard}>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="4 4" />
            <XAxis dataKey="date" tick={{ fill: "#94a3b8" }} />
            <YAxis tick={{ fill: "#94a3b8" }} />
            <Tooltip
              contentStyle={styles.tooltip}
              formatter={(v) => `₦${v.toLocaleString()}`}
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#38bdf8"
              strokeWidth={2.2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        <h3 style={styles.sectionTitle}>All Transactions</h3>
        {filteredTx.length === 0 ? (
          <p style={styles.empty}>No transactions found.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Amount (₦)</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredTx.map((t) => (
                <tr key={t._id} style={styles.tr}>
                  <td style={styles.td}>{t.type}</td>
                  <td
                    style={{
                      ...styles.td,
                      color:
                        t.type === "withdrawal"
                          ? "#ef4444"
                          : t.type === "deposit"
                          ? "#22c55e"
                          : t.type === "income"
                          ? "#facc15"
                          : "#3b82f6",
                    }}
                  >
                    {t.amount.toLocaleString()}
                  </td>
                  <td style={styles.td}>{t.status}</td>
                  <td style={styles.td}>
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ---------- Styles ---------- */
const styles = {
  page: {
    color: "#e2e8f0",
    fontFamily: "Inter, sans-serif",
    padding: "1rem",
  },
  title: { fontSize: "1.5rem", fontWeight: 800 },
  subtitle: { color: "#94a3b8", marginBottom: "1.2rem" },
  statsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.8rem",
    marginBottom: "1rem",
  },
  statCard: {
    flex: "1 1 150px",
    background: "#0b1220",
    border: "2px solid",
    borderRadius: "10px",
    padding: "0.8rem",
  },
  statLabel: { fontSize: "0.9rem", fontWeight: 600 },
  statValue: { fontSize: "1.3rem", fontWeight: 800, marginTop: "0.3rem" },
  filterRow: {
    display: "flex",
    gap: "0.8rem",
    marginBottom: "1rem",
    flexWrap: "wrap",
  },
  select: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "0.6rem",
    color: "#fff",
  },
  exportBtns: { marginLeft: "auto", display: "flex", gap: "0.5rem" },
  exportBtn: {
    background: "#22c55e",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "0.6rem 1rem",
    cursor: "pointer",
    fontWeight: 700,
  },
  printBtn: {
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "0.6rem 1rem",
    cursor: "pointer",
    fontWeight: 700,
  },
  chartCard: {
    background: "#0b1220",
    border: "1px solid #1f2937",
    borderRadius: "12px",
    padding: "1rem",
    marginBottom: "1rem",
  },
  tableCard: {
    background: "#0b1220",
    border: "1px solid #1f2937",
    borderRadius: "12px",
    padding: "1rem",
  },
  sectionTitle: { fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.8rem" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "0.6rem",
    borderBottom: "1px solid #1f2937",
    color: "#94a3b8",
  },
  tr: { borderBottom: "1px dashed #1f2937" },
  td: { padding: "0.6rem" },
  empty: { color: "#94a3b8" },
  tooltip: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "6px",
    color: "#fff",
  },
  loading: { textAlign: "center", padding: "2rem", color: "#e2e8f0" },
  error: { textAlign: "center", color: "#ef4444", padding: "2rem" },
};
