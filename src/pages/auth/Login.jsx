import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

// ---- Env (CRA + Vite friendly)
const API_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000";

// ---- Small helpers
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
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

// ---- Token storage (session by default; local if Remember me)
const tokenStore = {
  set(token, user, remember) {
    const store = remember ? localStorage : sessionStorage;
    store.setItem("token", token);
    store.setItem("user", JSON.stringify(user));
    (remember ? sessionStorage : localStorage).removeItem("token");
    (remember ? sessionStorage : localStorage).removeItem("user");
  },
};

// ---- Main component
export default function Login() {
  const nav = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state && location.state.from) || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [fieldErr, setFieldErr] = useState({
    email: "",
    password: "",
    otp: "",
  });

  // MFA flow
  const [mfaRequired, setMfaRequired] = useState(false);
  const [challengeId, setChallengeId] = useState(null);
  const [otp, setOtp] = useState("");

  const [capsLockOn, setCapsLockOn] = useState(false);
  const pwRef = useRef(null);

  // Rate limit handling (429)
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

  const validate = useCallback(() => {
    const fe = { email: "", password: "", otp: "" };
    if (!email) fe.email = "Email is required";
    else if (!isValidEmail(email)) fe.email = "Enter a valid email";
    if (!password) fe.password = "Password is required";
    setFieldErr(fe);
    return !fe.email && !fe.password;
  }, [email, password]);

  const canSubmit = useMemo(() => {
    return (
      isValidEmail(email) && password.length >= 6 && retryAfter === 0 && !busy
    );
  }, [email, password, retryAfter, busy]);

  function onPwKey(e) {
    if (e.getModifierState && typeof e.getModifierState === "function") {
      setCapsLockOn(!!e.getModifierState("CapsLock"));
    }
  }

  async function submit(e) {
    e.preventDefault();
    setMessage(null);
    setFieldErr({ email: "", password: "", otp: "" });

    if (!validate()) return;

    const ctrl = new AbortController();
    setBusy(true);
    try {
      const reqBody = {
        email: email.trim(),
        password,
        client: {
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
          ua: navigator.userAgent,
        },
      };

      const r = await withTimeout(
        fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(document.querySelector('meta[name="csrf-token"]')
              ? {
                  "X-CSRF-Token": document.querySelector(
                    'meta[name="csrf-token"]'
                  ).content,
                }
              : {}),
          },
          credentials: "include",
          body: JSON.stringify(reqBody),
          signal: ctrl.signal,
        }),
        15000,
        ctrl.signal
      );

      if (r.status === 429) {
        const ra = Number(r.headers.get("Retry-After") || "30");
        setRetryAfter(ra);
        throw new Error(`Too many attempts. Try again in ${ra}s`);
      }

      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (d?.errors) {
          setFieldErr((prev) => ({ ...prev, ...d.errors }));
        }
        throw new Error(d?.message || "Login failed");
      }

      if (d?.mfaRequired && d?.challengeId) {
        setMfaRequired(true);
        setChallengeId(d.challengeId);
        setMessage(
          "Enter the 6-digit code from your authenticator app or SMS."
        );
        return;
      }

      tokenStore.set(d.token, d.user, remember);
      nav(redirectTo, { replace: true });
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(e) {
    e.preventDefault();
    setMessage(null);
    setFieldErr((fe) => ({ ...fe, otp: "" }));
    if (!otp || otp.trim().length < 6) {
      setFieldErr((fe) => ({ ...fe, otp: "Enter the 6-digit code" }));
      return;
    }

    setBusy(true);
    try {
      const r = await withTimeout(
        fetch(`${API_URL}/api/auth/mfa/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ challengeId, otp: otp.trim() }),
        }),
        15000
      );

      if (r.status === 429) {
        const ra = Number(r.headers.get("Retry-After") || "30");
        setRetryAfter(ra);
        throw new Error(`Too many attempts. Try again in ${ra}s`);
      }

      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (d?.errors?.otp) setFieldErr((fe) => ({ ...fe, otp: d.errors.otp }));
        throw new Error(d?.message || "MFA verification failed");
      }

      tokenStore.set(d.token, d.user, remember);
      nav(redirectTo, { replace: true });
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  // ---- Styles (responsive + overflow-safe)
  const s = {
    page: {
      background: "#0b1020",
      minHeight: "100svh",
      padding: "clamp(16px, 5vw, 24px) clamp(12px, 4vw, 16px)",
      color: "#e2e8f0",
      display: "grid",
      placeItems: "center",
    },
    box: {
      width: "min(100%, 480px)",
      maxWidth: 480,
      margin: "min(6vh, 32px) auto",
      padding: "clamp(16px, 4.5vw, 24px)",
      background: "rgba(15,23,42,0.75)",
      border: "1px solid #1f2937",
      borderRadius: 16,
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      backdropFilter: "blur(6px)",
      overflow: "hidden", // last-resort guard
    },
    h2: {
      marginTop: 0,
      color: "#fff",
      fontSize: "clamp(18px, 3.2vw, 22px)",
      fontWeight: 700,
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
      border: "1px solid #334155",
      background: "#0f172a",
      color: "#e2e8f0",
      padding: "0 44px 0 12px",
      fontSize: "clamp(13px, 2.8vw, 14px)",
      outline: "none",
      boxSizing: "border-box", // ✅ prevents overflow
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
    hint: { fontSize: 12, color: "#94a3b8", marginTop: 6 },
    error: { marginTop: 6, color: "#f87171", fontSize: 13 },
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
      opacity: busy ? 0.8 : 1,
      boxSizing: "border-box", // ✅ safe sizing
      fontSize: "clamp(14px, 2.8vw, 16px)",
      touchAction: "manipulation",
    },
    btnGhost: {
      width: "100%",
      height: 44,
      borderRadius: 12,
      border: "1px solid #334155",
      background: "#0b1222",
      color: "#e2e8f0",
      cursor: "pointer",
      marginTop: 8,
      boxSizing: "border-box",
      fontSize: "clamp(14px, 2.8vw, 15px)",
      touchAction: "manipulation",
    },
    row: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 10,
      flexWrap: "wrap", // ✅ keeps small screens tidy
      rowGap: 8,
      columnGap: 8,
    },
    linkRow: { marginTop: 12, fontSize: 14, color: "#cbd5e1" },
    small: { fontSize: 12, color: "#94a3b8" },
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
    divider: {
      display: "grid",
      gridTemplateColumns: "1fr auto 1fr",
      alignItems: "center",
      gap: 12,
      marginTop: 16,
      color: "#64748b",
      fontSize: 12,
    },
    hr: { height: 1, background: "#1f2937" },
  };

  return (
    <div style={s.page}>
      <form
        onSubmit={submit}
        style={s.box}
        aria-busy={busy ? "true" : "false"}
        noValidate
      >
        <h2 style={s.h2}>Welcome back</h2>

        <label htmlFor="email" style={s.label}>
          Email address
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
            aria-invalid={!!fieldErr.email}
            aria-describedby={fieldErr.email ? "email-err" : undefined}
            required
          />
        </div>
        {fieldErr.email ? (
          <div id="email-err" style={s.error}>
            {fieldErr.email}
          </div>
        ) : (
          <div style={s.hint}>Use your registered email.</div>
        )}

        <label htmlFor="password" style={s.label}>
          Password {capsLockOn && <span style={s.badge}>Caps Lock on</span>}
        </label>
        <div style={s.inputWrap}>
          <input
            ref={pwRef}
            id="password"
            name="password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            style={s.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyUp={onPwKey}
            onKeyDown={onPwKey}
            aria-invalid={!!fieldErr.password}
            aria-describedby={fieldErr.password ? "pw-err" : undefined}
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
        {fieldErr.password ? (
          <div id="pw-err" style={s.error}>
            {fieldErr.password}
          </div>
        ) : (
          <div style={s.hint}>
            At least 6 characters. Avoid common passwords.
          </div>
        )}

        <div style={s.row}>
          <label
            style={{
              display: "inline-flex",
              gap: 8,
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              aria-label="Remember this device"
            />
            <span style={s.small}>Remember me</span>
          </label>
          <Link
            to="/auth/forgot-password"
            style={{ ...s.small, textDecoration: "underline" }}
          >
            Forgot password?
          </Link>
        </div>

        <button disabled={!canSubmit} style={s.btn}>
          {retryAfter > 0
            ? `Try again in ${retryAfter}s`
            : busy
            ? "Signing in…"
            : "Sign in"}
        </button>

        {message && (
          <div role="alert" style={{ ...s.error, marginTop: 10 }}>
            {message}
          </div>
        )}

        <div style={s.divider}>
          <div style={s.hr} />
          <span>or</span>
          <div style={s.hr} />
        </div>
        <button
          type="button"
          style={s.btnGhost}
          onClick={() => alert("TODO: Connect Google OAuth")}
          aria-label="Continue with Google"
        >
          Continue with Google
        </button>

        <div style={s.linkRow}>
          New here?{" "}
          <Link to="/auth/register" style={{ textDecoration: "underline" }}>
            Create account
          </Link>
        </div>

        {/* ----- MFA STEP (rendered only if required) ----- */}
        {mfaRequired && (
          <div
            style={{
              marginTop: 18,
              paddingTop: 16,
              borderTop: "1px dashed #334155",
            }}
          >
            <h3 style={{ margin: "0 0 8px 0", fontSize: 16 }}>
              Multi-Factor Authentication
            </h3>
            <p style={s.small}>
              We’ve sent a code or read it from your authenticator app.
            </p>

            <label htmlFor="otp" style={s.label}>
              6-digit code
            </label>
            <div style={s.inputWrap}>
              <input
                id="otp"
                name="otp"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="123 456"
                style={s.input}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                aria-invalid={!!fieldErr.otp}
                aria-describedby={fieldErr.otp ? "otp-err" : undefined}
              />
            </div>
            {fieldErr.otp && (
              <div id="otp-err" style={s.error}>
                {fieldErr.otp}
              </div>
            )}

            <button
              onClick={verifyOtp}
              disabled={busy || otp.trim().length < 6}
              style={{ ...s.btn, marginTop: 12 }}
            >
              {busy ? "Verifying…" : "Verify & continue"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
