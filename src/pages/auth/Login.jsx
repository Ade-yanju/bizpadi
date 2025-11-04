import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import axios from "axios";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [modal, setModal] = useState({ show: false, type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const API_BASE =
    (typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_API_BASE_URL) ||
    process.env.VITE_API_BASE_URL ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000";

  const handleLogin = async (e) => {
    e.preventDefault();
    setModal({ show: false, message: "", type: "" });
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const token = await userCredential.user.getIdToken(true);

      const { data } = await axios.post(
        `${API_BASE}/api/auth/login`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const user = data.user;
      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("user", JSON.stringify(user));

      setModal({
        show: true,
        type: "success",
        message: "Login successful! Redirecting...",
      });

      setTimeout(() => {
        navigate(user.role === "admin" ? "/admin/home" : "/dashboard");
      }, 1500);
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      setModal({
        show: true,
        type: "error",
        message:
          err.response?.data?.message ||
          "Invalid credentials or unauthorized user.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoSection}>
          <div style={styles.logo}>V</div>
          <h2 style={styles.heading}>Welcome Back</h2>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...styles.input, paddingRight: "2.5rem" }}
                required
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>
            <span
              onClick={() => navigate("/auth/forgot-password")}
              style={styles.forgotLink}
            >
              Forgot Password?
            </span>
          </div>

          <div style={styles.remember}>
            <input type="checkbox" id="remember" />
            <label htmlFor="remember" style={styles.rememberLabel}>
              Remember Me
            </label>
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div style={styles.signupText}>
          Don’t have an account?{" "}
          <span onClick={() => navigate("/auth/register")} style={styles.link}>
            Sign up
          </span>
        </div>
      </div>

      {/* Modal for error/success */}
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
                fontSize: "1.1rem",
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
   🎨 STYLES (mobile-first responsive design)
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
    maxWidth: "400px",
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
  heading: { fontWeight: "700", fontSize: "1.3rem" },
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
  forgotLink: {
    display: "block",
    textAlign: "right",
    marginTop: "0.4rem",
    color: "#3b82f6",
    cursor: "pointer",
    fontSize: "0.85rem",
  },
  remember: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "1.2rem",
  },
  rememberLabel: { fontSize: "0.9rem" },
  button: {
    width: "100%",
    backgroundColor: "#2563eb",
    color: "#fff",
    padding: "0.8rem",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "1rem",
    transition: "0.2s",
  },
  signupText: {
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
    animation: "fadeIn 0.2s ease",
  },
};
