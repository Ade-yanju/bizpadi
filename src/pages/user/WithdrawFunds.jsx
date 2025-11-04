import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

export default function WithdrawFunds() {
  const [wallet, setWallet] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [capitalEligible, setCapitalEligible] = useState([]);
  const [tab, setTab] = useState("profit");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Bank"); // ✅ default to Bank
  const [selectedBankId, setSelectedBankId] = useState("");
  const [selectedInvestmentId, setSelectedInvestmentId] = useState("");
  const [modal, setModal] = useState({ show: false, type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const API_BASE =
    import.meta.env?.VITE_API_BASE_URL ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000";

  const token = localStorage.getItem("token");

  /* ---------------- Fetch Wallet + Investments ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [walletRes, investRes] = await Promise.all([
          axios.get(`${API_BASE}/api/wallet`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE}/api/investments`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setWallet(walletRes.data.wallet);
        setInvestments(investRes.data.investments || []);
      } catch (err) {
        console.error("Wallet fetch error:", err);
        setModal({
          show: true,
          type: "error",
          message:
            err.response?.data?.message ||
            "Unable to load wallet information. Please try again later.",
        });
      }
    };
    fetchData();
  }, [API_BASE, token]);

  /* ---------------- Capital Eligibility ---------------- */
  useEffect(() => {
    if (!investments.length) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    const eligible = investments.filter((inv) => inv.endDate <= todayStr);
    setCapitalEligible(eligible);
    if (eligible[0]) setSelectedInvestmentId(eligible[0]._id);
  }, [investments]);

  /* ---------------- Derived Calculations ---------------- */
  const minWithdrawal = 1000;
  const feeRate = 0.01;
  const parsedAmount = Number(amount) || 0;
  const fee = Math.floor(parsedAmount * feeRate);
  const netAmount = parsedAmount - fee;

  const selectedInvestment = useMemo(
    () => capitalEligible.find((x) => x._id === selectedInvestmentId),
    [capitalEligible, selectedInvestmentId]
  );

  const maxAvailable =
    tab === "profit"
      ? wallet?.profitBalance || 0
      : selectedInvestment?.capital || 0;

  /* ---------------- Submit Withdrawal ---------------- */
  const submitWithdrawal = async () => {
    if (!parsedAmount || parsedAmount < minWithdrawal)
      return setModal({
        show: true,
        type: "error",
        message: `Minimum withdrawal is ₦${minWithdrawal.toLocaleString()}.`,
      });

    if (parsedAmount > maxAvailable)
      return setModal({
        show: true,
        type: "error",
        message: `Amount exceeds available ${tab} balance.`,
      });

    if (method === "Bank" && !selectedBankId)
      return setModal({
        show: true,
        type: "error",
        message: "Please select a bank account.",
      });

    if (tab === "capital" && !selectedInvestmentId)
      return setModal({
        show: true,
        type: "error",
        message: "Select an eligible investment for capital withdrawal.",
      });

    setSubmitting(true);
    try {
      const payload = {
        type: tab,
        amount: parsedAmount,
        method,
        bankId: selectedBankId,
        investmentId: selectedInvestmentId,
      };

      await axios.post(`${API_BASE}/api/withdrawals`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setModal({
        show: true,
        type: "success",
        message: `Withdrawal of ₦${parsedAmount.toLocaleString()} submitted successfully.`,
      });
      setAmount("");
    } catch (err) {
      console.error("Withdrawal error:", err);
      setModal({
        show: true,
        type: "error",
        message:
          err.response?.data?.message ||
          "Failed to submit withdrawal request. Please retry.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!wallet) {
    return (
      <div style={styles.loadingPage}>
        <div>Loading wallet...</div>
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Withdraw Funds</h2>
      <p style={styles.sub}>
        Withdraw profits anytime or access your capital when investments mature.
      </p>

      {/* Tabs */}
      <div style={styles.tabs}>
        {["profit", "capital"].map((t) => (
          <button
            key={t}
            style={{
              ...styles.tab,
              ...(tab === t ? styles.tabActive : {}),
            }}
            onClick={() => setTab(t)}
          >
            {t === "profit" ? "Profit Withdrawal" : "Capital Withdrawal"}
          </button>
        ))}
      </div>

      {/* KPI Section */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>
            {tab === "profit" ? "Profit Balance" : "Eligible Capital"}
          </div>
          <div style={styles.kpiValue}>
            ₦
            {(tab === "profit"
              ? wallet.profitBalance
              : capitalEligible.reduce((s, i) => s + i.capital, 0)
            ).toLocaleString()}
          </div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Minimum Withdrawal</div>
          <div style={styles.kpiValue}>₦{minWithdrawal.toLocaleString()}</div>
        </div>
      </div>

      {/* Form */}
      <div style={styles.card}>
        {tab === "capital" && (
          <>
            <label style={styles.label}>Eligible Investments</label>
            <select
              value={selectedInvestmentId}
              onChange={(e) => setSelectedInvestmentId(e.target.value)}
              style={styles.input}
            >
              {capitalEligible.length ? (
                capitalEligible.map((i) => (
                  <option key={i._id} value={i._id}>
                    {i.shopName} — ₦{i.capital.toLocaleString()} (ends{" "}
                    {i.endDate})
                  </option>
                ))
              ) : (
                <option>No eligible investments</option>
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
          <option value="Bank">Bank</option>
          <option value="VelvPay">VelvPay</option>
        </select>

        {method === "Bank" && (
          <>
            <label style={styles.label}>Select Bank Account</label>
            <select
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
              style={styles.input}
            >
              {wallet.bankAccounts?.length ? (
                wallet.bankAccounts.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.bank} • {b.number} • {b.name}
                  </option>
                ))
              ) : (
                <option>No saved bank accounts</option>
              )}
            </select>
          </>
        )}

        <label style={styles.label}>
          Amount (max ₦{maxAvailable.toLocaleString()})
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={styles.input}
          placeholder="Enter amount"
        />

        <div style={styles.breakdown}>
          <div style={styles.breakRow}>
            <span>Fee (1%)</span>
            <span>₦{fee.toLocaleString()}</span>
          </div>
          <div style={styles.breakRow}>
            <span>Net Amount</span>
            <span style={{ fontWeight: 700 }}>
              ₦{netAmount.toLocaleString()}
            </span>
          </div>
        </div>

        <button
          onClick={submitWithdrawal}
          style={styles.primaryBtn}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Withdraw"}
        </button>
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
                marginBottom: ".5rem",
              }}
            >
              {modal.type === "error" ? "Error" : "Success"}
            </h3>
            <p style={{ color: "#e2e8f0", marginBottom: "1rem" }}>
              {modal.message}
            </p>
            <button
              onClick={() => setModal({ show: false, type: "", message: "" })}
              style={styles.closeBtn}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Styles ---- */
const styles = {
  page: {
    fontFamily: "Inter, sans-serif",
    color: "#e2e8f0",
    maxWidth: 900,
    margin: "0 auto",
    padding: "1rem",
  },
  title: { fontSize: "1.6rem", fontWeight: 800, marginBottom: ".3rem" },
  sub: { color: "#94a3b8", marginBottom: "1rem" },
  tabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: ".5rem",
    backgroundColor: "#1e293b",
    borderRadius: "10px",
    padding: ".25rem",
    marginBottom: "1rem",
  },
  tab: {
    flex: 1,
    padding: ".6rem .8rem",
    border: "none",
    borderRadius: "8px",
    background: "transparent",
    color: "#cbd5e1",
    fontWeight: 600,
    cursor: "pointer",
  },
  tabActive: { backgroundColor: "#2563eb", color: "#fff" },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
    marginBottom: "1rem",
  },
  kpiCard: {
    backgroundColor: "#111827",
    borderRadius: "10px",
    padding: "1rem",
  },
  kpiLabel: { color: "#94a3b8", marginBottom: ".2rem" },
  kpiValue: { fontSize: "1.3rem", fontWeight: 800, color: "#38bdf8" },
  card: {
    backgroundColor: "#111827",
    borderRadius: "12px",
    padding: "1rem",
    marginBottom: "1rem",
  },
  label: { display: "block", marginBottom: ".3rem", color: "#94a3b8" },
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
    borderRadius: "8px",
    padding: ".6rem .75rem",
    marginBottom: ".8rem",
  },
  breakRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: ".2rem 0",
  },
  primaryBtn: {
    width: "100%",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: ".75rem",
    fontWeight: 700,
    cursor: "pointer",
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
    padding: "1rem",
  },
  modal: {
    backgroundColor: "#1e293b",
    borderRadius: "10px",
    padding: "1.5rem",
    width: "90%",
    maxWidth: "400px",
    textAlign: "center",
    border: "2px solid rgba(255,255,255,0.1)",
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
  loadingPage: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontFamily: "Inter, sans-serif",
  },
};
