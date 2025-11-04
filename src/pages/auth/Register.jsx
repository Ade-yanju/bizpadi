import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../../firebase";
import axios from "axios";

export default function CreateAccount() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [modal, setModal] = useState({ show: false, type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const API_BASE =
    import.meta.env?.VITE_API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000";

  const checkPasswordStrength = (password) => {
    if (password.length < 6) return "Weak";
    if (password.length < 10) return "Medium";
    return "Strong";
  };
  const strength = checkPasswordStrength(password);

  const handleRegister = async (e) => {
    e.preventDefault();
    setModal({ show: false, message: "", type: "" });

    if (password !== confirmPassword) {
      setModal({
        show: true,
        type: "error",
        message: "Passwords do not match",
      });
      return;
    }

    try {
      setLoading(true);

      // ✅ Create user in Firebase
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await updateProfile(userCred.user, { displayName: name });

      // ✅ Get fresh token
      const token = await userCred.user.getIdToken(true);

      // ✅ Register with backend
      const { data } = await axios.post(
        `${API_BASE}/api/auth/register`,
        { name, email, contact },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.setItem("token", token);
      localStorage.setItem("role", data.role || "user");
      localStorage.setItem("user", JSON.stringify(data.user));

      setModal({
        show: true,
        type: "success",
        message: "Account created successfully! Redirecting...",
      });

      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      console.error("Registration error:", err);
      const code = err.code;
      let msg =
        err.response?.data?.message ||
        "Something went wrong. Please try again.";

      if (code === "auth/email-already-in-use")
        msg = "This email is already registered.";
      if (code === "auth/invalid-email") msg = "Invalid email address.";
      if (code === "auth/weak-password") msg = "Your password is too weak.";

      setModal({ show: true, type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoSection}>
          <div style={styles.logo}>V</div>
          <h2 style={styles.heading}>Create Your Account</h2>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
            Start your journey with us.
          </p>
        </div>

        <form onSubmit={handleRegister} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="Enter your email"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Contact Number</label>
            <input
              type="tel"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              style={styles.input}
              placeholder="Enter your contact number"
              required
            />
          </div>

          <div style={{ ...styles.formGroup, position: "relative" }}>
            <label style={styles.label}>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...styles.input, paddingRight: "2.5rem" }}
              placeholder="Enter your password"
              required
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
            {password && (
              <div
                style={{
                  fontSize: "0.8rem",
                  marginTop: "0.3rem",
                  color: strengthColor(strength),
                }}
              >
                {strength} password
              </div>
            )}
          </div>

          <div style={{ ...styles.formGroup, position: "relative" }}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ ...styles.input, paddingRight: "2.5rem" }}
              placeholder="Confirm your password"
              required
            />
            <span
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              {showConfirmPassword ? "🙈" : "👁️"}
            </span>
          </div>

          <div style={styles.terms}>
            <input type="checkbox" style={{ marginRight: "0.5rem" }} required />
            <span style={{ fontSize: "0.9rem" }}>
              I agree to the{" "}
              <a href="#" style={{ color: "#3b82f6", textDecoration: "none" }}>
                Terms and Conditions
              </a>
            </span>
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>

          <div style={styles.footerText}>
            Already have an account?{" "}
            <span onClick={() => navigate("/auth/login")} style={styles.link}>
              Log In
            </span>
          </div>
        </form>
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
              onClick={() => setModal({ show: false, message: "", type: "" })}
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

/* ----------------------------------------------------------------
   🎨 STYLES (fully responsive)
---------------------------------------------------------------- */
const styles = {
  container: {
    backgroundColor: "#0f172a",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Inter, sans-serif",
    color: "#fff",
    padding: "1rem",
  },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: "12px",
    padding: "2rem",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 0 20px rgba(0,0,0,0.3)",
  },
  logoSection: {
    textAlign: "center",
    marginBottom: "1.5rem",
  },
  logo: {
    backgroundColor: "#0d9488",
    width: "45px",
    height: "45px",
    borderRadius: "8px",
    margin: "0 auto 0.8rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "1.2rem",
  },
  heading: { fontWeight: "700", fontSize: "1.3rem", marginBottom: ".2rem" },
  form: { width: "100%" },
  formGroup: { marginBottom: "1rem" },
  label: { display: "block", marginBottom: "0.3rem", fontSize: "0.9rem" },
  input: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "8px",
    border: "1px solid #334155",
    backgroundColor: "#0f172a",
    color: "#fff",
    outline: "none",
    fontSize: "0.9rem",
    boxSizing: "border-box",
  },
  eyeIcon: {
    position: "absolute",
    right: "0.75rem",
    top: "0.7rem",
    cursor: "pointer",
    fontSize: "1.1rem",
  },
  terms: {
    display: "flex",
    alignItems: "center",
    marginBottom: "1rem",
    flexWrap: "wrap",
  },
  button: {
    width: "100%",
    backgroundColor: "#2563eb",
    color: "#fff",
    padding: "0.8rem",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "0.2s",
  },
  footerText: {
    textAlign: "center",
    marginTop: "1rem",
    fontSize: "0.9rem",
    color: "#94a3b8",
  },
  link: {
    color: "#3b82f6",
    textDecoration: "none",
    cursor: "pointer",
    fontWeight: "500",
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

const strengthColor = (strength) => {
  switch (strength) {
    case "Weak":
      return "#ef4444";
    case "Medium":
      return "#f59e0b";
    case "Strong":
      return "#22c55e";
    default:
      return "#94a3b8";
  }
};
