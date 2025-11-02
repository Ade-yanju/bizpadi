import React, { useEffect, useState } from "react";
import axios from "axios";

export default function KYCVerification() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [kycStatus, setKycStatus] = useState("not_submitted");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    fullName: "",
    dob: "",
    address: "",
    idType: "",
    idNumber: "",
    idFile: null,
    selfie: null,
  });

  const token = localStorage.getItem("token");
  const API_BASE =
    import.meta.env?.VITE_API_BASE_URL ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000";

  const headers = { Authorization: `Bearer ${token}` };
  const percent = (step / 4) * 100;

  /* ------------------ Fetch Existing KYC ------------------ */
  useEffect(() => {
    const fetchKYC = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/kyc/me`, { headers });
        if (res.data.kyc) {
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
        console.error("Error fetching KYC:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchKYC();
  }, []);

  /* ------------------ Validation ------------------ */
  const goNext = () => {
    const validateStep = {
      1: () =>
        form.fullName && form.dob && form.address
          ? ""
          : "All fields are required",
      2: () =>
        form.idType && form.idNumber && form.idFile
          ? ""
          : "Upload ID and fill details",
      3: () => (form.selfie ? "" : "Selfie is required"),
    }[step];

    const v = validateStep?.();
    if (v) return setError(v);

    setError("");
    setStep((prev) => prev + 1);
  };

  /* ------------------ Submit KYC ------------------ */
  const submitKYC = async () => {
    try {
      setError("");
      setMessage("Submitting KYC...");
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v) data.append(k, v);
      });

      const res = await axios.post(`${API_BASE}/api/kyc/submit`, data, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });

      setMessage(res.data.message || "✅ KYC submitted successfully!");
      setKycStatus("pending");
      setStep(1);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("KYC submission error:", err);
      setError(err.response?.data?.message || "❌ Failed to submit KYC.");
    }
  };

  if (loading)
    return <div style={{ color: "#e2e8f0" }}>Loading KYC status...</div>;

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

  /* ------------------ Main Form ------------------ */
  return (
    <div style={styles.page}>
      <h2 style={styles.title}>KYC Verification</h2>
      <p style={styles.sub}>Complete all steps for full account access.</p>

      {message && (
        <div style={{ ...styles.notice, color: "#22c55e" }}>{message}</div>
      )}
      {error && (
        <div style={{ ...styles.notice, color: "#f87171" }}>{error}</div>
      )}

      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${percent}%` }} />
      </div>
      <p style={styles.stepText}>Step {step} of 4</p>

      <div style={styles.card}>
        {step === 1 && (
          <>
            <h3 style={styles.cardTitle}>Personal Information</h3>
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
            <h3 style={styles.cardTitle}>Government ID Upload</h3>
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
            <p style={styles.subtle}>
              Make sure your full face is visible (no glasses or hat).
            </p>
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
            <h3 style={styles.cardTitle}>Review & Submit ✅</h3>
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
    </div>
  );
}

/* ------------ Styles ------------ */
const styles = {
  page: { color: "#e2e8f0", fontFamily: "Inter, sans-serif", maxWidth: 600 },
  title: { fontSize: "1.6rem", fontWeight: 800 },
  sub: { color: "#94a3b8", marginBottom: "1rem" },
  notice: {
    padding: ".6rem",
    borderRadius: "8px",
    textAlign: "center",
    marginBottom: ".6rem",
  },
  progressBar: {
    height: "10px",
    background: "#1e293b",
    borderRadius: "10px",
    marginBottom: ".5rem",
  },
  progressFill: {
    height: "100%",
    background: "#38bdf8",
    borderRadius: "10px",
    transition: "width .3s",
  },
  stepText: { textAlign: "right", color: "#94a3b8", marginBottom: ".8rem" },
  card: {
    backgroundColor: "#111827",
    padding: "1.2rem",
    borderRadius: "12px",
    border: "1px solid #1f2937",
  },
  cardTitle: { fontWeight: 700, fontSize: "1.1rem", marginBottom: ".8rem" },
  input: {
    width: "100%",
    padding: ".7rem",
    backgroundColor: "#0b1220",
    borderRadius: "8px",
    border: "1px solid #334155",
    color: "#fff",
    marginBottom: ".8rem",
  },
  fileInput: { color: "#fff", marginBottom: ".5rem" },
  fileText: { color: "#38bdf8", fontSize: ".9rem" },
  subtle: { color: "#94a3b8", marginBottom: ".6rem" },
  reviewBox: {
    background: "#1e293b",
    padding: ".9rem",
    borderRadius: "10px",
    border: "1px solid #334155",
    marginBottom: ".9rem",
  },
  btnRow: { display: "flex", gap: ".6rem", marginTop: ".6rem" },
  backBtn: {
    flex: 1,
    background: "none",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#e2e8f0",
    padding: ".75rem",
  },
  nextBtn: {
    flex: 1,
    background: "#2563eb",
    borderRadius: "8px",
    border: "none",
    padding: ".75rem",
    color: "#fff",
    fontWeight: 700,
  },
  submitBtn: {
    width: "100%",
    background: "#059669",
    borderRadius: "8px",
    border: "none",
    padding: ".9rem",
    color: "#fff",
    fontWeight: 700,
  },
};
