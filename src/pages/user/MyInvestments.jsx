import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

const COLORS = [
  "#38bdf8",
  "#22c55e",
  "#f97316",
  "#eab308",
  "#a78bfa",
  "#fb7185",
  "#60a5fa",
  "#34d399",
  "#f59e0b",
];

function safeParseDate(d) {
  try {
    return new Date(d);
  } catch {
    return new Date();
  }
}

function formatShortDate(date) {
  const d = safeParseDate(date);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function buildSeriesForInvestment(inv) {
  const pref = inv.performance || inv.history || inv.performanceHistory;
  if (Array.isArray(pref) && pref.length > 0) {
    return pref
      .map((p) => ({
        date: formatShortDate(p.date || p.timestamp || p.day),
        value: Number(p.value ?? p.amount ?? p.balance ?? 0),
      }))
      .filter((p) => !Number.isNaN(p.value));
  }

  if (Array.isArray(inv.series) && inv.series.length > 0) {
    return inv.series
      .map((p) => ({
        date: formatShortDate(p.date),
        value: Number(p.value ?? 0),
      }))
      .filter((p) => !Number.isNaN(p.value));
  }

  const created = inv.createdAt || inv.startDate || inv.openedAt;
  const initial = Number(
    inv.initialAmount ??
      inv.amountInvested ??
      inv.shares * (inv.unitPrice ?? 1) ??
      0
  );
  const current = Number(
    inv.currentValue ?? inv.current_amount ?? inv.amount ?? 0
  );

  if (created && (initial || current)) {
    const d0 = formatShortDate(created);
    const today = formatShortDate(new Date());
    const midValue =
      initial && current ? (initial + current) / 2 : current || initial;
    return [
      { date: d0, value: initial },
      {
        date: formatShortDate(
          new Date(safeParseDate(created).getTime() + 7 * 24 * 60 * 60 * 1000)
        ),
        value: midValue,
      },
      { date: today, value: current || midValue },
    ].filter((p) => !Number.isNaN(p.value));
  }

  const last = Number(inv.currentValue ?? inv.balance ?? inv.profit ?? 0);
  const arr = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: formatShortDate(d),
      value: Math.max(0, Math.round((last / 7) * (i + 1) * 100) / 100),
    };
  });
  return arr;
}

function mergeSeries(seriesByKey) {
  const dateSet = new Map();
  const allDates = [];
  for (const arr of Object.values(seriesByKey)) {
    for (const p of arr) {
      const key = p.date;
      if (!dateSet.has(key)) {
        dateSet.set(key, true);
        allDates.push(key);
      }
    }
  }
  allDates.sort((a, b) => new Date(a) - new Date(b));
  const data = allDates.map((date) => {
    const item = { date };
    for (const key of Object.keys(seriesByKey)) {
      const point = seriesByKey[key].find((p) => p.date === date);
      item[key] = point ? Number(point.value) : null;
    }
    return item;
  });
  return data;
}

