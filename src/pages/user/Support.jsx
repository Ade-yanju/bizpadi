import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [modal, setModal] = useState({ show: false, type: "", message: "" });

  const token = localStorage.getItem("token");
  const API_BASE =
    import.meta.env?.VITE_API_BASE_URL ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000";

  const headers = { Authorization: `Bearer ${token}` };

  /* Fetch tickets */
  const fetchTickets = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/support`, { headers });
      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setModal({
        show: true,
        type: "error",
        message:
          err.response?.data?.message || "Failed to load support tickets.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchTickets();
  }, []);

  /* Create new ticket */
  const createTicket = async (e) => {
    e.preventDefault();
    if (!subject || !newMessage)
      return setModal({
        show: true,
        type: "error",
        message: "Please fill in both subject and message.",
      });
    setSending(true);
    try {
      await axios.post(
        `${API_BASE}/api/support`,
        { subject, message: newMessage },
        { headers }
      );
      setSubject("");
      setNewMessage("");
      fetchTickets();
      setModal({
        show: true,
        type: "success",
        message: "Support ticket created successfully!",
      });
    } catch (err) {
      console.error("Error creating ticket:", err);
      setModal({
        show: true,
        type: "error",
        message:
          err.response?.data?.message || "Failed to create support ticket.",
      });
    } finally {
      setSending(false);
    }
  };

  /* Reply to ticket */
  const replyToTicket = async (id) => {
    if (!newMessage)
      return setModal({
        show: true,
        type: "error",
        message: "Please type a reply message.",
      });
    setSending(true);
    try {
      await axios.post(
        `${API_BASE}/api/support/${id}/reply`,
        { message: newMessage },
        { headers }
      );
      setNewMessage("");
      fetchTickets();
      setModal({
        show: true,
        type: "success",
        message: "Reply sent successfully!",
      });
    } catch (err) {
      console.error("Error replying:", err);
      setModal({
        show: true,
        type: "error",
        message:
          err.response?.data?.message || "Failed to send your reply message.",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading)
    return (
      <div style={styles.loading}>
        <p>Loading support tickets...</p>
      </div>
    );

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>💬 Support Center</h2>
      <p style={styles.subtext}>
        Contact our team directly from your dashboard.
      </p>

      {/* Create new ticket */}
      <form onSubmit={createTicket} style={styles.newTicketForm}>
        <input
          style={styles.input}
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <textarea
          style={styles.textarea}
          placeholder="Describe your issue..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button style={styles.btn} disabled={sending}>
          {sending ? "Sending..." : "Submit Ticket"}
        </button>
      </form>

      {/* Ticket list */}
      <div style={styles.tickets}>
        {tickets.length === 0 ? (
          <p style={styles.empty}>No support tickets yet.</p>
        ) : (
          tickets.map((t) => (
            <div
              key={t._id}
              style={{
                ...styles.ticket,
                borderColor:
                  t.status === "resolved"
                    ? "#22c55e"
                    : t.status === "in_progress"
                    ? "#f59e0b"
                    : "#3b82f6",
              }}
              onClick={() => setSelected(t)}
            >
              <h3>{t.subject}</h3>
              <p style={{ color: "#94a3b8" }}>
                {t.message?.slice(0, 80) || ""}...
              </p>
              <span style={styles.status}>{t.status}</span>
            </div>
          ))
        )}
      </div>

      {/* Selected Ticket */}
      {selected && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <h3 style={{ color: "#38bdf8" }}>{selected.subject}</h3>
            <div style={styles.thread}>
              {selected.replies.map((r, i) => (
                <div
                  key={i}
                  style={{
                    ...styles.msg,
                    alignSelf: r.from === "user" ? "flex-end" : "flex-start",
                    background: r.from === "user" ? "#2563eb" : "#1e293b",
                  }}
                >
                  <p>{r.message}</p>
                  <small>{r.from}</small>
                </div>
              ))}
            </div>

            <textarea
              style={styles.textarea}
              placeholder="Type a reply..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <div style={{ display: "flex", gap: ".5rem" }}>
              <button
                style={styles.btn}
                onClick={() => replyToTicket(selected._id)}
              >
                Reply
              </button>
              <button style={styles.cancel} onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for error/success */}
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
              {modal.type === "error" ? "Error" : "Success"}
            </h3>
            <p style={{ color: "#e2e8f0", marginBottom: "1rem" }}>
              {modal.message}
            </p>
            <button
              style={styles.closeBtn}
              onClick={() => setModal({ show: false, type: "", message: "" })}
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
  page: { color: "#e2e8f0", padding: "1rem", fontFamily: "Inter, sans-serif" },
  title: { fontSize: "1.5rem", fontWeight: 800 },
  subtext: { color: "#94a3b8", marginBottom: "1.2rem" },
  loading: { textAlign: "center", color: "#e2e8f0", padding: "2rem" },
  newTicketForm: {
    background: "#111827",
    padding: "1rem",
    borderRadius: "10px",
    marginBottom: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: ".5rem",
  },
  input: {
    background: "#0b1220",
    border: "1px solid #334155",
    color: "#e2e8f0",
    borderRadius: "8px",
    padding: ".6rem",
  },
  textarea: {
    background: "#0b1220",
    border: "1px solid #334155",
    color: "#e2e8f0",
    borderRadius: "8px",
    padding: ".6rem",
    minHeight: "80px",
  },
  btn: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: ".6rem",
    cursor: "pointer",
    fontWeight: 700,
  },
  cancel: {
    background: "#475569",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: ".6rem",
    cursor: "pointer",
    fontWeight: 700,
  },
  tickets: {
    display: "grid",
    gap: ".8rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  },
  ticket: {
    background: "#1e293b",
    borderRadius: "8px",
    padding: "1rem",
    border: "2px solid #334155",
    cursor: "pointer",
  },
  status: { fontSize: "0.8rem", color: "#94a3b8" },
  empty: { color: "#94a3b8", textAlign: "center" },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
    padding: "1rem",
  },
  modalBox: {
    background: "#111827",
    borderRadius: "12px",
    padding: "1rem",
    width: "90%",
    maxWidth: "500px",
    color: "#e2e8f0",
  },
  thread: {
    display: "flex",
    flexDirection: "column",
    gap: ".6rem",
    margin: "1rem 0",
    maxHeight: "300px",
    overflowY: "auto",
    wordWrap: "break-word",
  },
  msg: {
    padding: ".6rem .8rem",
    borderRadius: "8px",
    maxWidth: "75%",
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
