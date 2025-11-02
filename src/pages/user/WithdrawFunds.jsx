import React, { useMemo, useState } from "react";

export default function WithdrawFunds() {
  // ---- Mock wallet + investments ----
  const wallet = {
    profitBalance: 78500, // ₦
    bankAccounts: [
      { id: "b1", bank: "Access Bank", number: "0123456789", name: "Alex Ade" },
      { id: "b2", bank: "GTBank", number: "0234567891", name: "Alex Ade" },
    ],
  };

  // Example invested shops with end dates for capital eligibility
  const investments = [
    { id: "INV-101", shop: "TechNova", capital: 150000, endDate: "2025-10-10" },
    { id: "INV-102", shop: "GreenLeaf", capital: 80000, endDate: "2025-11-05" },
    {
      id: "INV-103",
      shop: "CloudNova",
      capital: 120000,
      endDate: "2025-10-28",
    }, // ends today
  ];

  const todayStr = new Date().toISOString().slice(0, 10);
  const capitalEligible = useMemo(() => {
    return investments
      .filter((i) => i.endDate <= todayStr) // eligible on or before today
      .map((i) => ({ ...i, eligible: true }));
  }, [investments, todayStr]);

  const totalEligibleCapital = useMemo(
    () => capitalEligible.reduce((s, i) => s + i.capital, 0),
    [capitalEligible]
  );

  // ---- UI state ----
  const [tab, setTab] = useState("profit"); // "profit" | "capital"
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("VelvPay"); // or "Bank"
  const [selectedBankId, setSelectedBankId] = useState(
    wallet.bankAccounts[0]?.id || ""
  );
  const [selectedInvestmentId, setSelectedInvestmentId] = useState(
    capitalEligible[0]?.id || ""
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ---- Derived: limits + fees ----
  const minWithdrawal = 1000;
  const feeRate = 0.01; // 1%
  const parsedAmount = Number(amount) || 0;
  const fee = Math.max(0, Math.floor(parsedAmount * feeRate));
  const netAmount = Math.max(0, parsedAmount - fee);

  const selectedInvestment = useMemo(
    () => capitalEligible.find((x) => x.id === selectedInvestmentId),
    [capitalEligible, selectedInvestmentId]
  );

  const maxAvailable =
    tab === "profit" ? wallet.profitBalance : selectedInvestment?.capital || 0;

  // ---- Actions ----
  const submitWithdrawal = () => {
    setError("");

    if (!parsedAmount || parsedAmount < minWithdrawal) {
      setError(`Minimum withdrawal is ₦${minWithdrawal.toLocaleString()}.`);
      return;
    }
    if (parsedAmount > maxAvailable) {
      setError(
        `Amount exceeds available ${
          tab === "profit" ? "profit" : "capital"
        } balance.`
      );
      return;
    }
    if (method === "Bank" && !selectedBankId) {
      setError("Select a bank account.");
      return;
    }
    if (tab === "capital" && !selectedInvestmentId) {
      setError("Select an eligible investment for capital withdrawal.");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      alert(
        tab === "profit"
          ? `Profit withdrawal of ₦${parsedAmount.toLocaleString()} via ${method} submitted ✅`
          : `Capital withdrawal of ₦${parsedAmount.toLocaleString()} from ${
              selectedInvestment?.shop
            } via ${method} submitted ✅`
      );
      // reset amount only
      setAmount("");
      setSubmitting(false);
    }, 500);
  };

  // ---- UI ----
  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Withdraw Funds</h2>
      <p style={styles.sub}>
        Profit can be withdrawn anytime. Capital is only available on the last
        day of the shop’s duration.
      </p>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(tab === "profit" ? styles.tabActive : {}),
          }}
          onClick={() => setTab("profit")}
        >
          Profit Withdrawal
        </button>
        <button
          style={{
            ...styles.tab,
            ...(tab === "capital" ? styles.tabActive : {}),
          }}
          onClick={() => setTab("capital")}
        >
          Capital Withdrawal
        </button>
      </div>

      {/* Info cards */}
      {tab === "profit" ? (
        <div style={styles.kpiRow}>
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Profit Balance</div>
            <div style={styles.kpiValue}>
              ₦{wallet.profitBalance.toLocaleString()}
            </div>
          </div>
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Minimum Withdrawal</div>
            <div style={styles.kpiValue}>₦{minWithdrawal.toLocaleString()}</div>
          </div>
        </div>
      ) : (
        <div style={styles.kpiRow}>
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Eligible Capital Today</div>
            <div style={styles.kpiValue}>
              ₦{totalEligibleCapital.toLocaleString()}
            </div>
            <div style={styles.miniNote}>
              ({capitalEligible.length} investment
              {capitalEligible.length !== 1 ? "s" : ""} eligible)
            </div>
          </div>
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Minimum Withdrawal</div>
            <div style={styles.kpiValue}>₦{minWithdrawal.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Form */}
      <div style={styles.card}>
        {tab === "capital" && (
          <>
            <label style={styles.label}>Select Investment (Eligible)</label>
            <select
              value={selectedInvestmentId}
              onChange={(e) => setSelectedInvestmentId(e.target.value)}
              style={styles.input}
            >
              {capitalEligible.length === 0 ? (
                <option value="">No eligible investments today</option>
              ) : (
                capitalEligible.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.shop} — ₦{i.capital.toLocaleString()} (ended {i.endDate})
                  </option>
                ))
              )}
            </select>
          </>
        )}

        <label style={styles.label}>Withdrawal Method</label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          style={styles.input}
        >
          <option>VelvPay</option>
          <option>Bank</option>
        </select>

        {method === "Bank" && (
          <>
            <label style={styles.label}>Bank Account</label>
            <select
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
              style={styles.input}
            >
              {wallet.bankAccounts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bank} • {b.number} • {b.name}
                </option>
              ))}
            </select>
          </>
        )}

        <label style={styles.label}>
          Amount (max ₦{maxAvailable.toLocaleString()})
        </label>
        <input
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          style={styles.input}
        />

        {/* Breakdown */}
        <div style={styles.breakdown}>
          <div style={styles.breakRow}>
            <span>Fee (1%)</span>
            <span>₦{fee.toLocaleString()}</span>
          </div>
          <div style={styles.breakRow}>
            <span>Net Amount</span>
            <span style={{ fontWeight: 800 }}>
              ₦{netAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <button
          style={styles.primaryBtn}
          onClick={submitWithdrawal}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Withdraw"}
        </button>
      </div>

      {/* Eligible capital list (context) */}
      {tab === "capital" && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Eligible Capital Today</div>
          {capitalEligible.length === 0 ? (
            <div style={styles.emptyText}>
              No investments reach their last day today.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Shop</th>
                    <th style={styles.th}>Capital</th>
                    <th style={styles.th}>Ends</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {capitalEligible.map((i) => (
                    <tr key={i.id} style={styles.tr}>
                      <td style={styles.td}>{i.id}</td>
                      <td style={styles.td}>{i.shop}</td>
                      <td style={styles.td}>₦{i.capital.toLocaleString()}</td>
                      <td style={styles.td}>{i.endDate}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            backgroundColor: "#065f46",
                            color: "#6ee7b7",
                          }}
                        >
                          Eligible
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* History */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Recent Withdrawals</div>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Ref</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Method</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {mockHistory.map((h) => (
                <tr key={h.ref} style={styles.tr}>
                  <td style={styles.td}>{h.ref}</td>
                  <td style={styles.td}>{h.type}</td>
                  <td style={styles.td}>{h.method}</td>
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
      </div>
    </div>
  );
}

/* ---- Mock history ---- */
const mockHistory = [
  {
    ref: "WD-8801",
    type: "Profit",
    method: "VelvPay",
    amount: 25000,
    date: "2025-10-25",
    status: "Completed",
  },
  {
    ref: "WD-8790",
    type: "Capital",
    method: "Bank",
    amount: 120000,
    date: "2025-10-20",
    status: "Pending",
  },
  {
    ref: "WD-8789",
    type: "Profit",
    method: "Bank",
    amount: 8000,
    date: "2025-10-15",
    status: "Failed",
  },
];

/* ---- Inline styles ---- */
const styles = {
  page: {
    fontFamily: "Inter, sans-serif",
    color: "#e2e8f0",
    maxWidth: 900,
  },
  title: { fontSize: "1.5rem", fontWeight: 800, marginBottom: ".2rem" },
  sub: { color: "#94a3b8", marginBottom: "1rem" },

  tabs: {
    display: "flex",
    gap: "0.4rem",
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "10px",
    padding: "0.25rem",
    width: "fit-content",
    marginBottom: "1rem",
  },
  tab: {
    padding: ".55rem .9rem",
    background: "transparent",
    color: "#cbd5e1",
    border: "none",
    borderRadius: "8px",
    fontWeight: 700,
    cursor: "pointer",
  },
  tabActive: {
    backgroundColor: "#2563eb",
    color: "#fff",
  },

  kpiRow: { display: "flex", gap: "1rem", marginBottom: "1rem" },
  kpiCard: {
    backgroundColor: "#111827",
    border: "1px solid #1f2937",
    borderRadius: "12px",
    padding: "0.9rem",
    flex: 1,
  },
  kpiLabel: { color: "#94a3b8", marginBottom: ".2rem" },
  kpiValue: { fontSize: "1.3rem", fontWeight: 800, color: "#38bdf8" },
  miniNote: { color: "#94a3b8", marginTop: ".2rem", fontSize: ".85rem" },

  card: {
    backgroundColor: "#111827",
    border: "1px solid #1f2937",
    borderRadius: "12px",
    padding: "1rem",
    marginBottom: "1rem",
  },
  cardTitle: { fontWeight: 800, marginBottom: ".6rem" },

  label: { display: "block", marginBottom: ".35rem", color: "#94a3b8" },
  input: {
    width: "100%",
    padding: ".7rem",
    borderRadius: "8px",
    border: "1px solid #334155",
    backgroundColor: "#0b1220",
    color: "#fff",
    marginBottom: ".8rem",
    outline: "none",
  },

  breakdown: {
    backgroundColor: "#0b1220",
    border: "1px solid #334155",
    borderRadius: "10px",
    padding: ".6rem .75rem",
    marginBottom: ".8rem",
  },
  breakRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: ".25rem 0",
  },

  error: {
    backgroundColor: "#3f1d1d",
    border: "1px solid #7f1d1d",
    color: "#fecaca",
    padding: ".55rem",
    borderRadius: "8px",
    marginBottom: ".7rem",
  },
  primaryBtn: {
    width: "100%",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: ".75rem",
    fontWeight: 800,
    cursor: "pointer",
  },

  emptyText: { color: "#94a3b8" },

  table: { width: "100%", borderSpacing: 0 },
  th: {
    textAlign: "left",
    color: "#94a3b8",
    padding: ".6rem",
    borderBottom: "1px solid #1f2937",
    whiteSpace: "nowrap",
  },
  tr: { borderBottom: "1px dashed #1f2937" },
  td: { padding: ".6rem", whiteSpace: "nowrap" },

  badge: {
    padding: ".25rem .6rem",
    fontSize: ".8rem",
    borderRadius: "8px",
    fontWeight: 700,
  },
};
