import React, { useEffect, useState } from "react";
import axios from "axios";

export default function FundTransfer() {
  const [tab, setTab] = useState("wallet"); // 'wallet' | 'user'
  const [fromWallet, setFromWallet] = useState("");
  const [toWallet, setToWallet] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [balances, setBalances] = useState({});
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ show: false, type: "", message: "" });

  const feeRate = 0.005; // 0.5%
  const parsedAmount = Number(amount) || 0;
  const fee = Math.floor(parsedAmount * feeRate);
  const netAmount = Math.max(0, parsedAmount - fee);

  const API_BASE =
    import.meta.env?.VITE_API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    "http://localhost:5000";
  const token = localStorage.getItem("token");

  // Fetch balances + history
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balRes, histRes] = await Promise.all([
          axios.get(`${API_BASE}/api/wallet/balances`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE}/api/transfers/history`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setBalances(balRes.data.balances);
        setHistory(histRes.data.history);
        // default wallets
        const keys = Object.keys(balRes.data.balances);
        if (keys.length >= 2) {
          setFromWallet(keys[0]);
          setToWallet(keys[1]);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setModal({
          show: true,
          type: "error",
          message:
            err.response?.data?.message ||
            "Failed to load transfer data. Please refresh.",
        });
      }
    };

    fetchData();
  }, [API_BASE, token]);

  const validate = () => {
    if (!parsedAmount || parsedAmount < 1000)
      return "Minimum transfer is ₦1,000";
    if (tab === "wallet") {
      if (fromWallet === toWallet)
        return "Select a different destination wallet";
      if (parsedAmount > (balances[fromWallet] || 0))
        return "Insufficient balance";
    }
    if (tab === "user" && !recipient.trim())
      return "Recipient email or ID is required";
    return "";
  };

  const submit = async () => {
    const err = validate();
    if (err) {
      setModal({ show: true, type: "error", message: err });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type: tab,
        fromWallet,
        toWallet: tab === "wallet" ? toWallet : null,
        recipient: tab === "user" ? recipient : null,
        amount: parsedAmount,
      };

      await axios.post(`${API_BASE}/api/transfers`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setModal({
        show: true,
        type: "success",
        message:
          tab === "wallet"
            ? `₦${parsedAmount.toLocaleString()} transferred from ${fromWallet} to ${toWallet}`
            : `₦${parsedAmount.toLocaleString()} sent to ${recipient}`,
      });

      // refresh balances & history
      const balRes = await axios.get(`${API_BASE}/api/wallet/balances`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const histRes = await axios.get(`${API_BASE}/api/transfers/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBalances(balRes.data.balances);
      setHistory(histRes.data.history);

      setAmount("");
      setRecipient("");
    } catch (err) {
      console.error("Submit error:", err);
      setModal({
        show: true,
        type: "error",
        message: err.response?.data?.message || "Failed to submit transfer.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <h2 style={styles.title}>Funds Transfer</h2>
        <p style={styles.sub}>
          Move funds between wallets or send to another user.
        </p>

        <div style={styles.tabs}>
          <button
            onClick={() => setTab("wallet")}
            style={{
              ...styles.tab,
              ...(tab === "wallet" ? styles.tabActive : {}),
            }}
          >
            Wallet Transfer
          </button>
          <button
            onClick={() => setTab("user")}
            style={{
              ...styles.tab,
              ...(tab === "user" ? styles.tabActive : {}),
            }}
          >
            Transfer to User
          </button>
        </div>

        <div style={styles.card}>
          {tab === "wallet" && (
            <>
              <label style={styles.label}>From Wallet</label>
              <select
                value={fromWallet}
                onChange={(e) => setFromWallet(e.target.value)}
                style={styles.input}
              >
                {Object.entries(balances).map(([key, val]) => (
                  <option key={key} value={key}>
                    {key} — ₦{val.toLocaleString()}
                  </option>
                ))}
              </select>

              <label style={styles.label}>To Wallet</label>
              <select
                value={toWallet}
                onChange={(e) => setToWallet(e.target.value)}
                style={styles.input}
              >
                {Object.keys(balances).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </>
          )}

          {tab === "user" && (
            <>
              <label style={styles.label}>Recipient (Email / ID)</label>
              <input
                style={styles.input}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="example@email.com / USR-123"
              />
            </>
          )}

          <label style={styles.label}>Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            style={styles.input}
          />

          <div style={styles.breakdown}>
            <div style={styles.breakRow}>
              <span>Fee (0.5%)</span>
              <span>₦{fee.toLocaleString()}</span>
            </div>
            <div style={styles.breakRow}>
              <strong>Net Amount</strong>
              <strong style={{ color: "#38bdf8" }}>
                ₦{netAmount.toLocaleString()}
              </strong>
            </div>
          </div>

          <button style={styles.primaryBtn} disabled={loading} onClick={submit}>
            {loading ? "Processing..." : "Confirm Transfer"}
          </button>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>Recent Transfers</div>
          {history.length === 0 ? (
            <p style={styles.empty}>No transfers yet</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>TX ID</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} style={styles.tr}>
                      <td style={styles.td}>{h.id}</td>
                      <td style={styles.td}>{h.type}</td>
                      <td style={styles.td}>₦{h.amount.toLocaleString()}</td>
                      <td style={styles.td}>{h.date}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            backgroundColor:
                              h.status === "Completed"
                                ? "#065f46"
                                : h.status === "Pending"
                                ? "#4c1d95"
                                : "#7f1d1d",
                            color:
                              h.status === "Completed"
                                ? "#6ee7b7"
                                : h.status === "Pending"
                                ? "#ddd6fe"
                                : "#fecaca",
                          }}
                        >
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
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
                marginBottom: "0.5rem",
              }}
            >
              {modal.type === "error" ? "Error" : "Success"}
            </h3>
            <p style={{ color: "#e2e8f0", marginBottom: "1rem" }}>
              {modal.message}
            </p>
            <button
              onClick={() => setModal({ show: false, type: "", message: "" })}
              style={{
                backgroundColor: modal.type === "error" ? "#ef4444" : "#22c55e",
                color: "#fff",
                padding: "0.6rem 1rem",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "500",
              }}
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
/* (Keep styles from previous version) */

/* ---------- Styles ---------- */
const styles = {
  container: {
    backgroundColor: "#0f172a",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "1rem",
    fontFamily: "Inter, sans-serif",
  },
  wrapper: {
    width: "100%",
    maxWidth: "700px",
    color: "#fff",
  },
  title: { fontSize: "1.6rem", fontWeight: 800, marginBottom: ".3rem" },
  sub: { color: "#94a3b8", marginBottom: "1rem" },
  tabs: {
    display: "flex",
    gap: ".5rem",
    flexWrap: "wrap",
    background: "#1e293b",
    borderRadius: "10px",
    padding: ".25rem",
    border: "1px solid #334155",
    marginBottom: ".9rem",
  },
  tab: {
    flex: 1,
    padding: ".55rem .9rem",
    border: "none",
    background: "transparent",
    color: "#cbd5e1",
    fontWeight: 700,
    borderRadius: "8px",
    cursor: "pointer",
  },
  tabActive: { backgroundColor: "#2563eb", color: "#fff" },
  card: {
    backgroundColor: "#111827",
    border: "1px solid #1f2937",
    borderRadius: "12px",
    padding: "1rem",
    marginBottom: "1.2rem",
  },
  cardHeader: {
    fontSize: "1.1rem",
    fontWeight: 700,
    marginBottom: ".6rem",
  },
  label: { display: "block", marginBottom: ".35rem", color: "#94a3b8" },
  input: {
    width: "100%",
    padding: ".7rem",
    borderRadius: "8px",
    backgroundColor: "#0b1220",
    border: "1px solid #334155",
    color: "#fff",
    marginBottom: ".8rem",
    outline: "none",
  },
  breakdown: {
    backgroundColor: "#0b1220",
    borderRadius: "10px",
    padding: ".65rem .8rem",
    border: "1px solid #334155",
    marginBottom: ".8rem",
  },
  breakRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: ".3rem",
  },
  primaryBtn: {
    width: "100%",
    backgroundColor: "#2563eb",
    border: "none",
    borderRadius: "10px",
    padding: ".75rem",
    fontWeight: 800,
    cursor: "pointer",
    color: "#fff",
  },
  empty: { color: "#94a3b8" },
  table: { width: "100%", borderSpacing: 0 },
  th: {
    textAlign: "left",
    padding: ".6rem",
    color: "#94a3b8",
    borderBottom: "1px solid #1f2937",
    whiteSpace: "nowrap",
  },
  tr: { borderBottom: "1px dashed #1f2937" },
  td: { padding: ".6rem", whiteSpace: "nowrap" },
  badge: {
    padding: ".25rem .6rem",
    borderRadius: "8px",
    fontWeight: 700,
    fontSize: ".8rem",
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
  },
  modal: {
    backgroundColor: "#1e293b",
    borderRadius: "10px",
    padding: "1.5rem",
    width: "90%",
    maxWidth: "400px",
    textAlign: "center",
    border: "2px solid rgba(255,255,255,0.1)",
    boxShadow: "0 0 25px rgba(0,0,0,0.4)",
  },
};
