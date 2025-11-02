import React, { useMemo, useState } from "react";

export default function FundTransfer() {
  const [tab, setTab] = useState("wallet"); // 'wallet' | 'user'
  const [fromWallet, setFromWallet] = useState("main");
  const [toWallet, setToWallet] = useState("investment");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Mock balances
  const balances = {
    main: 85000,
    investment: 42000,
  };

  const feeRate = 0.005; // 0.5% fee
  const parsedAmount = Number(amount) || 0;
  const fee = Math.floor(parsedAmount * feeRate);
  const netAmount = Math.max(0, parsedAmount - fee);

  // Validation
  const validate = () => {
    if (!parsedAmount || parsedAmount < 1000)
      return "Minimum transfer is ₦1,000";
    if (tab === "wallet") {
      if (fromWallet === toWallet)
        return "Select a different destination wallet";
      if (parsedAmount > balances[fromWallet])
        return "Insufficient wallet balance";
    }
    if (tab === "user") {
      if (!recipient.trim()) return "Recipient is required";
    }
    return "";
  };

  const submit = () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      alert(
        tab === "wallet"
          ? `₦${parsedAmount.toLocaleString()} moved ${fromWallet} → ${toWallet} ✅`
          : `₦${parsedAmount.toLocaleString()} sent to ${recipient} ✅`
      );
      setAmount("");
      setRecipient("");
      setLoading(false);
    }, 600);
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Funds Transfer</h2>
      <p style={styles.sub}>
        Move funds internally or send to another VirtualShop user.
      </p>

      {/* Tabs */}
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
          style={{ ...styles.tab, ...(tab === "user" ? styles.tabActive : {}) }}
        >
          Transfer to User
        </button>
      </div>

      {/* Card */}
      <div style={styles.card}>
        {tab === "wallet" && (
          <>
            <label style={styles.label}>From Wallet</label>
            <select
              value={fromWallet}
              onChange={(e) => setFromWallet(e.target.value)}
              style={styles.input}
            >
              <option value="main">
                Main Wallet — ₦{balances.main.toLocaleString()}
              </option>
              <option value="investment">
                Investment Wallet — ₦{balances.investment.toLocaleString()}
              </option>
            </select>

            <label style={styles.label}>To Wallet</label>
            <select
              value={toWallet}
              onChange={(e) => setToWallet(e.target.value)}
              style={styles.input}
            >
              <option value="main">Main Wallet</option>
              <option value="investment">Investment Wallet</option>
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
          min={0}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          style={styles.input}
        />

        {/* Fees summary */}
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

        {error && <div style={styles.errorBox}>{error}</div>}

        <button style={styles.primaryBtn} disabled={loading} onClick={submit}>
          {loading ? "Processing..." : "Confirm Transfer"}
        </button>
      </div>

      {/* History */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>Recent Transfers</div>

        {history.length === 0 ? (
          <p style={styles.empty}>No transfers yet</p>
        ) : (
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
        )}
      </div>
    </div>
  );
}

// Mock history
const history = [
  {
    id: "TRX-501",
    type: "Wallet → Wallet",
    amount: 5000,
    date: "2025-10-24",
    status: "Completed",
  },
  {
    id: "TRX-499",
    type: "User Transfer",
    amount: 3000,
    date: "2025-10-20",
    status: "Pending",
  },
];

/* Inline styles */
const styles = {
  page: {
    fontFamily: "Inter, sans-serif",
    color: "#e2e8f0",
    maxWidth: 700,
  },
  title: { fontSize: "1.5rem", fontWeight: 800, marginBottom: ".2rem" },
  sub: { color: "#94a3b8", marginBottom: "1rem" },

  tabs: {
    display: "flex",
    width: "fit-content",
    background: "#1e293b",
    borderRadius: "10px",
    padding: "0.25rem",
    border: "1px solid #334155",
    marginBottom: ".9rem",
  },
  tab: {
    padding: ".55rem 1rem",
    border: "none",
    background: "transparent",
    color: "#cbd5e1",
    fontWeight: 700,
    borderRadius: "8px",
    cursor: "pointer",
  },
  tabActive: {
    backgroundColor: "#2563eb",
    color: "#fff",
  },

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

  errorBox: {
    backgroundColor: "#3f1d1d",
    border: "1px solid #7f1d1d",
    padding: ".5rem .7rem",
    borderRadius: "8px",
    color: "#fecaca",
    marginBottom: ".8rem",
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
  },
  tr: { borderBottom: "1px dashed #1f2937" },
  td: { padding: ".6rem" },

  badge: {
    padding: ".25rem .6rem",
    borderRadius: "8px",
    fontWeight: 700,
    fontSize: ".8rem",
  },
};
