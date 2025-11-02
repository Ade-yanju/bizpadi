import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

export default function VirtualShops() {
  const [shops, setShops] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editShop, setEditShop] = useState(null);
  const [error, setError] = useState("");
  const pageSize = 5;

  const API_BASE =
    import.meta.env?.VITE_API_BASE_URL ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000";

  const emptyForm = {
    name: "",
    description: "",
    durationDays: "",
    dailyPercent: "",
    minAmount: "",
    maxAmount: "",
    totalSlots: "",
    status: "Active",
  };

  const [form, setForm] = useState(emptyForm);

  // 🔄 Fetch all shops
  const fetchShops = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/admin/shops`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShops(res.data);
    } catch (err) {
      console.error("❌ Error fetching shops:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
    const interval = setInterval(fetchShops, 15000);
    return () => clearInterval(interval);
  }, []);

  // 🔍 Filter and paginate
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shops.filter((s) => {
      const matchQ =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "All" ? true : s.status === statusFilter;
      return matchQ && matchStatus;
    });
  }, [shops, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getProgress = (s) =>
    Math.min(100, Math.round((s.filledSlots / s.totalSlots) * 100));

  // ✏️ Edit
  const handleEdit = (shop) => {
    setEditShop(shop);
    setForm(shop);
    setShowForm(true);
  };

  // 🗑️ Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this shop?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE}/api/admin/shops/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchShops();
    } catch (err) {
      console.error("Error deleting shop:", err);
    }
  };

  // 🔁 Toggle Status
  const handleToggleStatus = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`${API_BASE}/api/admin/shops/${id}/status`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchShops();
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  // 💾 Create or update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const token = localStorage.getItem("token");

    try {
      if (editShop) {
        await axios.put(`${API_BASE}/api/admin/shops/${editShop._id}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_BASE}/api/admin/shops`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      fetchShops();
      setShowForm(false);
      setForm(emptyForm);
      setEditShop(null);
    } catch (err) {
      console.error(err);
      setError("Failed to save shop. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  // --- UI ---
  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <h1 style={styles.title}>Admin – Virtual Shops</h1>
        <button
          style={styles.primaryBtn}
          onClick={() => {
            setShowForm(true);
            setEditShop(null);
            setForm(emptyForm);
          }}
        >
          + Create Shop
        </button>
      </div>

      <p style={styles.subtle}>
        Manage all investment shops: create, edit, activate, or remove.
      </p>

      {/* Filters */}
      <div style={styles.filtersRow}>
        <input
          type="text"
          placeholder="Search shops..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          style={styles.searchInput}
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
          <option>Active</option>
          <option>Inactive</option>
        </select>
        <button style={styles.refreshBtn} onClick={fetchShops}>
          🔄 Refresh
        </button>
      </div>

      {/* Shops List */}
      {loading ? (
        <div style={styles.loading}>Loading shops...</div>
      ) : pageData.length === 0 ? (
        <div style={styles.noData}>No shops found</div>
      ) : (
        <div style={styles.grid}>
          {pageData.map((s) => (
            <div key={s._id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.shopName}>{s.name}</h2>
                <span
                  onClick={() => handleToggleStatus(s._id)}
                  title="Click to toggle status"
                  style={{
                    ...styles.badge,
                    backgroundColor:
                      s.status === "Active" ? "#064e3b" : "#5b1a1a",
                    color: s.status === "Active" ? "#6ee7b7" : "#fecaca",
                    cursor: "pointer",
                  }}
                >
                  {s.status}
                </span>
              </div>

              <p style={styles.desc}>{s.description}</p>

              <div style={styles.progressBox}>
                <div style={styles.progressBarBg}>
                  <div
                    style={{
                      ...styles.progressBarFill,
                      width: `${getProgress(s)}%`,
                    }}
                  />
                </div>
                <div style={styles.progressText}>
                  {getProgress(s)}% filled ({s.filledSlots}/{s.totalSlots})
                </div>
              </div>

              <div style={styles.details}>
                <div>
                  <b>{s.durationDays} days</b>
                  <div style={styles.subText}>Duration</div>
                </div>
                <div>
                  <b>{s.dailyPercent}%</b>
                  <div style={styles.subText}>Daily Return</div>
                </div>
                <div>
                  <b>${s.minAmount}</b>
                  <div style={styles.subText}>Min Invest</div>
                </div>
                <div>
                  <b>${s.maxAmount}</b>
                  <div style={styles.subText}>Max Invest</div>
                </div>
              </div>

              <div style={styles.btnRow}>
                <button style={styles.editBtn} onClick={() => handleEdit(s)}>
                  Edit
                </button>
                <button
                  style={styles.deleteBtn}
                  onClick={() => handleDelete(s._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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

      {/* Shop Form */}
      {showForm && (
        <div style={styles.overlay}>
          <div style={styles.formCard}>
            <h2>{editShop ? "Edit Shop" : "Create Shop"}</h2>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label>Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label>Duration (days)</label>
                  <input
                    type="number"
                    value={form.durationDays}
                    onChange={(e) =>
                      setForm({ ...form, durationDays: e.target.value })
                    }
                  />
                </div>
                <div style={styles.formGroup}>
                  <label>Daily %</label>
                  <input
                    type="number"
                    value={form.dailyPercent}
                    onChange={(e) =>
                      setForm({ ...form, dailyPercent: e.target.value })
                    }
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label>Min Amount</label>
                  <input
                    type="number"
                    value={form.minAmount}
                    onChange={(e) =>
                      setForm({ ...form, minAmount: e.target.value })
                    }
                  />
                </div>
                <div style={styles.formGroup}>
                  <label>Max Amount</label>
                  <input
                    type="number"
                    value={form.maxAmount}
                    onChange={(e) =>
                      setForm({ ...form, maxAmount: e.target.value })
                    }
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label>Total Slots</label>
                <input
                  type="number"
                  value={form.totalSlots}
                  onChange={(e) =>
                    setForm({ ...form, totalSlots: e.target.value })
                  }
                />
              </div>
              {error && <div style={styles.error}>{error}</div>}
              <div style={styles.btnRow}>
                <button
                  type="submit"
                  disabled={saving}
                  style={styles.primaryBtn}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------- Styles -------------------------- */
const styles = {
  page: { color: "#e2e8f0", fontFamily: "Inter, sans-serif", padding: "1rem" },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem",
    flexWrap: "wrap",
  },
  title: { fontSize: "1.5rem", fontWeight: 800 },
  subtle: { color: "#94a3b8", marginBottom: "1rem" },
  primaryBtn: {
    backgroundColor: "#2563eb",
    border: "none",
    color: "#fff",
    padding: "0.6rem 1rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
  },
  refreshBtn: {
    backgroundColor: "#1f2937",
    border: "1px solid #334155",
    color: "#e2e8f0",
    padding: "0.6rem 1rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "1rem",
  },
  card: {
    backgroundColor: "#111827",
    padding: "1rem",
    borderRadius: "12px",
    border: "1px solid #1f2937",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shopName: { fontSize: "1.1rem", fontWeight: 700 },
  desc: { color: "#94a3b8", fontSize: "0.9rem", margin: "0.4rem 0" },
  badge: {
    padding: "0.3rem 0.6rem",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: 700,
  },
  progressBox: { marginTop: "0.5rem" },
  progressBarBg: {
    backgroundColor: "#1e293b",
    borderRadius: "8px",
    height: "8px",
    overflow: "hidden",
  },
  progressBarFill: {
    backgroundColor: "#22c55e",
    height: "100%",
    transition: "width 0.3s ease",
  },
  progressText: { fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.3rem" },
  details: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "0.5rem",
    marginTop: "0.8rem",
  },
  subText: { fontSize: "0.8rem", color: "#94a3b8" },
  btnRow: {
    display: "flex",
    gap: "0.5rem",
    marginTop: "0.8rem",
  },
  editBtn: {
    background: "#1e40af",
    color: "#fff",
    border: "none",
    padding: "0.5rem 0.8rem",
    borderRadius: "6px",
    cursor: "pointer",
  },
  deleteBtn: {
    background: "#991b1b",
    color: "#fff",
    border: "none",
    padding: "0.5rem 0.8rem",
    borderRadius: "6px",
    cursor: "pointer",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "1rem",
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
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  formCard: {
    background: "#1e293b",
    padding: "1.5rem",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "480px",
    color: "#e2e8f0",
  },
  formGroup: {
    marginBottom: "0.9rem",
    display: "flex",
    flexDirection: "column",
  },
  formRow: { display: "flex", gap: "1rem" },
  error: {
    color: "#fecaca",
    background: "#3f1d1d",
    padding: "0.5rem",
    borderRadius: "6px",
    marginBottom: "0.8rem",
  },
  cancelBtn: {
    backgroundColor: "#475569",
    border: "none",
    color: "#fff",
    padding: "0.6rem 1rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
  },
};
