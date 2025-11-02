import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const API_BASE =
    import.meta.env?.VITE_API_BASE_URL ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000";

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/support/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(res.data);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;

    setSending(true);
    try {
      await axios.post(
        `${API_BASE}/api/support/reply/${selected._id}`,
        { message: reply },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReply("");
      setMessage("✅ Reply sent!");
      fetchTickets();
      const updated = await axios.get(`${API_BASE}/api/support/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(updated.data);
      const newTicket = updated.data.find((t) => t._id === selected._id);
      setSelected(newTicket || null);
    } catch (err) {
      setMessage("❌ Failed to send reply");
    } finally {
      setSending(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleClose = async (id) => {
    if (!window.confirm("Close this ticket?")) return;
    try {
      await axios.post(
        `${API_BASE}/api/support/close/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTickets();
      setSelected(null);
    } catch (err) {
      console.error("Error closing ticket:", err);
    }
  };

  if (loading)
    return (
      <div style={{ color: "#e2e8f0", padding: "1rem" }}>
        Loading tickets...
      </div>
    );

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Support Tickets</h1>
      <p style={styles.subtle}>
        Manage user support requests and respond directly
      </p>

      {message && <div style={styles.notice}>{message}</div>}

      <div style={styles.layout}>
        {/* Ticket List */}
        <div style={styles.listPane}>
          <h3 style={styles.sectionTitle}>All Tickets</h3>
          {tickets.length === 0 ? (
            <p style={{ color: "#94a3b8" }}>No tickets yet.</p>
          ) : (
            tickets.map((t) => (
              <div
                key={t._id}
                onClick={() => setSelected(t)}
                style={{
                  ...styles.ticketItem,
                  background:
                    selected?._id === t._id ? "#1e293b" : "transparent",
                }}
              >
                <div>
                  <b>{t.subject}</b>
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                    {t.userId?.name || "Unknown"} • {t.category}
                  </div>
                </div>
                <span
                  style={{
                    ...styles.badge,
                    background:
                      t.status === "Closed"
                        ? "#991b1b"
                        : t.status === "Resolved"
                        ? "#166534"
                        : "#1d4ed8",
                  }}
                >
                  {t.status}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Ticket Details */}
        <div style={styles.detailPane}>
          {selected ? (
            <>
              <div style={styles.ticketHeader}>
                <h3 style={{ margin: 0 }}>{selected.subject}</h3>
                <span style={styles.badge}>{selected.status}</span>
              </div>
              <p style={{ color: "#94a3b8" }}>
                From: {selected.userId?.email || "Unknown"} <br />
                Category: {selected.category}
              </p>

              <div style={styles.thread}>
                <div style={styles.userMsg}>
                  <b>User:</b>
                  <p>{selected.message}</p>
                </div>

                {selected.replies.map((r, i) => (
                  <div
                    key={i}
                    style={
                      r.sender === "admin" ? styles.adminMsg : styles.userMsg
                    }
                  >
                    <b>{r.sender === "admin" ? "Admin:" : "User:"}</b>
                    <p>{r.message}</p>
                    <span style={styles.time}>
                      {new Date(r.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {selected.status !== "Closed" && (
                <form onSubmit={handleReply} style={styles.replyBox}>
                  <textarea
                    style={styles.textarea}
                    placeholder="Write a reply..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                  />
                  <button
                    type="submit"
                    style={styles.primaryBtn}
                    disabled={sending}
                  >
                    {sending ? "Sending..." : "Reply"}
                  </button>
                </form>
              )}

              <button
                style={styles.closeBtn}
                onClick={() => handleClose(selected._id)}
              >
                Close Ticket
              </button>
            </>
          ) : (
            <p style={{ color: "#94a3b8" }}>Select a ticket to view details</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Styles ---------- */
const styles = {
  page: { color: "#e2e8f0", padding: "1rem", fontFamily: "Inter, sans-serif" },
  title: { fontSize: "1.5rem", fontWeight: 800 },
  subtle: { color: "#94a3b8", marginBottom: "1rem" },
  layout: {
    display: "grid",
    gridTemplateColumns: "35% 65%",
    gap: "1rem",
  },
  listPane: {
    background: "#111827",
    borderRadius: "10px",
    padding: "1rem",
    border: "1px solid #1f2937",
    height: "70vh",
    overflowY: "auto",
  },
  detailPane: {
    background: "#111827",
    borderRadius: "10px",
    padding: "1rem",
    border: "1px solid #1f2937",
    height: "70vh",
    overflowY: "auto",
  },
  sectionTitle: { marginBottom: "0.6rem", fontWeight: 700 },
  ticketItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0.6rem",
    borderRadius: "8px",
    borderBottom: "1px dashed #1f2937",
    cursor: "pointer",
  },
  badge: {
    color: "#fff",
    padding: "0.3rem 0.6rem",
    borderRadius: "6px",
    fontSize: "0.8rem",
  },
  ticketHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #1f2937",
    paddingBottom: "0.4rem",
  },
  thread: { marginTop: "1rem" },
  userMsg: {
    background: "#1e293b",
    borderRadius: "8px",
    padding: "0.6rem",
    marginBottom: "0.5rem",
  },
  adminMsg: {
    background: "#0f172a",
    borderRadius: "8px",
    padding: "0.6rem",
    marginBottom: "0.5rem",
    borderLeft: "3px solid #2563eb",
  },
  replyBox: { marginTop: "1rem" },
  textarea: {
    width: "100%",
    padding: "0.6rem",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#0b1220",
    color: "#e2e8f0",
    minHeight: "80px",
    marginBottom: "0.5rem",
  },
  primaryBtn: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: 700,
    padding: "0.6rem 1rem",
    cursor: "pointer",
  },
  closeBtn: {
    background: "#991b1b",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "0.6rem 1rem",
    cursor: "pointer",
    fontWeight: 700,
    marginTop: "0.5rem",
  },
  notice: {
    background: "#1e293b",
    border: "1px solid #334155",
    padding: "0.6rem",
    borderRadius: "8px",
    color: "#93c5fd",
    marginBottom: "1rem",
  },
  time: { fontSize: "0.7rem", color: "#64748b" },
};
