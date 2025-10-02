import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000"; // 27017 is Mongo (DB), not an HTTP API port

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
  const [msg, setMsg] = useState(null); // text to show in alert area
  const [msgType, setMsgType] = useState("info"); // "info" | "success" | "error"
  const [retryAfter, setRetryAfter] = useState(0);

  // countdown for Retry-After (429)
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
      const r = await withTimeout(
        fetch(`${API_URL}/api/auth/forgot`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
          signal: ctrl.signal,
        }),
        15000,
        ctrl.signal
      );

      if (r.status === 429) {
        const ra = Number(r.headers.get("Retry-After") || "30");
        setRetryAfter(ra);
        setMsgType("error");
        setMsg(`Too many attempts. Try again in ${ra}s.`);
        return;
      }

      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(d?.message || "Request failed");
      }

      setMsgType("success");
      setMsg("✅ If that email exists, a reset link has been sent.");
    } catch (err) {
      setMsgType("error");
      setMsg(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  // ---------- Styles (responsive + overflow-safe)
  const s = {
    page: {
      background: "#0b1020",
      minHeight: "100svh",
      padding: "clamp(12px, 4vw, 24px)",
      display: "grid",
      placeItems: "center",
      color: "#e2e8f0",
    },
    box: {
      width: "min(100%, 480px)",
      maxWidth: 480,
      margin: "auto",
      padding: "clamp(16px, 4vw, 24px)",
      background: "rgba(15,23,42,0.75)",
      border: "1px solid #1f2937",
      borderRadius: 16,
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      backdropFilter: "blur(6px)",
      overflow: "hidden",
    },
    h2: {
      margin: 0,
      marginBottom: 4,
      color: "#fff",
      fontSize: "clamp(18px, 3.2vw, 22px)",
      fontWeight: 800,
    },
    sub: {
      marginTop: 0,
      color: "#94a3b8",
      fontSize: "clamp(12px, 2.6vw, 13px)",
    },
    label: {
      fontSize: "clamp(11px, 2.6vw, 12px)",
      color: "#94a3b8",
      marginTop: 12,
      display: "block",
    },
    inputWrap: { position: "relative", marginTop: 6 },
    input: {
      width: "100%",
      minWidth: 0,
      height: 46,
      borderRadius: 12,
      border: `1px solid ${emailError ? "#ef4444" : "#334155"}`,
      background: "#0f172a",
      color: "#e2e8f0",
      padding: "0 12px",
      fontSize: "clamp(13px, 2.8vw, 14px)",
      outline: "none",
      boxSizing: "border-box",
    },
    hint: { fontSize: 12, color: "#94a3b8", marginTop: 6 },
    error: { marginTop: 6, color: "#f87171", fontSize: 13 },
    success: { marginTop: 10, color: "#34d399", fontSize: 13 },
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
      fontSize: "clamp(14px, 2.8vw, 16px)",
      boxSizing: "border-box",
      touchAction: "manipulation",
    },
    row: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      flexWrap: "wrap",
      marginTop: 12,
    },
    link: { color: "#cbd5e1", fontSize: 13, textDecoration: "underline" },
    alert: {
      marginTop: 10,
      padding: "10px 12px",
      borderRadius: 10,
      fontSize: 13,
      lineHeight: 1.35,
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
  };

  return (
    <div style={s.page}>
      <form
        onSubmit={submit}
        style={s.box}
        noValidate
        aria-busy={busy ? "true" : "false"}
      >
        <h2 style={s.h2}>Reset password</h2>
        <p style={s.sub}>
          Enter your email and we’ll send a reset link if we find an account.
        </p>

        <label htmlFor="email" style={s.label}>
          Email
        </label>
        <div style={s.inputWrap}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            style={s.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "email-err" : undefined}
            autoFocus
            required
          />
        </div>
        {emailError ? (
          <div id="email-err" style={s.error}>
            {emailError}
          </div>
        ) : (
          <div style={s.hint}>We’ll never share your email.</div>
        )}

        <button disabled={!canSubmit} style={s.btn}>
          {retryAfter > 0
            ? `Try again in ${retryAfter}s`
            : busy
            ? "Sending…"
            : "Send reset link"}
        </button>

        {msg && (
          <div role="status" aria-live="polite" style={s.alert}>
            {msg}
          </div>
        )}

        <div style={s.row}>
          <Link to="/auth/login" style={s.link}>
            Back to login
          </Link>
          <Link to="/auth/register" style={s.link}>
            Create a new account
          </Link>
        </div>
      </form>
    </div>
  );
}
