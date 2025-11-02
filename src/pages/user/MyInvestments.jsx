// src/pages/user/MyInvestments.jsx
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

/**
 * MyInvestments.jsx
 * - Shows a multi-line chart where each line represents a shop's performance over time.
 * - Attempts to use per-investment `performance` or `history` arrays if available:
 *    [{ date: '2025-10-01', value: 1200 }, ...]
 * - If not available, synthesizes a small series from createdAt, initialAmount, currentValue.
 *
 * Notes:
 * - Backend endpoint: GET /api/investments (expects { investments: [...] } OR array directly)
 * - Auth: token read from localStorage.token -> Authorization: Bearer <token>
 * - Install: recharts (already used elsewhere in your project)
 */

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
  // accept Date or ISO string
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

/** Build a consistent array of { date, value } points for an investment */
function buildSeriesForInvestment(inv) {
  // Preferred shape: inv.performance or inv.history -> array of { date, value }
  const pref = inv.performance || inv.history || inv.performanceHistory;
  if (Array.isArray(pref) && pref.length > 0) {
    // Normalize dates and values
    return (
      pref
        .map((p) => ({
          date: formatShortDate(p.date || p.timestamp || p.day),
          value: Number(p.value ?? p.amount ?? p.balance ?? 0),
        }))
        // remove invalid
        .filter((p) => !Number.isNaN(p.value))
    );
  }

  // If backend gave timeseries inside `metrics` or `series`:
  if (Array.isArray(inv.series) && inv.series.length > 0) {
    return inv.series
      .map((p) => ({
        date: formatShortDate(p.date),
        value: Number(p.value ?? 0),
      }))
      .filter((p) => !Number.isNaN(p.value));
  }

  // Fallback: try create a tiny synthetic series using createdAt, initialAmount, currentValue
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
    // three points: start, mid, now
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

  // Last resort: create a last-30-days small simulated trend from inv.profit or inv.currentValue
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

/** Merge multiple series into a single array where each item has date + values per shop key
 *  returns { data: [{ date:'Oct 1', shopA: 100, shopB: 120 }], keys: [shopA, shopB], meta: [{key, color, name}] }
 */
function mergeSeries(seriesByKey) {
  // seriesByKey: { key: [{date, value}, ...], ... }
  const dateSet = new Map(); // date -> index
  const allDates = [];

  // collect unique dates in chronological order as they appear
  for (const arr of Object.values(seriesByKey)) {
    for (const p of arr) {
      const key = p.date;
      if (!dateSet.has(key)) {
        dateSet.set(key, true);
        allDates.push(key);
      }
    }
  }

  // sort allDates by parsed date (we used short format -> fallback to current ordering)
  allDates.sort((a, b) => {
    const da = new Date(a);
    const db = new Date(b);
    return da - db;
  });

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
  const [error, setError] = useState("");
  const [hiddenKeys, setHiddenKeys] = useState({}); // legend toggle
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
        // support both { investments: [...] } and direct array
        const invs = Array.isArray(res.data)
          ? res.data
          : res.data.investments ?? res.data.data ?? [];
        if (mounted) setInvestments(invs);
      } catch (err) {
        console.error("Error loading investments:", err);
        setError(
          "Failed to load investments. Please login again or try later."
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (token) load();
    else {
      setError("Not authenticated");
      setLoading(false);
    }
    return () => {
      mounted = false;
    };
  }, [API_BASE, token]);

  // Build per-shop series
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
      // ensure series is sorted by date
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

  if (loading)
    return (
      <div style={styles.loading}>
        <p>Loading investments...</p>
      </div>
    );

  if (error)
    return (
      <div style={styles.error}>
        <p>{error}</p>
      </div>
    );

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>My Investments — Performance by Shop</h1>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Invested</div>
          <div style={styles.statValue}>₦{totalInvested.toLocaleString()}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Current Value</div>
          <div style={styles.statValue}>₦{totalCurrent.toLocaleString()}</div>
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
              onClick={(e) => {
                // toggle visibility
                setHiddenKeys((prev) => ({
                  ...prev,
                  [e.dataKey]: !prev[e.dataKey],
                }));
              }}
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
            onClick={() => setHiddenKeys((p) => ({ ...p, [m.key]: !p[m.key] }))}
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
    </div>
  );
}

/* ---------------- styles ---------------- */
const styles = {
  page: {
    color: "#e2e8f0",
    fontFamily: "Inter, sans-serif",
    padding: "1rem",
  },
  title: { fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.6rem" },
  statsRow: {
    display: "flex",
    gap: "0.8rem",
    marginBottom: "0.8rem",
    flexWrap: "wrap",
  },
  statCard: {
    background: "#0b1220",
    border: "1px solid #1f2937",
    padding: "0.6rem 0.9rem",
    borderRadius: 10,
    minWidth: 160,
  },
  statLabel: { color: "#94a3b8", fontSize: "0.85rem" },
  statValue: {
    fontSize: "1.2rem",
    fontWeight: 800,
    marginTop: "0.25rem",
    color: "#38bdf8",
  },
  chartCard: {
    background: "#0b1220",
    borderRadius: 12,
    border: "1px solid #1f2937",
    padding: "0.75rem",
    marginTop: "0.6rem",
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
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  loading: { color: "#e2e8f0", padding: "2rem", textAlign: "center" },
  error: { color: "#ef4444", padding: "2rem", textAlign: "center" },
};
