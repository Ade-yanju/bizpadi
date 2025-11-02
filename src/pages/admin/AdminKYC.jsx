import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminKYC() {
  const [kycs, setKycs] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  const API_BASE =
    (typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_API_BASE_URL) ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000";

  useEffect(() => {
    const fetchKycList = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/admin/kyc`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setKycs(res.data.kycs);
      } catch (err) {
        console.error("Failed to load KYC list:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchKycList();
  }, [API_BASE, token]);

  const updateKycStatus = async (id, status) => {
    try {
      await axios.patch(
        `${API_BASE}/api/admin/kyc/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setKycs((prev) => prev.map((k) => (k._id === id ? { ...k, status } : k)));
    } catch (err) {
      console.error("Failed to update KYC:", err);
      alert("Action failed. Try again.");
    }
  };

  if (loading)
    return (
      <div style={styles.loading}>
        <p>Loading KYCs...</p>
      </div>
    );

  return (
    <div style={styles.page}>
      <h1 style={styles.h1}>KYC Verification</h1>
      {kycs.length === 0 ? (
        <p style={styles.empty}>No KYC submissions found.</p>
      ) : (
        <div style={styles.grid}>
          {kycs.map((kyc) => (
            <div key={kyc._id} style={styles.card}>
              <h3 style={styles.userName}>{kyc.user?.name}</h3>
              <p style={styles.userEmail}>{kyc.user?.email}</p>
              <p>
                <strong>Document:</strong> {kyc.documentType}
              </p>
              <div style={styles.docPreview}>
                <img
                  src={kyc.documentUrl}
                  alt="KYC Document"
                  style={styles.image}
                />
                {kyc.selfieUrl && (
                  <img
                    src={kyc.selfieUrl}
                    alt="User Selfie"
                    style={styles.image}
                  />
                )}
              </div>

              <p>
                <strong>Status:</strong>{" "}
                <span
                  style={{
                    color:
                      kyc.status === "approved"
                        ? "#22c55e"
                        : kyc.status === "rejected"
                        ? "#ef4444"
                        : "#fbbf24",
                    fontWeight: 600,
                  }}
                >
                  {kyc.status.toUpperCase()}
                </span>
              </p>

              {kyc.status === "pending" && (
                <div style={styles.btnGroup}>
                  <button
                    style={{ ...styles.btn, backgroundColor: "#22c55e" }}
                    onClick={() => updateKycStatus(kyc._id, "approved")}
                  >
                    Approve
                  </button>
                  <button
                    style={{ ...styles.btn, backgroundColor: "#ef4444" }}
                    onClick={() => updateKycStatus(kyc._id, "rejected")}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Styles ---------- */
const styles = {
  page: {
    color: "#e2e8f0",
    fontFamily: "Inter, sans-serif",
    padding: "1rem",
  },
  h1: {
    fontSize: "1.6rem",
    fontWeight: 800,
    marginBottom: "1rem",
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    color: "#fff",
  },
  empty: { color: "#94a3b8", fontSize: "0.9rem" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "1rem",
  },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: "12px",
    border: "1px solid #334155",
    padding: "1rem",
  },
  userName: { fontWeight: 700, fontSize: "1.1rem" },
  userEmail: { color: "#94a3b8", fontSize: "0.9rem", marginBottom: "0.4rem" },
  docPreview: {
    display: "flex",
    gap: "0.5rem",
    margin: "0.6rem 0",
  },
  image: {
    width: "100px",
    height: "70px",
    objectFit: "cover",
    borderRadius: "6px",
    border: "1px solid #475569",
  },
  btnGroup: {
    display: "flex",
    gap: "0.5rem",
    marginTop: "0.6rem",
  },
  btn: {
    flex: 1,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "0.6rem",
    cursor: "pointer",
    fontWeight: 600,
  },
};
