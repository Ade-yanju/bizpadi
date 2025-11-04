import React, { useEffect, useState } from "react";
import axios from "axios";

export default function KYCVerification() {
  const [step, setStep] = useState(1);
  const [kycStatus, setKycStatus] = useState("not_submitted");
  const [form, setForm] = useState({
    fullName: "",
    dob: "",
    address: "",
    idType: "",
    idNumber: "",
    idFile: null,
    selfie: null,
  });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ show: false, type: "", message: "" });

  const token = localStorage.getItem("token");
  const API_BASE =
    import.meta.env?.VITE_API_BASE_URL ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000";

  const headers = { Authorization: `Bearer ${token}` };
  const percent = (step / 4) * 100;

  useEffect(() => {
    const fetchKYC = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/kyc/me`, { headers });
        if (res.data?.kyc) {
          setKycStatus(res.data.kyc.status);
          setForm({
            fullName: res.data.kyc.fullName || "",
            dob: res.data.kyc.dob || "",
            address: res.data.kyc.address || "",
            idType: res.data.kyc.idType || "",
            idNumber: res.data.kyc.idNumber || "",
            idFile: null,
            selfie: null,
          });
        }
      } catch (err) {
        console.error("Fetch KYC error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchKYC();
  }, []);

  const validate = () => {
    if (step === 1 && (!form.fullName || !form.dob || !form.address))
      return "All personal info fields are required.";
    if (step === 2 && (!form.idType || !form.idNumber || !form.idFile))
      return "Upload your ID and fill details.";
    if (step === 3 && !form.selfie) return "Upload your selfie photo.";
    return "";
  };

  const goNext = () => {
    const err = validate();
    if (err) return setModal({ show: true, type: "error", message: err });
    setStep(step + 1);
  };

  const submitKYC = async () => {
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => v && data.append(k, v));

      await axios.post(`${API_BASE}/api/kyc/submit`, data, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });

      setModal({
        show: true,
        type: "success",
        message: "KYC submitted successfully ✅",
      });
      setKycStatus("pending");
      setStep(1);
    } catch (err) {
      console.error(err);
      setModal({
        show: true,
        type: "error",
        message: err.response?.data?.message || "Failed to submit KYC.",
      });
    }
  };

  if (loading) return <div style={styles.page}>Loading...</div>;

  if (kycStatus === "approved")
    return (
      <div style={styles.page}>
        <h2 style={styles.title}>KYC Verification</h2>
        <p style={styles.sub}>
          Your KYC has been <b style={{ color: "#22c55e" }}>approved ✅</b>
        </p>
      </div>
    );

  if (kycStatus === "pending")
    return (
      <div style={styles.page}>
        <h2 style={styles.title}>KYC Verification</h2>
        <p style={styles.sub}>Your documents are under review ⏳</p>
      </div>
    );

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>KYC Verification</h2>
      <p style={styles.sub}>Complete all steps to verify your account.</p>

      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${percent}%` }} />
      </div>
      <p style={styles.stepText}>Step {step} of 4</p>

      <div style={styles.card}>
        {step === 1 && (
          <>
            <h3 style={styles.cardTitle}>Personal Info</h3>
            <input
              type="text"
              placeholder="Full Name"
              style={styles.input}
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
            <input
              type="date"
              style={styles.input}
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
            />
            <textarea
              placeholder="Residential Address"
              rows={3}
              style={styles.input}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </>
        )}

        {step === 2 && (
          <>
            <h3 style={styles.cardTitle}>Government ID</h3>
            <select
              style={styles.input}
              value={form.idType}
              onChange={(e) => setForm({ ...form, idType: e.target.value })}
            >
              <option value="">Select ID Type</option>
              <option>National ID</option>
              <option>Passport</option>
              <option>Driver’s License</option>
            </select>
            <input
              type="text"
              placeholder="ID Number"
              style={styles.input}
              value={form.idNumber}
              onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
            />
            <input
              type="file"
              accept="image/*"
              style={styles.fileInput}
              onChange={(e) => setForm({ ...form, idFile: e.target.files[0] })}
            />
            {form.idFile && (
              <p style={styles.fileText}>✅ {form.idFile.name}</p>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <h3 style={styles.cardTitle}>Selfie Verification</h3>
            <p style={styles.subtle}>Ensure your face is clear and visible.</p>
            <input
              type="file"
              accept="image/*"
              style={styles.fileInput}
              onChange={(e) => setForm({ ...form, selfie: e.target.files[0] })}
            />
            {form.selfie && (
              <p style={styles.fileText}>✅ {form.selfie.name}</p>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <h3 style={styles.cardTitle}>Review & Submit</h3>
            <div style={styles.reviewBox}>
              <p>
                <b>Name:</b> {form.fullName}
              </p>
              <p>
                <b>Date of Birth:</b> {form.dob}
              </p>
              <p>
                <b>Address:</b> {form.address}
              </p>
              <p>
                <b>ID Type:</b> {form.idType}
              </p>
              <p>
                <b>ID Number:</b> {form.idNumber}
              </p>
            </div>
          </>
        )}

        <div style={styles.btnRow}>
          {step > 1 && (
            <button style={styles.backBtn} onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          {step < 4 ? (
            <button style={styles.nextBtn} onClick={goNext}>
              Continue →
            </button>
          ) : (
            <button style={styles.submitBtn} onClick={submitKYC}>
              Submit KYC ✅
            </button>
          )}
        </div>
      </div>

      {modal.show && (
        <div style={styles.modalOverlay}>
          <div
            style={{
              ...styles.modal,
              borderColor: modal.type === "error" ? "#ef4444" : "#22c55e",
            }}
          >
            <h3
              style={{
                color: modal.type === "error" ? "#ef4444" : "#22c55e",
              }}
            >
              {modal.type === "error" ? "Error" : "Success"}
            </h3>
            <p style={{ color: "#e2e8f0" }}>{modal.message}</p>
            <button
              onClick={() => setModal({ show: false, type: "", message: "" })}
              style={{
                marginTop: "1rem",
                backgroundColor: modal.type === "error" ? "#ef4444" : "#22c55e",
                color: "#fff",
                padding: "0.6rem 1rem",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
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

const styles = {
  page: { color: "#e2e8f0", fontFamily: "Inter, sans-serif", maxWidth: 600 },
  title: { fontSize: "1.6rem", fontWeight: 800 },
  sub: { color: "#94a3b8", marginBottom: "1rem" },
  progressBar: { height: "10px", background: "#1e293b", borderRadius: "10px" },
  progressFill: { height: "100%", background: "#38bdf8", borderRadius: "10px" },
  stepText: { textAlign: "right", color: "#94a3b8", marginBottom: ".8rem" },
  card: {
    backgroundColor: "#111827",
    padding: "1.2rem",
    borderRadius: "12px",
    border: "1px solid #1f2937",
  },
  input: {
    width: "100%",
    padding: ".7rem",
    backgroundColor: "#0b1220",
    borderRadius: "8px",
    border: "1px solid #334155",
    color: "#fff",
    marginBottom: ".8rem",
  },
  btnRow: { display: "flex", gap: ".6rem", marginTop: ".6rem" },
  nextBtn: {
    flex: 1,
    background: "#2563eb",
    borderRadius: "8px",
    border: "none",
    padding: ".75rem",
    color: "#fff",
    fontWeight: 700,
  },
  backBtn: {
    flex: 1,
    background: "none",
    border: "1px solid #334155",
    color: "#e2e8f0",
    borderRadius: "8px",
    padding: ".75rem",
  },
  submitBtn: {
    width: "100%",
    background: "#059669",
    border: "none",
    borderRadius: "8px",
    padding: ".9rem",
    color: "#fff",
    fontWeight: 700,
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  modal: {
    background: "#1e293b",
    padding: "1.5rem",
    borderRadius: "10px",
    border: "2px solid rgba(255,255,255,0.1)",
    maxWidth: "400px",
    width: "90%",
    textAlign: "center",
  },
};
