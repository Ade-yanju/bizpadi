import React, { useEffect, useState } from "react";
import axios from "axios";

/**
 * Admin KYC Review Dashboard
 * - Fetches /api/kyc/admin (requires admin token)
 * - Shows list with basic info
 * - Click a row to open detail modal (images, fields)
 * - Approve / Reject with note -> PUT /api/kyc/admin/:id
 *
 * Usage: mount this at /admin/kyc. Token must be in localStorage.token
 */

export default function AdminKycReview() {
  const [kycs, setKycs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState({ show: false, type: "", message: "" });
  const [actionLoading, setActionLoading] = useState(false);
  const token = localStorage.getItem("token");
  const API_BASE =
    (import.meta.env?.VITE_API_BASE_URL ||
      process.env.REACT_APP_API_URL ||
      "http://localhost:5000")
      .replace(/\/$/, "");

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line
  }, [page]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE}/api/kyc/admin?page=${page}&limit=${pageSize}`,
        { headers }
      );
      // backend may return { kycs } or { data, meta } — handle both
      const data = res.data.kycs || res.data.data || res.data;
      setKycs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch KYCs", err);
      setModal({
        show: true,
        type: "error",
        message:
          err.response?.data?.message ||
          "Failed to fetch KYC submissions. Check network or token.",
      });
    } finally {
      setLoading(false);
    }
  };

  const openDetail = (item) => {
    setSelected(item);
  };

  const closeDetail = () => {
    setSelected(null);
  };

  const performAction = async (status) => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const payload = {
        status,
        note: selected.adminNote || "",
      };
      const res = await axios.put(
        `${API_BASE}/api/kyc/admin/${selected._id}`,
        payload,
        { headers }
      );
      // update local list
      setKycs((prev) =>
        prev.map((k) => (k._id === selected._id ? res.data.kyc || res.data : k))
      );
      setModal({
        show: true,
        type: "success",
        message: `KYC ${status} successfully.`,
      });
      closeDetail();
    } catch (err) {
      console.error("Action error", err);
      setModal({
        show: true,
        type: "error",
        message:
          err.response?.data?.message ||
          `Could not set status to ${status}. Try again.`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const updateSelectedNote = (note) =>
    setSelected((s) => (s ? { ...s, adminNote: note } : s));

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>KYC Submissions</h2>

      <div style={{ marginBottom: 12 }}>
        <button
          onClick={() => fetchList()}
          style={styles.smallBtn}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={styles.center}>Loading submissions…</div>
      ) : kycs.length === 0 ? (
        <div style={styles.center}>No KYC submissions found.</div>
      ) : (
        <>
          <div style={styles.grid}>
            {kycs.map((k) => (
              <div key={k._id} style={styles.card}>
                <div style={styles.rowBetween}>
                  <div>
                    <div style={styles.kHeading}>
                      {k.fullName || k.user?.fullName || "—"}
                    </div>
                    <div style={styles.kSub}>
                      {k.idType || "—"} • {k.idNumber || "—"}
                    </div>
                  </div>
                  <div style={styles.statusPill(k.status)}>
                    {k.status?.toUpperCase() || "PENDING"}
                  </div>
                </div>

                <div style={{ marginTop: 8, color: "#94a3b8" }}>
                  {k.user?.email || k.userEmail || "No email"}
                </div>

                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <button
                    onClick={() => openDetail(k)}
                    style={styles.actionBtn}
                  >
                    View
                  </button>
                  <button
                    onClick={async () => {
                      setSelected(k);
                      // quick approve without note
                      await performAction("approved");
                      fetchList();
                    }}
                    style={styles.approveBtn}
                  >
                    Quick Approve
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.pager}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={styles.smallBtn}
              disabled={page === 1}
            >
              ← Prev
            </button>
            <div style={{ color: "#94a3b8" }}>Page {page}</div>
            <button
              onClick={() => setPage((p) => p + 1)}
              style={styles.smallBtn}
            >
              Next →
            </button>
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selected && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <strong>{selected.fullName || selected.user?.fullName}</strong>
                <div style={{ color: "#94a3b8", fontSize: 13 }}>
                  {selected.user?.email || selected.userEmail}
                </div>
              </div>
              <button onClick={closeDetail} style={styles.closeBtn}>
                ✕
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={styles.detailRow}>
                <div style={styles.detailLabel}>DOB</div>
                <div>{selected.dob || "—"}</div>
              </div>
              <div style={styles.detailRow}>
                <div style={styles.detailLabel}>Address</div>
                <div style={{ maxWidth: 420 }}>{selected.address || "—"}</div>
              </div>
              <div style={styles.detailRow}>
                <div style={styles.detailLabel}>ID</div>
                <div>
                  {selected.idType || "—"} · {selected.idNumber || "—"}
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ marginBottom: 8, color: "#94a3b8" }}>
                  Uploaded images
                </div>
                <div style={styles.imagesRow}>
                  {selected.idImage ? (
                    <img
                      src={selected.idImage}
                      alt="id"
                      style={styles.previewImage}
                      onClick={() =>
                        window.open(selected.idImage, "_blank", "noopener")
                      }
                    />
                  ) : (
                    <div style={styles.placeholder}>No ID image</div>
                  )}
                  {selected.selfieImage ? (
                    <img
                      src={selected.selfieImage}
                      alt="selfie"
                      style={styles.previewImage}
                      onClick={() =>
                        window.open(selected.selfieImage, "_blank", "noopener")
                      }
                    />
                  ) : (
                    <div style={styles.placeholder}>No selfie</div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={styles.detailLabel}>Admin note (optional)</label>
                <textarea
                  value={selected.adminNote || ""}
                  onChange={(e) => updateSelectedNote(e.target.value)}
                  style={styles.textarea}
                  placeholder="Write a short note for approval/rejection reason"
                />
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  onClick={() => performAction("rejected")}
                  style={styles.rejectBtn}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing…" : "Reject"}
                </button>
                <button
                  onClick={() => performAction("approved")}
                  style={styles.approveBtn}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing…" : "Approve"}
                </button>
                <button
                  onClick={() => {
                    // clear note and close
                    setSelected(null);
                  }}
                  style={styles.smallBtn}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generic modal */}
      {modal.show && (
        <div style={styles.modalOverlay}>
          <div style={styles.smallModal}>
            <div
              style={{
                fontWeight: 800,
                color: modal.type === "error" ? "#ef4444" : "#22c55e",
              }}
            >
              {modal.type === "error" ? "Error" : "Success"}
            </div>
            <div style={{ marginTop: 8 }}>{modal.message}</div>
            <div style={{ marginTop: 12 }}>
              <button
                onClick={() => setModal({ show: false, type: "", message: "" })}
                style={styles.smallBtn}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Styles ---------------- */
const styles = {
  page: { padding: 20, fontFamily: "Inter, sans-serif", color: "#e2e8f0" },
  title: { fontSize: 20, fontWeight: 800, marginBottom: 8 },
  center: { padding: 24, color: "#94a3b8" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 12,
  },
  card: {
    background: "#0f172a",
    border: "1px solid #213547",
    borderRadius: 10,
    padding: 12,
  },
  rowBetween: { display: "flex", justifyContent: "space-between", gap: 12 },
  kHeading: { fontWeight: 800 },
  kSub: { color: "#94a3b8", fontSize: 13 },
  statusPill: (status) => ({
    padding: "6px 8px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 800,
    color: status === "approved" ? "#064e3b" : status === "rejected" ? "#7f1d1d" : "#fde68a",
    background: status === "approved" ? "#bbf7d0" : status === "rejected" ? "#fecaca" : "#fde68a22",
    textTransform: "capitalize",
  }),
  actionBtn: {
    background: "transparent",
    border: "1px solid #334155",
    padding: "6px 10px",
    borderRadius: 8,
    color: "#e2e8f0",
    cursor: "pointer",
  },
  approveBtn: {
    background: "#065f46",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: 8,
    cursor: "pointer",
  },
  rejectBtn: {
    background: "#8b1d1d",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: 8,
    cursor: "pointer",
  },
  smallBtn: {
    background: "transparent",
    border: "1px solid #334155",
    color: "#e2e8f0",
    padding: "6px 10px",
    borderRadius: 8,
    cursor: "pointer",
  },

  pager: {
    marginTop: 14,
    display: "flex",
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Modal */
  modalOverlay: {
    position: "fixed",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  modal: {
    width: "92%",
    maxWidth: 820,
    background: "#0b1220",
    borderRadius: 10,
    padding: 16,
    border: "1px solid #334155",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    fontSize: 18,
    cursor: "pointer",
  },
  detailRow: {
    display: "flex",
    gap: 8,
    marginBottom: 8,
    alignItems: "flex-start",
  },
  detailLabel: { width: 110, color: "#94a3b8", fontSize: 13 },
  imagesRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  previewImage: {
    width: 160,
    height: 110,
    objectFit: "cover",
    borderRadius: 8,
    border: "1px solid #213547",
    cursor: "pointer",
  },
  placeholder: {
    width: 160,
    height: 110,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#071022",
    borderRadius: 8,
    color: "#94a3b8",
    border: "1px dashed #213547",
  },

  textarea: {
    width: "100%",
    minHeight: 80,
    padding: 8,
    borderRadius: 8,
    border: "1px solid #213547",
    background: "#071122",
    color: "#e2e8f0",
  },

  smallModal: {
    width: 380,
    maxWidth: "94%",
    background: "#0b1220",
    padding: 16,
    borderRadius: 8,
    border: "1px solid #213547",
    textAlign: "center",
  },
};
