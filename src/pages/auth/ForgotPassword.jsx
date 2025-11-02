import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000"; // backend URL

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function withTimeout(promise, ms, signal) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Request timed out")), ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
    if (signal)
      signal.addEventListener("abort", () => reject(new Error("Aborted")));
  });
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState("info");
  const [retryAfter, setRetryAfter] = useState(0);

  useEffect(() => {
    if (retryAfter > 0) {
      const id = setInterval(
        () => setRetryAfter((s) => Math.max(0, s - 1)),
        1000
      );
      return () => clearInterval(id);
    }
  }, [retryAfter]);

  const emailError = useMemo(() => {
    if (!touched) return "";
    if (!email.trim()) return "Email is required";
    if (!isValidEmail(email.trim())) return "Enter a valid email";
    return "";
  }, [email, touched]);

  const canSubmit = useMemo(
    () => !busy && retryAfter === 0 && isValidEmail(email.trim()),
    [busy, retryAfter, email]
  );

  async function submit(e) {
    e.preventDefault();
    setTouched(true);
    setMsg(null);
    if (emailError) return;

    const ctrl = new AbortController();
    setBusy(true);

    try {
      const res = await withTimeout(
        fetch(`${API_URL}/api/auth/forgot`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
          signal: ctrl.signal,
        }),
        15000,
        ctrl.signal
      );

      if (res.status === 429) {
        const ra = Number(res.headers.get("Retry-After") || "30");
        setRetryAfter(ra);
        setMsgType("error");
        setMsg(`Too many attempts. Try again in ${ra}s.`);
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Request failed");

      setMsgType("success");
      setMsg("✅ If that email exists, a reset link has been sent.");
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
      padding: "clamp(12px,4vw,24px)",
    },
    box: {
      width: "min(100%,480px)",
      background: "rgba(15,23,42,0.75)",
      border: "1px solid #1f2937",
      borderRadius: 16,
      padding: "clamp(16px,4vw,24px)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    },
    h2: { color: "#fff", fontSize: "1.3rem", fontWeight: 800 },
    sub: { color: "#94a3b8", fontSize: "0.9rem", marginBottom: 8 },
    label: { fontSize: 12, color: "#94a3b8", marginTop: 12, display: "block" },
    input: {
      width: "100%",
      height: 46,
      borderRadius: 12,
      border: `1px solid ${emailError ? "#ef4444" : "#334155"}`,
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
      cursor: "pointer",
      marginTop: 14,
      opacity: busy ? 0.85 : 1,
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
      border: `1px solid ${
        msgType === "success"
          ? "rgba(16,185,129,0.45)"
          : msgType === "error"
          ? "rgba(239,68,68,0.45)"
          : "rgba(148,163,184,0.35)"
      }`,
      color:
        msgType === "success"
          ? "#34d399"
          : msgType === "error"
          ? "#f87171"
          : "#cbd5e1",
    },
    row: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: 12,
      fontSize: 13,
    },
  };

  return (
    <div style={s.page}>
      <form onSubmit={submit} style={s.box} noValidate>
        <h2 style={s.h2}>Reset password</h2>
        <p style={s.sub}>
          Enter your email and we’ll send a reset link if we find an account.
        </p>

        <label htmlFor="email" style={s.label}>
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          style={s.input}
          required
        />
        {emailError && (
          <div style={{ color: "#f87171", fontSize: 13, marginTop: 6 }}>
            {emailError}
          </div>
        )}

        <button disabled={!canSubmit} style={s.btn}>
          {retryAfter > 0
            ? `Try again in ${retryAfter}s`
            : busy
            ? "Sending…"
            : "Send reset link"}
        </button>

        {msg && <div style={s.alert}>{msg}</div>}

        <div style={s.row}>
          <Link to="/auth/login" style={{ textDecoration: "underline" }}>
            Back to login
          </Link>
          <Link to="/auth/register" style={{ textDecoration: "underline" }}>
            Create account
          </Link>
        </div>
      </form>
    </div>
  );
}
