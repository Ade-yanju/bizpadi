import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Profile() {
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    kycStatus: "",
    emailVerified: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const API_BASE =
    import.meta.env?.VITE_API_BASE_URL ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000";

  const headers = { Authorization: `Bearer ${token}` };

  /* ------------------ Fetch Profile Data ------------------ */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/auth/me`, { headers });
        const u = res.data.user;
        setProfile({
          fullName: u.name || "",
          username: u.username || "",
          email: u.email || "",
          phone: u.phone || "",
          kycStatus: u.kycStatus || "Pending",
          emailVerified: u.emailVerified || false,
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchProfile();
  }, [token]);

  /* ------------------ Save Profile Updates ------------------ */
  const saveProfile = async () => {
    try {
      setMessage("");
      setError("");
      const res = await axios.put(
        `${API_BASE}/api/auth/profile`,
        {
          name: profile.fullName,
          phone: profile.phone,
        },
        { headers }
      );
      setMessage(res.data.message || "✅ Profile updated successfully!");
      setEditing(false);
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.response?.data?.message || "❌ Failed to update profile");
    } finally {
      setTimeout(() => {
        setMessage("");
        setError("");
      }, 2500);
    }
  };

  /* ------------------ Update Password ------------------ */
  const savePassword = async () => {
    if (!passwordForm.current || !passwordForm.newPass) {
      setError("❌ Password fields are required.");
      return;
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      setError("❌ New password mismatch.");
      return;
    }

    try {
      await axios.put(
        `${API_BASE}/api/auth/password`,
        {
          currentPassword: passwordForm.current,
          newPassword: passwordForm.newPass,
        },
        { headers }
      );
      setMessage("✅ Password updated successfully!");
      setPasswordForm({ current: "", newPass: "", confirm: "" });
      setChangingPassword(false);
    } catch (err) {
      console.error("Password update error:", err);
      setError(err.response?.data?.message || "❌ Failed to update password");
    } finally {
      setTimeout(() => {
        setMessage("");
        setError("");
      }, 2500);
    }
  };

  /* ------------------ UI ------------------ */
  if (loading)
    return (
      <div style={{ color: "#e2e8f0", textAlign: "center", padding: "2rem" }}>
        Loading profile...
      </div>
    );

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>My Profile</h2>
      <p style={styles.sub}>Manage your account and security settings</p>

      {/* Alerts */}
      {message && (
        <div style={{ ...styles.alert, background: "#065f46" }}>{message}</div>
      )}
      {error && (
        <div style={{ ...styles.alert, background: "#7f1d1d" }}>{error}</div>
      )}

      {/* Profile Info */}
      <div style={styles.card}>
        <div style={styles.avatarBox}>
          <div style={styles.avatar}>{profile.fullName.charAt(0)}</div>
          <div>
            <p style={styles.name}>{profile.fullName}</p>
            <p style={styles.username}>@{profile.username}</p>
            {profile.kycStatus === "Verified" ? (
              <span
                style={{
                  ...styles.badge,
                  background: "#065f46",
                  color: "#6ee7b7",
                }}
              >
                ✅ KYC Verified
              </span>
            ) : (
              <span
                style={{
                  ...styles.badge,
                  background: "#7f1d1d",
                  color: "#fecaca",
                }}
              >
                🚫 KYC Not Verified
              </span>
            )}
          </div>
        </div>

        {/* Editable Form */}
        <div style={styles.form}>
          <label style={styles.label}>Full Name</label>
          <input
            disabled={!editing}
            value={profile.fullName}
            onChange={(e) =>
              setProfile({ ...profile, fullName: e.target.value })
            }
            style={{
              ...styles.input,
              ...(editing ? {} : styles.disabledInput),
            }}
          />

          <label style={styles.label}>Email Address</label>
          <input
            disabled
            value={profile.email}
            style={{ ...styles.input, ...styles.disabledInput }}
          />
          {profile.emailVerified ? (
            <span style={styles.statusGood}>✅ Verified</span>
          ) : (
            <span style={styles.statusBad}>Pending verification</span>
          )}

          <label style={styles.label}>Phone Number</label>
          <input
            disabled={!editing}
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            style={{
              ...styles.input,
              ...(editing ? {} : styles.disabledInput),
            }}
          />

          <div style={styles.btnRow}>
            {editing ? (
              <>
                <button style={styles.primaryBtn} onClick={saveProfile}>
                  Save Changes
                </button>
                <button
                  style={styles.secondaryBtn}
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                style={styles.primaryBtn}
                onClick={() => setEditing(true)}
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Password */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Change Password</h3>

        {changingPassword ? (
          <>
            <label style={styles.label}>Current Password</label>
            <input
              type="password"
              value={passwordForm.current}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, current: e.target.value })
              }
              style={styles.input}
            />

            <label style={styles.label}>New Password</label>
            <input
              type="password"
              value={passwordForm.newPass}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, newPass: e.target.value })
              }
              style={styles.input}
            />

            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              value={passwordForm.confirm}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirm: e.target.value })
              }
              style={styles.input}
            />

            <div style={styles.btnRow}>
              <button style={styles.primaryBtn} onClick={savePassword}>
                Update Password
              </button>
              <button
                style={styles.secondaryBtn}
                onClick={() => setChangingPassword(false)}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <button
            style={styles.primaryBtn}
            onClick={() => setChangingPassword(true)}
          >
            Change Password
          </button>
        )}
      </div>
    </div>
  );
}

/* -------- Styles -------- */
const styles = {
  page: {
    color: "#e2e8f0",
    fontFamily: "Inter, sans-serif",
    maxWidth: 550,
    margin: "auto",
    padding: "1rem",
  },
  title: { fontSize: "1.6rem", fontWeight: 800, marginBottom: ".3rem" },
  sub: { color: "#94a3b8", marginBottom: "1rem" },
  alert: {
    color: "#fff",
    padding: ".65rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    textAlign: "center",
    fontWeight: 600,
  },
  card: {
    backgroundColor: "#111827",
    padding: "1.2rem",
    borderRadius: "12px",
    border: "1px solid #1f2937",
    marginBottom: "1.2rem",
  },
  avatarBox: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "1.2rem",
  },
  avatar: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    backgroundColor: "#38bdf8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "1.3rem",
  },
  name: { fontSize: "1.1rem", fontWeight: 700 },
  username: { color: "#94a3b8", marginBottom: ".4rem" },
  badge: {
    padding: ".25rem .6rem",
    fontSize: ".75rem",
    borderRadius: "6px",
    fontWeight: 700,
  },
  label: { display: "block", marginBottom: ".25rem", color: "#94a3b8" },
  input: {
    width: "100%",
    padding: ".65rem",
    backgroundColor: "#0b1220",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#fff",
    marginBottom: ".9rem",
  },
  disabledInput: { opacity: 0.5, cursor: "not-allowed" },
  statusGood: { color: "#22c55e", marginTop: "-.7rem", marginBottom: ".7rem" },
  statusBad: { color: "#ef4444", marginTop: "-.7rem", marginBottom: ".7rem" },
  btnRow: { display: "flex", gap: ".6rem" },
  primaryBtn: {
    flex: 1,
    padding: ".75rem",
    backgroundColor: "#2563eb",
    border: "none",
    borderRadius: "8px",
    fontWeight: 700,
    cursor: "pointer",
    color: "#fff",
  },
  secondaryBtn: {
    flex: 1,
    border: "1px solid #334155",
    padding: ".75rem",
    borderRadius: "8px",
    fontWeight: 600,
    cursor: "pointer",
    backgroundColor: "transparent",
    color: "#e2e8f0",
  },
  cardTitle: { fontSize: "1.05rem", fontWeight: 700, marginBottom: ".8rem" },
};
