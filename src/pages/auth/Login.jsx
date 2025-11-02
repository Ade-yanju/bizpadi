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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Works in CRA & Vite
  const API_BASE =
    (typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_API_BASE_URL) ||
    process.env.VITE_API_BASE_URL ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Firebase login
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const token = await userCredential.user.getIdToken();

      // Send token to backend
      const res = await axios.get(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const user = res.data.user;
      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);

      if (user.role === "admin") {
        navigate("/admin/home");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Invalid credentials or unauthorized user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#0f172a",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Inter, sans-serif",
        color: "#fff",
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "#1e293b",
          borderRadius: "12px",
          padding: "2rem",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 0 20px rgba(0,0,0,0.3)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              backgroundColor: "#0d9488",
              width: "35px",
              height: "35px",
              borderRadius: "6px",
              margin: "0 auto 0.8rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
            }}
          >
            V
          </div>
          <h2 style={{ fontWeight: "700" }}>Welcome Back</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "1rem" }}>
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

          <div style={{ marginBottom: "1rem", position: "relative" }}>
            <label style={styles.label}>Password</label>
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

            <span
              onClick={() => navigate("/auth/forgot-password")}
              style={{
                color: "#3b82f6",
                textDecoration: "none",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              Forgot Password?
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "1.2rem",
            }}
          >
            <input type="checkbox" style={{ marginRight: "0.5rem" }} />
            <label style={{ fontSize: "0.9rem" }}>Remember Me</label>
          </div>

          {error && (
            <p
              style={{
                color: "#ef4444",
                fontSize: "0.9rem",
                marginBottom: "1rem",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              backgroundColor: "#1d4ed8",
              color: "#fff",
              padding: "0.8rem",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
              opacity: loading ? 0.7 : 1,
            }}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div
          style={{
            textAlign: "center",
            marginTop: "1rem",
            fontSize: "0.9rem",
            color: "#94a3b8",
          }}
        >
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/auth/register")}
            style={{
              color: "#3b82f6",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            Sign up
          </span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  label: { display: "block", marginBottom: "0.3rem", fontSize: "0.9rem" },
  input: {
    width: "93%",
    padding: "0.75rem",
    borderRadius: "8px",
    border: "1px solid #334155",
    backgroundColor: "#0f172a",
    color: "#fff",
    outline: "none",
    fontSize: "0.9rem",
  },
  eyeIcon: {
    position: "absolute",
    right: "0.75rem",
    top: "2.3rem",
    cursor: "pointer",
    fontSize: "1.1rem",
  },
};
