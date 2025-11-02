import React, { useState } from "react";

export default function DepositFunds() {
  const [activeTab, setActiveTab] = useState("velvpay");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [error, setError] = useState("");
  const [manualProof, setManualProof] = useState(null);

  const minDeposit = 100;

  const handleVelvPayDeposit = () => {
    if (!amount || amount < minDeposit) {
      setError(`Minimum deposit is ₦${minDeposit}`);
      return;
    }
    alert(`Proceeding to VelvPay for ₦${amount}`);
  };

  const handleManualSubmit = () => {
    if (!amount || amount < minDeposit) {
      setError(`Minimum deposit is ₦${minDeposit}`);
      return;
    }
    if (!manualProof) {
      setError("Upload payment evidence");
      return;
    }
    alert("Manual deposit submitted — Pending approval ✅");
  };

  const quickAmounts = [100, 500, 1000, 5000];

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Deposit Funds</h2>
      <p style={styles.sub}>
        Add funds to your account via Velvpay or Bank Transfer.
      </p>

      {/* TAB SWITCHER */}
      <div style={styles.tabSwitch}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === "velvpay" ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab("velvpay")}
        >
          VelvPay Payment
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === "manual" ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab("manual")}
        >
          Manual Deposit
        </button>
      </div>

      {/* FORM CARD */}
      <div style={styles.card}>
        {/* Amount Field */}
        <label style={styles.label}>Enter Amount</label>
        <input
          type="number"
          placeholder={`₦${minDeposit} minimum`}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          style={styles.input}
        />

        {/* Quick Select */}
        <div style={styles.quickBtns}>
          {quickAmounts.map((amt) => (
            <button
              key={amt}
              onClick={() => setAmount(amt)}
              style={styles.quickBtn}
            >
              ₦{amt}
            </button>
          ))}
        </div>

        {/* Currency */}
        <label style={styles.label}>Select Currency</label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          style={styles.input}
        >
          <option value="NGN">NGN — Nigerian Naira</option>
          <option value="USD">USD — US Dollar</option>
        </select>

        {activeTab === "velvpay" && (
          <>
            <div style={styles.infoBox}>
              ✅ Your payment is securely processed by <strong>VelvPay</strong>
            </div>
            {error && <p style={styles.error}>{error}</p>}

            <button style={styles.primaryBtn} onClick={handleVelvPayDeposit}>
              Proceed to VelvPay
            </button>
          </>
        )}

        {activeTab === "manual" && (
          <>
            <div style={styles.bankBox}>
              <p style={styles.bankLine}>
                <strong>Bank Name:</strong> Access Bank
              </p>
              <p style={styles.bankLine}>
                <strong>Account Number:</strong> 1234567890
              </p>
              <p style={styles.bankLine}>
                <strong>Account Name:</strong> Virtual Shop Investments
              </p>
            </div>

            {/* Upload Proof */}
            <label style={styles.label}>Upload Payment Evidence</label>
            <input
              type="file"
              onChange={(e) => setManualProof(e.target.files[0])}
              style={styles.fileInput}
              accept="image/*"
            />

            {manualProof && (
              <p style={{ color: "#38bdf8", marginBottom: ".5rem" }}>
                ✅ File selected: {manualProof.name}
              </p>
            )}

            {error && <p style={styles.error}>{error}</p>}

            <button style={styles.primaryBtn} onClick={handleManualSubmit}>
              Submit Deposit Request
            </button>
          </>
        )}
      </div>

      <div style={{ marginTop: "1rem", textAlign: "center" }}>
        <button style={styles.linkBtn}>View Transaction History</button>
      </div>
    </div>
  );
}

/* ---------- Styles ---------- */
const styles = {
  page: {
    fontFamily: "Inter, sans-serif",
    color: "#e2e8f0",
    maxWidth: "500px",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 800,
    marginBottom: ".3rem",
  },
  sub: {
    color: "#94a3b8",
    marginBottom: "1.2rem",
  },

  tabSwitch: {
    display: "flex",
    backgroundColor: "#1e293b",
    borderRadius: "10px",
    border: "1px solid #334155",
    overflow: "hidden",
    marginBottom: "1rem",
  },
  tab: {
    flex: 1,
    padding: ".75rem",
    textAlign: "center",
    cursor: "pointer",
    background: "transparent",
    color: "#94a3b8",
    fontWeight: 600,
    border: "none",
    outline: "none",
  },
  activeTab: {
    backgroundColor: "#2563eb",
    color: "#fff",
  },

  card: {
    backgroundColor: "#111827",
    borderRadius: "12px",
    padding: "1.2rem",
    border: "1px solid #1f2937",
  },

  label: {
    display: "block",
    marginBottom: ".35rem",
    color: "#94a3b8",
  },
  input: {
    width: "100%",
    padding: "0.7rem",
    backgroundColor: "#0b1220",
    border: "1px solid #334155",
    borderRadius: "8px",
    marginBottom: ".8rem",
    color: "#fff",
    outline: "none",
  },
  fileInput: {
    width: "100%",
    marginBottom: ".8rem",
    color: "#fff",
  },

  quickBtns: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: ".8rem",
  },
  quickBtn: {
    flex: 1,
    padding: ".5rem 0",
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "6px",
    color: "#e2e8f0",
    cursor: "pointer",
    fontSize: ".9rem",
    fontWeight: 600,
  },

  infoBox: {
    backgroundColor: "#1e3a8a",
    borderRadius: "8px",
    color: "#fff",
    padding: ".75rem",
    marginBottom: ".8rem",
    fontSize: ".85rem",
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
    padding: ".75rem",
    borderRadius: "10px",
    border: "none",
    fontSize: ".95rem",
    fontWeight: 700,
    cursor: "pointer",
    color: "#fff",
    marginTop: "0.5rem",
  },

  linkBtn: {
    background: "none",
    border: "none",
    color: "#38bdf8",
    cursor: "pointer",
    fontSize: ".95rem",
    fontWeight: 600,
    textDecoration: "underline",
  },

  bankBox: {
    backgroundColor: "#0b1220",
    padding: ".8rem",
    borderRadius: "10px",
    border: "1px solid #334155",
    marginBottom: ".8rem",
    fontSize: ".9rem",
    lineHeight: "1.4rem",
  },
  bankLine: {
    margin: "0",
    color: "#cbd5e1",
  },
};
