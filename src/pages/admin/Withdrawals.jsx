import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Withdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const limit = 6;

  const API_BASE =
    import.meta.env?.VITE_API_BASE_URL ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000";

  const token = localStorage.getItem("token");

  // 🔄 Fetch withdrawals
  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/admin/withdrawals`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          limit,
          status: statusFilter,
          type: typeFilter,
          search: query,
        },
      });
      setWithdrawals(res.data.withdrawals);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err) {
      console.error("Error fetching withdrawals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [page, statusFilter, typeFilter, query]);

  // ✅ Update status
  const updateStatus = async (id, status) => {
    try {
      await axios.patch(
        `${API_BASE}/api/admin/withdrawals/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchWithdrawals();
    } catch (err) {
      console.error("Error updating withdrawal:", err);
    }
  };

  // 🗑️ Delete
  const deleteRequest = async (id) => {
    if (!window.confirm("Delete withdrawal request?")) return;
    try {
      await axios.delete(`${API_BASE}/api/admin/withdrawals/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchWithdrawals();
    } catch (err) {
      console.error("Error deleting withdrawal:", err);
    }
  };

  // --- UI ---
  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <h1 style={styles.title}>Withdrawal Requests</h1>
        <p style={styles.subtle}>Manage and approve user withdrawal requests</p>
      </div>

      {/* Filters */}
      <div style={styles.filterBox}>
        <input
          type="text"
          placeholder="Search by user or wallet"
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
          <option>Approved</option>
          <option>Rejected</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          style={styles.select}
        >
          <option>All</option>
          <option>Profit</option>
          <option>Capital</option>
        </select>
      </div>

      {/* Table */}
      <div style={styles.card}>
        {loading ? (
          <div style={{ textAlign: "center" }}>Loading withdrawals...</div>
        ) : (
          <>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>User</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Wallet</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th} align="right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={styles.noData}>
                      No withdrawals found
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w._id} style={styles.tr}>
                      <td style={styles.td}>{w.user}</td>
                      <td style={styles.td}>₦{w.amount.toLocaleString()}</td>
                      <td style={styles.td}>{w.wallet}</td>
                      <td style={styles.td}>{w.type}</td>
                      <td style={styles.td}>
                        {new Date(w.date).toLocaleDateString()}
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            backgroundColor:
                              w.status === "Approved"
                                ? "#065f46"
                                : w.status === "Pending"
                                ? "#4c1d95"
                                : "#7f1d1d",
                            color:
                              w.status === "Approved"
                                ? "#6ee7b7"
                                : w.status === "Pending"
                                ? "#ddd6fe"
                                : "#fecaca",
                          }}
                        >
                          {w.status}
                        </span>
                      </td>
                      <td style={{ ...styles.td, textAlign: "right" }}>
                        {w.status === "Pending" && (
                          <>
                            <button
                              style={styles.approveBtn}
                              onClick={() => updateStatus(w._id, "Approved")}
                            >
                              Approve
                            </button>
                            <button
                              style={styles.rejectBtn}
                              onClick={() => updateStatus(w._id, "Rejected")}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          style={{ ...styles.linkBtn, color: "#fca5a5" }}
                          onClick={() => deleteRequest(w._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={styles.pagination}>
              <button
                style={styles.pageBtn}
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <span style={styles.pageIndicator}>
                Page {page} of {totalPages} ({total} total)
              </span>
              <button
                style={styles.pageBtn}
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------ Inline Styles ------------------ */
const styles = {
  page: {
    color: "#e2e8f0",
    fontFamily: "Inter, sans-serif",
    padding: "1rem",
  },
  headerRow: { marginBottom: "1rem" },
  title: { fontSize: "1.5rem", fontWeight: 800 },
  subtle: { color: "#94a3b8" },
  filterBox: { display: "flex", gap: "0.6rem", marginBottom: "1rem" },
  search: {
    flex: 1,
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
  card: {
    background: "#111827",
    borderRadius: "12px",
    padding: "1rem",
    border: "1px solid #1f2937",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "0.75rem",
    color: "#94a3b8",
    borderBottom: "1px solid #1f2937",
  },
  tr: { borderBottom: "1px dashed #1f2937" },
  td: { padding: "0.75rem", color: "#e5e7eb" },
  noData: { padding: "1rem", textAlign: "center", color: "#94a3b8" },
  badge: {
    padding: "0.25rem 0.6rem",
    fontSize: "0.8rem",
    borderRadius: "8px",
    fontWeight: 700,
  },
  approveBtn: {
    backgroundColor: "#166534",
    color: "#d1fae5",
    border: "none",
    marginRight: "0.4rem",
    borderRadius: "6px",
    padding: "0.35rem 0.6rem",
    cursor: "pointer",
  },
  rejectBtn: {
    backgroundColor: "#991b1b",
    color: "#fecaca",
    border: "none",
    marginRight: "0.4rem",
    borderRadius: "6px",
    padding: "0.35rem 0.6rem",
    cursor: "pointer",
  },
  linkBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    marginLeft: "0.3rem",
  },
  pagination: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "0.8rem",
  },
  pageBtn: {
    background: "#1f2937",
    border: "1px solid #334155",
    borderRadius: "7px",
    padding: "0.45rem 0.8rem",
    color: "#e5e7eb",
    cursor: "pointer",
  },
  pageIndicator: { color: "#94a3b8", fontSize: "0.9rem" },
};
