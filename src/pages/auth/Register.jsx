import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";

// ---- Env (CRA + Vite friendly)
const API_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000";

// ---- Helpers
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
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
function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
// Lightweight strength heuristic (0–4)
function scorePassword(pw = "") {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}
const STRENGTH_LABELS = ["Very weak", "Weak", "Okay", "Strong", "Very strong"];

// Token storage: session by default; local if remember=true
const tokenStore = {
  set(token, user, remember) {
    const store = remember ? localStorage : sessionStorage;
    store.setItem("token", token);
    store.setItem("user", JSON.stringify(user));
    (remember ? sessionStorage : localStorage).removeItem("token");
    (remember ? sessionStorage : localStorage).removeItem("user");
  },
};

export default function Register() {
  const nav = useNavigate();

  // Form state
  const [f, setF] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    country: "NG",
    referral: "",
    accept: false,
    marketing: true,
    remember: false,
  });

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [fieldErr, setFieldErr] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    accept: "",
    otp: "",
  });

  // Email availability
  const [emailCheck, setEmailCheck] = useState({
    checking: false,
    available: null,
  });

  // CapsLock/visibility
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const pwRef = useRef(null);

  // Rate limit
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

  // Email debounce checker
  useEffect(() => {
    let alive = true;
    let ctrl = new AbortController();

    async function run() {
      if (!isEmail(f.email)) {
        setEmailCheck({ checking: false, available: null });
        return;
      }
      setEmailCheck({ checking: true, available: null });
      await sleep(300); // debounce
      try {
        const r = await withTimeout(
          fetch(
            `${API_URL}/api/auth/email-available?email=${encodeURIComponent(
              f.email
            )}`,
            {
              method: "GET",
              signal: ctrl.signal,
            }
          ),
          8000,
          ctrl.signal
        );
        const d = await r.json().catch(() => ({}));
        if (!alive) return;
        setEmailCheck({ checking: false, available: !!d.available });
      } catch {
        if (!alive) return;
        setEmailCheck({ checking: false, available: null }); // unknown
      }
    }
    run();

    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [f.email]);

  // Derived
  const pwScore = scorePassword(f.password);
  const pwOk = f.password.length >= 8 && pwScore >= 2;
  const confirmOk = f.confirm && f.confirm === f.password;
  const canSubmit =
    !busy &&
    retryAfter === 0 &&
    f.name.trim().length >= 2 &&
    isEmail(f.email) &&
    pwOk &&
    confirmOk &&
    f.accept;

  // MFA/verification step (email OTP)
  const [needsVerify, setNeedsVerify] = useState(false);
  const [challengeId, setChallengeId] = useState(null);
  const [otp, setOtp] = useState("");

  // reCAPTCHA placeholder (gate submission)
  const [captchaOk, setCaptchaOk] = useState(true); // set to false if you wire real captcha

  const validate = useCallback(() => {
    const e = {
      name: "",
      email: "",
      password: "",
      confirm: "",
      accept: "",
      otp: "",
    };
    if (!f.name.trim()) e.name = "Name is required";
    if (!isEmail(f.email)) e.email = "Valid email is required";
    if (!pwOk)
      e.password = "Use at least 8 chars incl. case mix, number or symbol";
    if (!confirmOk) e.confirm = "Passwords do not match";
    if (!f.accept) e.accept = "You must accept the Terms to continue";
    setFieldErr(e);
    return !e.name && !e.email && !e.password && !e.confirm && !e.accept;
  }, [f, pwOk, confirmOk]);

  function onPwKey(e) {
    if (e.getModifierState && typeof e.getModifierState === "function") {
      setCapsLockOn(!!e.getModifierState("CapsLock"));
    }
  }

  async function submit(e) {
    e.preventDefault();
    setMessage(null);
    setFieldErr((x) => ({ ...x, otp: "" }));

    if (!captchaOk) {
      setMessage("Please complete the captcha.");
      return;
    }
    if (!validate()) return;

    const ctrl = new AbortController();
    setBusy(true);
    try {
      const payload = {
        name: f.name.trim(),
        email: f.email.trim(),
        password: f.password,
        country: f.country,
        referral: f.referral || undefined,
        marketing: !!f.marketing,
        client: {
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
          ua: navigator.userAgent,
        },
      };

      const r = await withTimeout(
        fetch(`${API_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
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
        if (d?.errors) setFieldErr((prev) => ({ ...prev, ...d.errors }));
        throw new Error(d?.message || "Registration failed");
      }

      if (d?.emailVerificationRequired && d?.challengeId) {
        setNeedsVerify(true);
        setChallengeId(d.challengeId);
        setMessage(
          "We sent a 6-digit code to your email. Enter it below to verify your account."
        );
        return;
      }

      tokenStore.set(d.token, d.user, f.remember);
      nav("/dashboard", { replace: true });
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
        fetch(`${API_URL}/api/auth/verify-email`, {
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
        throw new Error(d?.message || "Verification failed");
      }

      tokenStore.set(d.token, d.user, f.remember);
      nav("/dashboard", { replace: true });
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
      padding: "clamp(12px, 4vw, 24px)",
      color: "#e2e8f0",
      display: "grid",
      placeItems: "center",
    },
    box: {
      width: "min(100%, 560px)",
      maxWidth: 560,
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
      marginTop: 0,
      color: "#fff",
      fontSize: "clamp(18px, 3.2vw, 22px)",
      fontWeight: 700,
    },
    grid: { display: "grid", gap: 12 },
    label: { fontSize: "clamp(11px, 2.6vw, 12px)", color: "#94a3b8" },
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
    select: {
      width: "100%",
      minWidth: 0,
      height: 46,
      borderRadius: 12,
      border: "1px solid #334155",
      background: "#0f172a",
      color: "#e2e8f0",
      padding: "0 12px",
      fontSize: "clamp(13px, 2.8vw, 14px)",
      outline: "none",
      boxSizing: "border-box",
    },
    small: { fontSize: 12, color: "#94a3b8" },
    hint: { fontSize: 12, color: "#94a3b8", marginTop: 6 },
    error: { marginTop: 6, color: "#f87171", fontSize: 13 },
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
    btn: {
      width: "100%",
      height: 48,
      borderRadius: 12,
      border: "none",
      background: "#16a34a",
      color: "#fff",
      fontWeight: 800,
      cursor: "pointer",
      marginTop: 8,
      opacity: busy ? 0.8 : 1,
      fontSize: "clamp(14px, 2.8vw, 16px)",
      boxSizing: "border-box",
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
      fontSize: "clamp(14px, 2.8vw, 15px)",
      boxSizing: "border-box",
      touchAction: "manipulation",
    },
    row: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap", // ✅ small screens stay tidy
    },
    meterWrap: {
      marginTop: 6,
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
      marginTop: 12,
      color: "#64748b",
      fontSize: 12,
    },
    hr: { height: 1, background: "#1f2937" },
  };

  // tiny CSS for two-column groups on wider screens
  const responsiveCSS = `
    .rg-2 { display: grid; gap: 12px; }
    @media (min-width: 640px) { .rg-2 { grid-template-columns: 1fr 1fr; } }
  `;

  return (
    <div style={s.page}>
      <style>{responsiveCSS}</style>
      <form
        onSubmit={submit}
        style={s.box}
        noValidate
        aria-busy={busy ? "true" : "false"}
      >
        <h2 style={s.h2}>Create account</h2>

        {/* Name + Email row (stacks on small, 2-col on ≥640px) */}
        <div className="rg-2">
          <div>
            <label htmlFor="name" style={s.label}>
              Full name
            </label>
            <div style={s.inputWrap}>
              <input
                id="name"
                name="name"
                style={s.input}
                autoCapitalize="words"
                value={f.name}
                onChange={(e) => setF({ ...f, name: e.target.value })}
                placeholder="Ada Lovelace"
                aria-invalid={!!fieldErr.name}
                aria-describedby={fieldErr.name ? "name-err" : undefined}
                required
              />
            </div>
            {fieldErr.name ? (
              <div id="name-err" style={s.error}>
                {fieldErr.name}
              </div>
            ) : (
              <div style={s.hint}>Enter your legal name (for KYC).</div>
            )}
          </div>

          <div>
            <label htmlFor="email" style={s.label}>
              Email
            </label>
            <div style={s.inputWrap}>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                style={s.input}
                value={f.email}
                onChange={(e) => setF({ ...f, email: e.target.value })}
                placeholder="you@example.com"
                aria-invalid={!!fieldErr.email}
                aria-describedby={fieldErr.email ? "email-err" : undefined}
                required
              />
            </div>
            {fieldErr.email && (
              <div id="email-err" style={s.error}>
                {fieldErr.email}
              </div>
            )}
            {!fieldErr.email && (
              <div style={s.hint}>
                {emailCheck.checking && "Checking availability…"}
                {!emailCheck.checking &&
                  emailCheck.available === true &&
                  "Email is available ✓"}
                {!emailCheck.checking &&
                  emailCheck.available === false &&
                  "Email is already in use"}
              </div>
            )}
          </div>
        </div>

        <div style={{ ...s.grid, marginTop: 12 }}>
          {/* Country */}
          <div>
            <label htmlFor="country" style={s.label}>
              Country
            </label>
            <select
              id="country"
              name="country"
              style={s.select}
              value={f.country}
              onChange={(e) => setF({ ...f, country: e.target.value })}
            >
              <option value="NG">Nigeria</option>
              <option value="GH">Ghana</option>
              <option value="KE">Kenya</option>
              <option value="ZA">South Africa</option>
              <option value="US">United States</option>
            </select>
            <div style={s.hint}>Used for KYC rules and payout rails.</div>
          </div>

          {/* Password + Confirm (2-col on wide) */}
          <div className="rg-2">
            <div>
              <label htmlFor="password" style={s.label}>
                Password{" "}
                {capsLockOn && <span style={s.badge}>Caps Lock on</span>}
              </label>
              <div style={s.inputWrap}>
                <input
                  id="password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  style={s.input}
                  value={f.password}
                  onChange={(e) => setF({ ...f, password: e.target.value })}
                  onKeyUp={onPwKey}
                  onKeyDown={onPwKey}
                  placeholder="••••••••"
                  aria-invalid={!!fieldErr.password}
                  aria-describedby={fieldErr.password ? "pw-err" : undefined}
                  minLength={8}
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
              <div style={s.hint}>
                {STRENGTH_LABELS[pwScore]} • Use 8+ chars with upper/lower,
                number, symbol.
              </div>
              {fieldErr.password && (
                <div id="pw-err" style={s.error}>
                  {fieldErr.password}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirm" style={s.label}>
                Confirm password
              </label>
              <div style={s.inputWrap}>
                <input
                  id="confirm"
                  name="confirm"
                  type={showPw2 ? "text" : "password"}
                  autoComplete="new-password"
                  style={s.input}
                  value={f.confirm}
                  onChange={(e) => setF({ ...f, confirm: e.target.value })}
                  placeholder="Repeat password"
                  aria-invalid={!!fieldErr.confirm}
                  aria-describedby={
                    fieldErr.confirm ? "confirm-err" : undefined
                  }
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
              {fieldErr.confirm && (
                <div id="confirm-err" style={s.error}>
                  {fieldErr.confirm}
                </div>
              )}
            </div>
          </div>

          {/* Referral (optional) */}
          <div>
            <label htmlFor="ref" style={s.label}>
              Referral code (optional)
            </label>
            <input
              id="ref"
              name="ref"
              style={s.input}
              value={f.referral}
              onChange={(e) => setF({ ...f, referral: e.target.value })}
              placeholder="REF-123ABC"
            />
            <div style={s.hint}>
              We’ll credit any referral bonuses after verification.
            </div>
          </div>

          {/* Remember + Marketing */}
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
                checked={f.remember}
                onChange={(e) => setF({ ...f, remember: e.target.checked })}
              />
              <span style={s.small}>Remember this device</span>
            </label>
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
                checked={f.marketing}
                onChange={(e) => setF({ ...f, marketing: e.target.checked })}
              />
              <span style={s.small}>Send product updates</span>
            </label>
          </div>

          {/* Terms */}
          <div>
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
                checked={f.accept}
                onChange={(e) => setF({ ...f, accept: e.target.checked })}
                aria-invalid={!!fieldErr.accept}
              />
              <span style={s.small}>
                I agree to the{" "}
                <a href="/legal/terms" target="_blank" rel="noreferrer">
                  Terms
                </a>{" "}
                &{" "}
                <a href="/legal/privacy" target="_blank" rel="noreferrer">
                  Privacy Policy
                </a>
                .
              </span>
            </label>
            {fieldErr.accept && <div style={s.error}>{fieldErr.accept}</div>}
          </div>

          {/* reCAPTCHA placeholder */}
          <div>
            <button
              type="button"
              style={s.btnGhost}
              onClick={() => setCaptchaOk(true)} // replace with real captcha callback
            >
              I’m not a robot (placeholder)
            </button>
            <div style={s.hint}>
              Wire reCAPTCHA/Turnstile here for abuse prevention.
            </div>
          </div>

          <button disabled={!canSubmit} style={s.btn}>
            {retryAfter > 0
              ? `Try again in ${retryAfter}s`
              : busy
              ? "Creating…"
              : "Create account"}
          </button>

          {message && (
            <div role="alert" style={{ ...s.error, marginTop: 8 }}>
              {message}
            </div>
          )}

          <div style={{ ...s.divider, marginTop: 10 }}>
            <div style={s.hr} />
            <span>or</span>
            <div style={s.hr} />
          </div>

          <button
            type="button"
            style={s.btnGhost}
            aria-label="Continue with Google"
            onClick={() => alert("TODO: Connect Google OAuth")}
          >
            Continue with Google
          </button>

          <div style={{ marginTop: 10, fontSize: 14, color: "#cbd5e1" }}>
            Already have an account?{" "}
            <Link to="/auth/login" style={{ textDecoration: "underline" }}>
              Login
            </Link>
          </div>
        </div>

        {/* Email verification step (OTP) */}
        {needsVerify && (
          <div
            style={{
              marginTop: 18,
              paddingTop: 16,
              borderTop: "1px dashed #334155",
            }}
          >
            <h3 style={{ margin: "0 0 8px 0", fontSize: 16 }}>
              Verify your email
            </h3>
            <p style={s.small}>
              Enter the 6-digit code sent to <strong>{f.email}</strong>.
            </p>

            <label htmlFor="otp" style={s.label}>
              Verification code
            </label>
            <div style={s.inputWrap}>
              <input
                id="otp"
                name="otp"
                style={s.input}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123 456"
                aria-invalid={!!fieldErr.otp}
                aria-describedby={fieldErr.otp ? "otp-err" : undefined}
              />
            </div>
            {fieldErr.otp && (
              <div id="otp-err" style={s.error}>
                {fieldErr.otp}
              </div>
            )}

            <div style={s.row}>
              <button
                onClick={verifyOtp}
                disabled={busy || otp.trim().length < 6}
                style={{ ...s.btn, marginTop: 12 }}
              >
                {busy ? "Verifying…" : "Verify & continue"}
              </button>
              <button
                type="button"
                style={{ ...s.btnGhost, marginTop: 12 }}
                onClick={async () => {
                  setMessage(null);
                  try {
                    const r = await withTimeout(
                      fetch(`${API_URL}/api/auth/resend-email-code`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ challengeId }),
                      }),
                      12000
                    );
                    if (!r.ok) throw new Error("Failed to resend code");
                    setMessage("A new code has been sent.");
                  } catch (err) {
                    setMessage(err.message);
                  }
                }}
              >
                Resend code
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
