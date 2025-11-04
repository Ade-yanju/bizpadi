import React, { useState } from "react";

export default function DepositFunds() {
  const [activeTab, setActiveTab] = useState("velvpay");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [manualProof, setManualProof] = useState(null);
  const [modal, setModal] = useState({ show: false, type: "", message: "" });

  const minDeposit = 100;
  const quickAmounts = [100, 500, 1000, 5000];

  // --- VelvPay handler ---
  const handleVelvPayDeposit = () => {
    if (!amount || amount < minDeposit) {
      setModal({
        show: true,
        type: "error",
        message: `Minimum deposit is ₦${minDeposit}.`,
      });
      return;
    }

    setModal({
      show: true,
      type: "success",
      message: `Proceeding to VelvPay for ₦${amount.toLocaleString()}...`,
    });
  };

  // --- Manual handler ---
  const handleManualSubmit = () => {
    if (!amount || amount < minDeposit) {
      setModal({
        show: true,
        type: "error",
        message: `Minimum deposit is ₦${minDeposit}.`,
      });
      return;
    }
    if (!manualProof) {
      setModal({
        show: true,
        type: "error",
        message: "Please upload payment evidence.",
      });
      return;
    }

    setModal({
      show: true,
      type: "success",
      message: "Manual deposit submitted — Pending approval ✅",
    });
    setAmount("");
    setManualProof(null);
  };

  return (
    <div style={styles.container}>
      <div style={styles.cardWrapper}>
        <h2 style={styles.title}>Deposit Funds</h2>
        <p style={styles.sub}>
          Add funds to your account via VelvPay or Manual Bank Transfer.
        </p>

        {/* Tabs */}
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

        {/* Deposit Form */}
        <div style={styles.card}>
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

          <label style={styles.label}>Select Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            style={styles.input}
          >
            <option value="NGN">NGN — Nigerian Naira</option>
            <option value="USD">USD — US Dollar</option>
          </select>

          {/* VelvPay Section */}
          {activeTab === "velvpay" && (
            <>
              <div style={styles.infoBox}>
                ✅ Your payment is securely processed by{" "}
                <strong>VelvPay</strong>
              </div>
              <button style={styles.primaryBtn} onClick={handleVelvPayDeposit}>
                Proceed to VelvPay
              </button>
            </>
          )}

          {/* Manual Section */}
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

      {/* Modal Alert */}
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
                backgroundColor:
                  modal.type === "error" ? "#ef4444" : "#22c55e",
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
  cardWrapper: {
    width: "100%",
    maxWidth: "480px",
    backgroundColor: "#1e293b",
    padding: "2rem 1.5rem",
    borderRadius: "12px",
    boxShadow: "0 0 20px rgba(0,0,0,0.3)",
    color: "#fff",
  },
  title: { fontSize: "1.5rem", fontWeight: 800, marginBottom: ".3rem" },
  sub: { color: "#94a3b8", marginBottom: "1.2rem" },
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
  },
  activeTab: { backgroundColor: "#2563eb", color: "#fff" },
  card: {
    backgroundColor: "#111827",
    borderRadius: "12px",
    padding: "1rem",
    border: "1px solid #1f2937",
  },
  label: {
    display: "block",
    marginBottom: ".3rem",
    color: "#94a3b8",
    fontSize: "0.9rem",
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
    flexWrap: "wrap",
    gap: "0.5rem",
    marginBottom: ".8rem",
  },
  quickBtn: {
    flex: "1 1 45%",
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
  bankLine: { margin: "0", color: "#cbd5e1" },
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
