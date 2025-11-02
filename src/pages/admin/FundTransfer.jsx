import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

export default function FundTransfer() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [walletFilter, setWalletFilter] = useState("All");
  const [sort, setSort] = useState("-createdAt");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_BASE =
    (typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_API_BASE_URL) ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000";
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    from: "",
    to: "",
    amount: "",
    wallet: "Main Wallet",
  });

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        pageSize,
        sort,
      };
      if (query) params.q = query;
      if (statusFilter !== "All") params.status = statusFilter;
      if (walletFilter !== "All") params.wallet = walletFilter;

      const res = await axios.get(`${API_BASE}/api/admin/transfers`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setRows(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Error fetching transfers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
    const id = setInterval(fetchTransfers, 10000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, query, statusFilter, walletFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Create transfer
  const saveTransfer = async (e) => {
    e.preventDefault();
    if (!form.from || !form.to || !form.amount) {
      setError("All fields required");
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/api/admin/transfers`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForm({ from: "", to: "", amount: "", wallet: "Main Wallet" });
      setError("");
      // refresh current page
      fetchTransfers();
    } catch (err) {
      console.error("Error creating transfer:", err);
      setError("Failed to create transfer.");
    } finally {
      setSaving(false);
    }
  };

  // Update status
  const updateStatus = async (id, status) => {
    try {
      await axios.patch(
        `${API_BASE}/api/admin/transfers/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTransfers();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // Delete
  const deleteTransfer = async (id) => {
    if (!window.confirm("Delete this transfer?")) return;
    try {
      await axios.delete(`${API_BASE}/api/admin/transfers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // if last item on last page deleted, move page back
      if (rows.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchTransfers();
    } catch (err) {
      console.error("Error deleting transfer:", err);
    }
  };

  // Wallet summary (Completed only)
  const summary = useMemo(() => {
    const main = rows
      .filter((t) => t.wallet === "Main Wallet" && t.status === "Completed")
      .reduce((sum, t) => sum + t.amount, 0);
    const invest = rows
      .filter(
        (t) => t.wallet === "Investment Wallet" && t.status === "Completed"
      )
      .reduce((sum, t) => sum + t.amount, 0);
    return { main, invest };
  }, [rows]);

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <h1 style={styles.title}>Fund Transfers</h1>
        <div style={styles.subtle}>Search, filter, and manage transfers</div>
      </div>

      {/* Summary */}
      <div style={styles.summaryRow}>
        <div style={styles.summaryCard}>
          <h3>Main Wallet</h3>
          <p>₦{summary.main.toLocaleString()}</p>
        </div>
        <div style={styles.summaryCard}>
          <h3>Investment Wallet</h3>
          <p>₦{summary.invest.toLocaleString()}</p>
        </div>
      </div>

      {/* Create */}
      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Manual Transfer</h3>
        <form onSubmit={saveTransfer}>
          <div style={styles.grid2}>
            <input
              placeholder="From"
              value={form.from}
              onChange={(e) => setForm({ ...form, from: e.target.value })}
              style={styles.input}
            />
            <input
              placeholder="To"
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
              style={styles.input}
            />
          </div>
          <div style={styles.grid2}>
            <select
              value={form.wallet}
              onChange={(e) => setForm({ ...form, wallet: e.target.value })}
              style={styles.select}
            >
              <option>Main Wallet</option>
              <option>Investment Wallet</option>
            </select>
            <input
              type="number"
              placeholder="Amount (₦)"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              style={styles.input}
            />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button style={styles.primaryBtn} disabled={saving}>
            {saving ? "Processing..." : "Transfer Funds"}
          </button>
        </form>
      </div>

      {/* Filters */}
      <div style={styles.filtersRow}>
        <input
          type="text"
          placeholder="Search by From/To/ID"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          style={styles.search}
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={styles.select}
        >
          <option>All</option>
          <option>Pending</option>
          <option>Completed</option>
          <option>Failed</option>
        </select>
        <select
          value={walletFilter}
          onChange={(e) => {
            setWalletFilter(e.target.value);
            setPage(1);
          }}
          style={styles.select}
        >
          <option>All</option>
          <option>Main Wallet</option>
          <option>Investment Wallet</option>
        </select>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          style={styles.select}
          title="Sort"
        >
          <option value="-createdAt">Newest</option>
          <option value="createdAt">Oldest</option>
          <option value="-amount">Amount (High → Low)</option>
          <option value="amount">Amount (Low → High)</option>
        </select>
      </div>

      {/* Table */}
      <div style={styles.card}>
        {loading ? (
          <p style={{ textAlign: "center" }}>Loading transfers...</p>
        ) : rows.length === 0 ? (
          <p style={styles.noData}>No transfers found</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>From</th>
                <th style={styles.th}>To</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Wallet</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t._id}>
                  <td style={styles.td}>{t.from}</td>
                  <td style={styles.td}>{t.to}</td>
                  <td style={styles.td}>₦{t.amount.toLocaleString()}</td>
                  <td style={styles.td}>{t.wallet}</td>
                  <td style={styles.td}>
                    {new Date(t.date || t.createdAt).toLocaleString()}
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor:
                          t.status === "Completed"
                            ? "#065f46"
                            : t.status === "Pending"
                            ? "#4c1d95"
                            : "#7f1d1d",
                      }}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {t.status === "Pending" && (
                      <>
                        <button
                          style={styles.approveBtn}
                          onClick={() => updateStatus(t._id, "Completed")}
                        >
                          Complete
                        </button>
                        <button
                          style={styles.rejectBtn}
                          onClick={() => updateStatus(t._id, "Failed")}
                        >
                          Fail
                        </button>
                      </>
                    )}
                    <button
                      style={{ ...styles.linkBtn, color: "#fca5a5" }}
                      onClick={() => deleteTransfer(t._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Server pagination */}
        <div style={styles.pagination}>
          <button
            style={styles.pageBtn}
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span style={styles.pageIndicator}>
            Page {page} of {totalPages}
          </span>
          <button
            style={styles.pageBtn}
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

/* --- Styles --- */
const styles = {
  page: { color: "#e2e8f0", fontFamily: "Inter, sans-serif", padding: "1rem" },
  headerRow: { marginBottom: "1rem" },
  title: { fontSize: "1.5rem", fontWeight: 800 },
  subtle: { color: "#94a3b8" },
  summaryRow: {
    display: "flex",
    gap: "1rem",
    marginBottom: "1rem",
    flexWrap: "wrap",
  },
  summaryCard: {
    flex: "1 1 220px",
    background: "#1f2937",
    borderRadius: "12px",
    padding: "1rem",
    textAlign: "center",
  },
  card: {
    background: "#111827",
    borderRadius: "12px",
    padding: "1rem",
    marginBottom: "1rem",
    border: "1px solid #1f2937",
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" },
  input: {
    padding: "0.6rem",
    borderRadius: "8px",
    background: "#0b1220",
    border: "1px solid #334155",
    color: "#e2e8f0",
  },
  select: {
    padding: "0.6rem",
    borderRadius: "8px",
    background: "#0b1220",
    border: "1px solid #334155",
    color: "#e2e8f0",
  },
  primaryBtn: {
    marginTop: "0.8rem",
    background: "#2563eb",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    fontWeight: 700,
    padding: "0.7rem",
    cursor: "pointer",
  },
  filtersRow: {
    display: "flex",
    gap: "0.6rem",
    marginBottom: "1rem",
    flexWrap: "wrap",
  },
  search: {
    flex: "1 1 240px",
    padding: "0.6rem",
    borderRadius: "8px",
    background: "#0b1220",
    border: "1px solid #334155",
    color: "#e2e8f0",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    color: "#94a3b8",
    padding: "0.6rem",
    borderBottom: "1px solid #1f2937",
  },
  td: { padding: "0.6rem" },
  noData: { textAlign: "center", color: "#94a3b8", padding: "1rem" },
  badge: {
    padding: "0.3rem 0.6rem",
    borderRadius: "8px",
    color: "#fff",
    fontWeight: 600,
  },
  approveBtn: {
    background: "#166534",
    color: "#d1fae5",
    border: "none",
    borderRadius: "6px",
    padding: "0.35rem 0.6rem",
    cursor: "pointer",
    marginRight: "0.3rem",
  },
  rejectBtn: {
    background: "#991b1b",
    color: "#fecaca",
    border: "none",
    borderRadius: "6px",
    padding: "0.35rem 0.6rem",
    cursor: "pointer",
    marginRight: "0.3rem",
  },
  linkBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
  },
  pagination: {
    display: "flex",
    justifyContent: "space-between",
    paddingTop: "0.8rem",
  },
  pageBtn: {
    padding: "0.45rem 0.8rem",
    backgroundColor: "#1f2937",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#e2e8f0",
    cursor: "pointer",
  },
  pageIndicator: { color: "#94a3b8" },
};
