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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE =
    (typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_API_BASE_URL) ||
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
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      // ✅ 1. Create user in Firebase
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await updateProfile(userCred.user, { displayName: name });

      // ✅ 2. Get fresh ID token
      const token = await userCred.user.getIdToken(true);

      // ✅ 3. Send user details to backend
      const { data } = await axios.post(
        `${API_BASE}/api/auth/register`,
        { name, email, contact },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // ✅ 4. Save locally
      localStorage.setItem("token", token);
      localStorage.setItem("role", data.role || "user");
      localStorage.setItem("user", JSON.stringify(data.user));

      // ✅ 5. Navigate to dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("Registration error:", err.response?.data || err.message);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Try logging in instead.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (err.code === "auth/weak-password") {
        setError("Your password is too weak.");
      } else {
        setError(
          err.response?.data?.message ||
            "Something went wrong. Please try again."
        );
      }
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
        color: "#fff",
        fontFamily: "Inter, sans-serif",
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "#1e293b",
          borderRadius: "12px",
          padding: "2rem",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 0 20px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ marginBottom: "0.3rem" }}>Create Your Account</h2>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
            Start your journey with us.
          </p>
        </div>

        <form onSubmit={handleRegister}>
          {/* Full Name */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          {/* Email */}
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

          {/* Contact */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={styles.label}>Contact Number</label>
            <input
              type="tel"
              placeholder="Enter your contact number"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          {/* Password */}
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
            {password && (
              <div
                style={{ fontSize: "0.8rem", color: strengthColor(strength) }}
              >
                {strength}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: "1rem", position: "relative" }}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ ...styles.input, paddingRight: "2.5rem" }}
              required
            />
            <span
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              {showConfirmPassword ? "🙈" : "👁️"}
            </span>
          </div>

          {/* Terms */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "1.2rem",
              fontSize: "0.9rem",
            }}
          >
            <input type="checkbox" style={{ marginRight: "0.5rem" }} required />
            <span>
              I agree to the{" "}
              <a href="#" style={{ color: "#3b82f6", textDecoration: "none" }}>
                Terms and Conditions
              </a>
            </span>
          </div>

          {/* Error */}
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

          {/* Submit */}
          <button
            type="submit"
            style={{
              width: "100%",
              backgroundColor: "#3b82f6",
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
            {loading ? "Creating..." : "Create Account"}
          </button>

          {/* Login Link */}
          <div
            style={{
              textAlign: "center",
              marginTop: "1rem",
              fontSize: "0.9rem",
              color: "#94a3b8",
            }}
          >
            Already have an account?{" "}
            <span
              onClick={() => navigate("/auth/login")}
              style={{
                color: "#3b82f6",
                textDecoration: "none",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Log In
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  label: { display: "block", marginBottom: "0.3rem", fontSize: "0.9rem" },
  input: {
    width: "90%",
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