export default function MyInvestments() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ show: false, type: "", message: "" });
  const [hiddenKeys, setHiddenKeys] = useState({});

  const API_BASE =
    (typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_API_BASE_URL) ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000";
  const token = localStorage.getItem("token");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/investments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const invs = Array.isArray(res.data)
          ? res.data
          : res.data.investments ?? res.data.data ?? [];
        if (mounted) setInvestments(invs);
      } catch (err) {
        console.error("Error loading investments:", err);
        setModal({
          show: true,
          type: "error",
          message:
            "Failed to load investments. Please check your connection or login again.",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (token) load();
    else {
      setModal({ show: true, type: "error", message: "Not authenticated." });
      setLoading(false);
    }
    return () => {
      mounted = false;
    };
  }, [API_BASE, token]);

  const { mergedData, keys, meta } = useMemo(() => {
    const seriesByKey = {};
    const meta = [];

    (investments || []).forEach((inv, idx) => {
      const key = `${inv.shopName ?? inv.name ?? `Investment ${idx + 1}`} (${
        inv._id ?? inv.id ?? idx
      })`;
      const color = COLORS[idx % COLORS.length];
      meta.push({
        key,
        color,
        name: inv.shopName ?? inv.name ?? `Investment ${idx + 1}`,
        raw: inv,
      });
      const series = buildSeriesForInvestment(inv);
      series.sort((a, b) => new Date(a.date) - new Date(b.date));
      seriesByKey[key] = series;
    });

    const mergedData = mergeSeries(seriesByKey);
    const keys = Object.keys(seriesByKey);
    return { mergedData, keys, meta };
  }, [investments]);

  const totalInvested = useMemo(
    () =>
      investments.reduce(
        (s, i) => s + Number(i.initialAmount ?? i.amountInvested ?? 0),
        0
      ),
    [investments]
  );

  const totalCurrent = useMemo(
    () =>
      investments.reduce(
        (s, i) => s + Number(i.currentValue ?? i.balance ?? 0),
        0
      ),
    [investments]
  );

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>My Investments — Performance by Shop</h1>

      {loading ? (
        <div style={styles.center}>Loading investments...</div>
      ) : (
        <>
          <div style={styles.statsRow}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Total Invested</div>
              <div style={styles.statValue}>
                ₦{totalInvested.toLocaleString()}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Current Value</div>
              <div style={styles.statValue}>
                ₦{totalCurrent.toLocaleString()}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Active Investments</div>
              <div style={styles.statValue}>{investments.length}</div>
            </div>
          </div>

          <div style={styles.chartCard}>
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={mergedData}>
                <CartesianGrid stroke="#1f2937" strokeDasharray="4 4" />
                <XAxis dataKey="date" tick={{ fill: "#cbd5e1" }} />
                <YAxis tick={{ fill: "#cbd5e1" }} />
                <Tooltip
                  contentStyle={styles.tooltip}
                  formatter={(value) =>
                    value === null ? "—" : `₦${Number(value).toLocaleString()}`
                  }
                />
                <Legend
                  onClick={(e) =>
                    setHiddenKeys((prev) => ({
                      ...prev,
                      [e.dataKey]: !prev[e.dataKey],
                    }))
                  }
                  wrapperStyle={{ color: "#cbd5e1" }}
                />
                {meta.map((m) => (
                  <Line
                    key={m.key}
                    type="monotone"
                    dataKey={m.key}
                    stroke={m.color}
                    strokeWidth={2.2}
                    dot={false}
                    hide={Boolean(hiddenKeys[m.key])}
                    isAnimationActive={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={styles.legendWrap}>
            {meta.map((m) => (
              <button
                key={m.key}
                onClick={() =>
                  setHiddenKeys((p) => ({ ...p, [m.key]: !p[m.key] }))
                }
                style={{
                  ...styles.legendItem,
                  opacity: hiddenKeys[m.key] ? 0.5 : 1,
                  borderColor: m.color,
                }}
              >
                <span style={{ ...styles.legendDot, background: m.color }} />
                {m.name}
              </button>
            ))}
          </div>
        </>
      )}

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
              }}
            >
              {modal.type === "error" ? "Error" : "Notice"}
            </h3>
            <p style={{ color: "#e2e8f0", marginBottom: "1rem" }}>
              {modal.message}
            </p>
            <button
              onClick={() => setModal({ show: false, type: "", message: "" })}
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

/* ---------------- Styles ---------------- */
const styles = {
  page: {
    color: "#e2e8f0",
    fontFamily: "Inter, sans-serif",
    padding: "1rem",
    width: "100%",
    maxWidth: 1000,
    margin: "0 auto",
  },
  title: {
    fontSize: "1.4rem",
    fontWeight: 800,
    marginBottom: "0.8rem",
    textAlign: "center",
  },
  statsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.8rem",
    justifyContent: "center",
    marginBottom: "0.8rem",
  },
  statCard: {
    background: "#0b1220",
    border: "1px solid #1f2937",
    padding: "0.8rem 1rem",
    borderRadius: 10,
    flex: "1 1 150px",
    minWidth: 150,
    textAlign: "center",
  },
  statLabel: { color: "#94a3b8", fontSize: "0.85rem" },
  statValue: {
    fontSize: "1.2rem",
    fontWeight: 800,
    marginTop: "0.25rem",
    color: "#38bdf8",
    overflowWrap: "anywhere",
  },
  chartCard: {
    background: "#0b1220",
    borderRadius: 12,
    border: "1px solid #1f2937",
    padding: "0.75rem",
    marginTop: "0.6rem",
    width: "100%",
  },
  tooltip: {
    backgroundColor: "#0b1220",
    border: "1px solid #334155",
    color: "#e2e8f0",
  },
  legendWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.45rem",
    marginTop: "0.6rem",
    justifyContent: "center",
  },
  legendItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.35rem 0.6rem",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "#111827",
    color: "#e2e8f0",
    cursor: "pointer",
    fontWeight: 600,
  },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  center: { color: "#94a3b8", padding: "2rem", textAlign: "center" },
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
    padding: "1rem",
  },
  modal: {
    backgroundColor: "#1e293b",
    borderRadius: "10px",
    padding: "1.5rem",
    width: "100%",
    maxWidth: "400px",
    textAlign: "center",
    border: "2px solid rgba(255,255,255,0.1)",
    boxShadow: "0 0 25px rgba(0,0,0,0.4)",
  },
};
