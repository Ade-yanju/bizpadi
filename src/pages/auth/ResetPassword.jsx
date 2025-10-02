import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

// ---- Env (CRA + Vite friendly)
const API_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000";

// ---- Helpers
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
function scorePassword(pw = "") {
  // 0–4 heuristic
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}
const STRENGTH_LABELS = ["Very weak", "Weak", "Okay", "Strong", "Very strong"];

function generateStrongPassword(len = 16) {
  const lowers = "abcdefghijkmnopqrstuvwxyz"; // no l
  const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no O
  const nums = "23456789"; // no 0/1
  const syms = "!@#$%^&*()-_=+[]{}<>?";
  const all = lowers + uppers + nums + syms;
  function pick(set) {
    return set[Math.floor(Math.random() * set.length)];
  }
  let out = [pick(lowers), pick(uppers), pick(nums), pick(syms)];
  for (let i = out.length; i < len; i++) out.push(pick(all));
  // simple shuffle
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.join("");
}

export default function ResetPassword() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const token = sp.get("token") || ""; // expecting /auth/reset?token=...

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [caps, setCaps] = useState(false);
  const pwRef = useRef(null);

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // text
  const [msgType, setMsgType] = useState("info"); // info | success | error
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

  const pwScore = scorePassword(pw);
  const reqs = useMemo(
    () => ({
      min: pw.length >= 8,
      upper: /[A-Z]/.test(pw),
      lower: /[a-z]/.test(pw),
      num: /\d/.test(pw),
      sym: /[^A-Za-z0-9]/.test(pw),
    }),
    [pw]
  );
  const reqsOk = Object.values(reqs).every(Boolean);
  const matchOk = pw2.length > 0 && pw === pw2;
  const canSubmit = !!token && !busy && retryAfter === 0 && reqsOk && matchOk;

  function onPwKey(e) {
    if (e.getModifierState && typeof e.getModifierState === "function") {
      setCaps(!!e.getModifierState("CapsLock"));
    }
  }

  async function submit(e) {
    e.preventDefault();
    setMessage(null);

    if (!token) {
      setMsgType("error");
      setMessage("Reset link is missing or invalid. Request a new one.");
      return;
    }
    if (!canSubmit) return;

    setBusy(true);
    const ctrl = new AbortController();
    try {
      const r = await withTimeout(
        fetch(`${API_URL}/api/auth/reset`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ token, password: pw }),
          signal: ctrl.signal,
        }),
        15000,
        ctrl.signal
      );

      if (r.status === 429) {
        const ra = Number(r.headers.get("Retry-After") || "30");
        setRetryAfter(ra);
        setMsgType("error");
        setMessage(`Too many attempts. Try again in ${ra}s.`);
        return;
      }

      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.message || "Reset failed");

      setMsgType("success");
      setMessage("✅ Password updated. You can now sign in.");
      // Optional: auto-redirect after a short pause
      setTimeout(() => nav("/auth/login", { replace: true }), 1200);
    } catch (err) {
      setMsgType("error");
      setMessage(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function suggest() {
    const s = generateStrongPassword(16);
    setPw(s);
    setPw2(s);
    try {
      await navigator.clipboard.writeText(s);
      setMsgType("info");
      setMessage("Suggested password copied to clipboard.");
    } catch {
      setMsgType("info");
      setMessage("Suggested password generated.");
    }
    pwRef.current?.focus();
  }

  // ---- Styles (responsive + overflow-safe)
  const s = {
    page: {
      background: "#0b1020",
      minHeight: "100svh",
      padding: "clamp(12px, 4vw, 24px)",
      color: "#e2e8f0",
      display: "grid",
      placeItems: "center",
    },
    box: {
      width: "min(100%, 520px)",
      maxWidth: 520,
      margin: "auto",
      padding: "clamp(16px, 4vw, 24px)",
      background:
        "linear-gradient(180deg, rgba(17,24,39,0.85), rgba(10,15,30,0.85))",
      border: "1px solid #1f2937",
      borderRadius: 16,
      boxShadow: "0 12px 36px rgba(0,0,0,0.45)",
      backdropFilter: "blur(8px)",
      overflow: "hidden",
    },
    h2: {
      margin: 0,
      color: "#fff",
      fontSize: "clamp(18px, 3.2vw, 22px)",
      fontWeight: 800,
    },
    sub: {
      marginTop: 6,
      color: "#94a3b8",
      fontSize: "clamp(12px, 2.6vw, 13px)",
    },

    label: {
      fontSize: "clamp(11px, 2.6vw, 12px)",
      color: "#94a3b8",
      marginTop: 14,
      display: "block",
    },
    inputWrap: { position: "relative", marginTop: 6 },

    input: {
      width: "100%",
      minWidth: 0,
      height: 46,
      borderRadius: 12,
      border: "1px solid #334155",
      background: "#0f172a",
      color: "#e2e8f0",
      padding: "0 44px 0 12px",
      fontSize: "clamp(13px, 2.8vw, 14px)",
      outline: "none",
      boxSizing: "border-box",
    },
    eyeBtn: {
      position: "absolute",
      right: 8,
      top: 8,
      height: 30,
      width: 30,
      borderRadius: 8,
      border: "1px solid #334155",
      background: "#0b1222",
      color: "#cbd5e1",
      cursor: "pointer",
      boxSizing: "border-box",
    },

    meterWrap: {
      marginTop: 8,
      height: 8,
      background: "#111827",
      borderRadius: 999,
      overflow: "hidden",
    },
    meterFill: (n) => ({
      height: "100%",
      width: `${(n / 4) * 100}%`,
      background: ["#ef4444", "#f59e0b", "#eab308", "#22c55e", "#16a34a"][n],
      transition: "width 160ms linear",
    }),
    checklist: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      marginTop: 10,
    },
    checkItem: (ok) => ({
      fontSize: 12,
      color: ok ? "#34d399" : "#94a3b8",
      display: "flex",
      alignItems: "center",
      gap: 6,
      whiteSpace: "nowrap",
    }),

    btnRow: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 },
    btn: {
      flex: "1 1 180px",
      height: 48,
      borderRadius: 12,
      border: "none",
      background: "#2563eb",
      color: "#fff",
      fontWeight: 800,
      cursor: "pointer",
      fontSize: "clamp(14px, 2.8vw, 16px)",
      boxSizing: "border-box",
      touchAction: "manipulation",
      opacity: busy ? 0.85 : 1,
    },
    btnGhost: {
      flex: "1 1 160px",
      height: 48,
      borderRadius: 12,
      border: "1px solid #334155",
      background: "#0b1222",
      color: "#e2e8f0",
      cursor: "pointer",
      fontSize: "clamp(14px, 2.8vw, 15px)",
      boxSizing: "border-box",
      touchAction: "manipulation",
    },

    alert: {
      marginTop: 12,
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
    smallRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      flexWrap: "wrap",
      marginTop: 10,
      fontSize: 13,
      color: "#cbd5e1",
    },
    badge: {
      display: "inline-block",
      fontSize: 11,
      color: "#eab308",
      background: "rgba(234,179,8,0.1)",
      border: "1px solid rgba(234,179,8,0.35)",
      padding: "2px 8px",
      borderRadius: 999,
      marginLeft: 8,
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
        <h2 style={s.h2}>Set a new password</h2>
        <p style={s.sub}>
          Choose a strong password you haven’t used before.
          {caps && <span style={s.badge}>Caps Lock on</span>}
        </p>

        {!token && (
          <div
            style={{
              ...s.alert,
              borderColor: "rgba(239,68,68,0.45)",
              color: "#f87171",
            }}
          >
            Missing or invalid reset token.{" "}
            <Link
              to="/auth/forgot-password"
              style={{ textDecoration: "underline", color: "#fca5a5" }}
            >
              Request a new link
            </Link>
            .
          </div>
        )}

        {/* New password */}
        <label htmlFor="pw" style={s.label}>
          New password
        </label>
        <div style={s.inputWrap}>
          <input
            id="pw"
            ref={pwRef}
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            style={s.input}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyUp={onPwKey}
            onKeyDown={onPwKey}
            placeholder="••••••••••••"
            required
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            style={s.eyeBtn}
            aria-label={showPw ? "Hide password" : "Show password"}
            title={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? "🙈" : "👁️"}
          </button>
        </div>
        <div style={s.meterWrap}>
          <div style={s.meterFill(pwScore)} />
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
          {STRENGTH_LABELS[pwScore]} • Minimum 8 characters. Recommended 12+
          with a mix of cases, numbers & symbols.
        </div>

        {/* Checklist */}
        <div style={s.checklist}>
          <div style={s.checkItem(reqs.lower)}>
            {reqs.lower ? "✓" : "•"} Lowercase
          </div>
          <div style={s.checkItem(reqs.upper)}>
            {reqs.upper ? "✓" : "•"} Uppercase
          </div>
          <div style={s.checkItem(reqs.num)}>{reqs.num ? "✓" : "•"} Number</div>
          <div style={s.checkItem(reqs.sym)}>{reqs.sym ? "✓" : "•"} Symbol</div>
        </div>

        {/* Confirm */}
        <label htmlFor="pw2" style={s.label}>
          Confirm new password
        </label>
        <div style={s.inputWrap}>
          <input
            id="pw2"
            type={showPw2 ? "text" : "password"}
            autoComplete="new-password"
            style={s.input}
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="Repeat password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPw2((v) => !v)}
            style={s.eyeBtn}
            aria-label={showPw2 ? "Hide password" : "Show password"}
            title={showPw2 ? "Hide password" : "Show password"}
          >
            {showPw2 ? "🙈" : "👁️"}
          </button>
        </div>
        {!matchOk && pw2.length > 0 && (
          <div style={{ marginTop: 6, color: "#f87171", fontSize: 13 }}>
            Passwords do not match
          </div>
        )}

        <div style={s.btnRow}>
          <button type="submit" disabled={!canSubmit} style={s.btn}>
            {retryAfter > 0
              ? `Try again in ${retryAfter}s`
              : busy
              ? "Updating…"
              : "Update password"}
          </button>
          <button type="button" style={s.btnGhost} onClick={suggest}>
            Suggest strong password
          </button>
        </div>

        {message && (
          <div role="status" aria-live="polite" style={s.alert}>
            {message}
          </div>
        )}

        <div style={s.smallRow}>
          <Link to="/auth/login" style={{ textDecoration: "underline" }}>
            Back to login
          </Link>
          <Link
            to="/auth/forgot-password"
            style={{ textDecoration: "underline" }}
          >
            Request a new link
          </Link>
        </div>
      </form>
    </div>
  );
}
