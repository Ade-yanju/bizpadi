import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [kycFilter, setKycFilter] = useState("All");
  const [investmentFilter, setInvestmentFilter] = useState("All");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [loading, setLoading] = useState(true);

  const API_BASE =
    import.meta.env?.VITE_API_BASE_URL ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000";
  const token = localStorage.getItem("token");

  // 🧩 Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data.users || []);
      } catch (err) {
        console.error("❌ Failed to fetch users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    // Re-fetch every 15s for near realtime updates
    const interval = setInterval(fetchUsers, 15000);
    return () => clearInterval(interval);
  }, [API_BASE, token]);

  // 🧮 Filtered + paginated data
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchesQ =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u._id?.toLowerCase().includes(q);

      const matchesKyc = kycFilter === "All" ? true : u.kycStatus === kycFilter;

      const matchesInv =
        investmentFilter === "All"
          ? true
          : investmentFilter === "Yes"
          ? u.hasInvestment
          : !u.hasInvestment;

      const matchesDate =
        !startDateFilter || new Date(u.createdAt) >= new Date(startDateFilter);

      return matchesQ && matchesKyc && matchesInv && matchesDate;
    });
  }, [users, query, kycFilter, investmentFilter, startDateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  // 🧠 Actions
  const handleKycChange = async (userId, status) => {
    try {
      await axios.put(
        `${API_BASE}/api/admin/users/${userId}/kyc`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, kycStatus: status } : u))
      );
    } catch (err) {
      console.error("KYC update failed:", err);
    }
  };

  // 🧾 UI
  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>User Management</h1>
          <div style={styles.subtle}>Monitor, verify, and manage all users</div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filterBox}>
        <input
          type="text"
          placeholder="Search by name, email, or ID"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          style={styles.search}
        />

        <select
          value={kycFilter}
          onChange={(e) => {
            setKycFilter(e.target.value);
            setPage(1);
          }}
          style={styles.select}
        >
          <option>All</option>
          <option>Pending</option>
          <option>Verified</option>
          <option>Rejected</option>
        </select>

        <select
          value={investmentFilter}
          onChange={(e) => {
            setInvestmentFilter(e.target.value);
            setPage(1);
          }}
          style={styles.select}
        >
          <option value="All">All users</option>
          <option value="Yes">Has active investments</option>
          <option value="No">No investments</option>
        </select>

        <input
          type="date"
          value={startDateFilter}
          onChange={(e) => {
            setStartDateFilter(e.target.value);
            setPage(1);
          }}
          style={styles.select}
        />
      </div>

      {/* Table */}
      <div style={styles.card}>
        {loading ? (
          <div style={styles.loading}>Loading users...</div>
        ) : pageData.length === 0 ? (
          <div style={styles.noData}>No users found</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Registered</th>
                  <th style={styles.th}>KYC</th>
                  <th style={styles.th}>Investments</th>
                  <th style={styles.th} align="right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {pageData.map((u) => (
                  <tr key={u._id} style={styles.tr}>
                    <td style={styles.td}>{u.name}</td>
                    <td style={styles.td}>{u.email}</td>
                    <td style={styles.td}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          backgroundColor:
                            u.kycStatus === "Verified"
                              ? "#065f46"
                              : u.kycStatus === "Pending"
                              ? "#4338ca"
                              : "#7f1d1d",
                          color:
                            u.kycStatus === "Verified"
                              ? "#6ee7b7"
                              : u.kycStatus === "Pending"
                              ? "#c7d2fe"
                              : "#fecaca",
                        }}
                      >
                        {u.kycStatus}
                      </span>
                    </td>
                    <td style={styles.td}>{u.hasInvestment ? "✅" : "❌"}</td>
                    <td style={{ ...styles.td, textAlign: "right" }}>
                      <button
                        style={styles.linkBtn}
                        onClick={() => handleKycChange(u._id, "Verified")}
                      >
                        Verify
                      </button>
                      <button
                        style={{
                          ...styles.linkBtn,
                          color: "#f59e0b",
                        }}
                        onClick={() => handleKycChange(u._id, "Rejected")}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pageData.length > 0 && (
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
      )}
    </div>
  );
}

/* -------------------------- Styles -------------------------- */

const styles = {
  page: {
    color: "#e2e8f0",
    fontFamily: "Inter, system-ui, sans-serif",
    padding: "1rem",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem",
    marginBottom: "1rem",
  },
  title: { margin: 0, fontSize: "1.4rem", fontWeight: 800 },
  subtle: { color: "#94a3b8", marginTop: "0.2rem" },
  filterBox: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  search: {
    flex: "1 1 200px",
    padding: "0.6rem",
    borderRadius: "8px",
    border: "1px solid #334155",
    backgroundColor: "#0b1220",
    color: "#e5e7eb",
  },
  select: {
    padding: "0.6rem",
    borderRadius: "8px",
    backgroundColor: "#0b1220",
    border: "1px solid #334155",
    color: "#e5e7eb",
    flex: "1 1 150px",
  },
  card: {
    backgroundColor: "#111827",
    border: "1px solid #1f2937",
    borderRadius: "12px",
    padding: "1rem",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.9rem",
  },
  th: {
    textAlign: "left",
    color: "#94a3b8",
    padding: "0.75rem",
    borderBottom: "1px solid #1f2937",
  },
  tr: { borderBottom: "1px dashed #1f2937" },
  td: { padding: "0.75rem", color: "#e5e7eb" },
  noData: {
    textAlign: "center",
    color: "#94a3b8",
    padding: "1rem",
  },
  loading: {
    color: "#94a3b8",
    textAlign: "center",
    padding: "1rem",
  },
  badge: {
    padding: "0.25rem 0.6rem",
    fontSize: "0.8rem",
    borderRadius: "8px",
    fontWeight: 700,
  },
  linkBtn: {
    background: "transparent",
    border: "none",
    color: "#60a5fa",
    fontWeight: 600,
    cursor: "pointer",
    marginLeft: "0.4rem",
  },
  pagination: {
    marginTop: "0.75rem",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "1rem",
    flexWrap: "wrap",
  },
  pageBtn: {
    backgroundColor: "#1f2937",
    color: "#e2e8f0",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "0.45rem 0.8rem",
    cursor: "pointer",
  },
  pageIndicator: { color: "#94a3b8", fontSize: "0.9rem" },
};
