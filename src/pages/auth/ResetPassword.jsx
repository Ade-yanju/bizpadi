import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const API_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000";

function scorePassword(pw = "") {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}

export default function ResetPassword() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const token = sp.get("token") || "";

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState("info");

  const pwScore = scorePassword(pw);
  const reqsOk = pw.length >= 8;
  const matchOk = pw && pw2 && pw === pw2;
  const canSubmit = !!token && reqsOk && matchOk && !busy;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: pw }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Reset failed");

      setMsgType("success");
      setMsg("✅ Password updated. Redirecting to login...");
      setTimeout(() => nav("/auth/login"), 1200);
    } catch (err) {
      setMsgType("error");
      setMsg(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const s = {
    page: {
      background: "#0b1020",
      minHeight: "100svh",
      display: "grid",
      placeItems: "center",
      color: "#e2e8f0",
    },
    box: {
      width: "min(100%,500px)",
      background: "rgba(15,23,42,0.8)",
      borderRadius: 16,
      padding: 24,
      border: "1px solid #1f2937",
    },
    h2: { fontSize: 20, color: "#fff", fontWeight: 800 },
    sub: { color: "#94a3b8", fontSize: 13, marginBottom: 10 },
    label: { color: "#94a3b8", fontSize: 12, display: "block", marginTop: 12 },
    input: {
      width: "100%",
      height: 46,
      borderRadius: 12,
      border: "1px solid #334155",
      background: "#0f172a",
      color: "#e2e8f0",
      padding: "0 12px",
      fontSize: 14,
      outline: "none",
    },
    btn: {
      width: "100%",
      height: 48,
      borderRadius: 12,
      border: "none",
      background: "#2563eb",
      color: "#fff",
      fontWeight: 800,
      marginTop: 16,
      cursor: "pointer",
    },
    alert: {
      marginTop: 10,
      padding: "10px 12px",
      borderRadius: 10,
      fontSize: 13,
      background:
        msgType === "success"
          ? "rgba(16,185,129,0.1)"
          : msgType === "error"
          ? "rgba(239,68,68,0.1)"
          : "rgba(148,163,184,0.08)",
      color:
        msgType === "success"
          ? "#34d399"
          : msgType === "error"
          ? "#f87171"
          : "#cbd5e1",
      border: "1px solid #1f2937",
    },
  };

  return (
    <div style={s.page}>
      <form onSubmit={handleSubmit} style={s.box}>
        <h2 style={s.h2}>Set a new password</h2>
        <p style={s.sub}>Choose a strong password you haven’t used before.</p>

        {!token && (
          <div style={s.alert}>
            Invalid reset link.{" "}
            <Link to="/auth/forgot-password" style={{ color: "#3b82f6" }}>
              Request a new one
            </Link>
          </div>
        )}

        <label style={s.label}>New Password</label>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          style={s.input}
          required
        />
        <div
          style={{
            marginTop: 6,
            height: 8,
            background: "#1e293b",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(pwScore / 4) * 100}%`,
              background: [
                "#ef4444",
                "#f59e0b",
                "#eab308",
                "#22c55e",
                "#16a34a",
              ][pwScore],
            }}
          ></div>
        </div>

        <label style={s.label}>Confirm Password</label>
        <input
          type="password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          style={s.input}
          required
        />

        <button disabled={!canSubmit} style={s.btn}>
          {busy ? "Updating..." : "Update Password"}
        </button>

        {msg && <div style={s.alert}>{msg}</div>}

        <div style={{ marginTop: 10, fontSize: 13 }}>
          <Link to="/auth/login" style={{ color: "#3b82f6" }}>
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}
