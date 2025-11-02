// client/src/pages/admin/AdminSettings.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Maintenance from "../Maintenance";

export default function AdminSettings() {
  const [admin, setAdmin] = useState({ name: "", email: "", phone: "" });
  const [password, setPassword] = useState("");
  const [system, setSystem] = useState({
    maintenance_mode: false,
    maintenance_message: "",
    maintenance_start: "",
    maintenance_end: "",
    min_withdrawal_amount: 1000,
    max_withdrawal_amount: 100000,
    profit_percentage: 10,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [showMaintenancePreview, setShowMaintenancePreview] = useState(false);

  const API_BASE =
    import.meta.env?.VITE_API_BASE_URL ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000";
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetch = async () => {
      try {
        const [profRes, sysRes] = await Promise.all([
          axios.get(`${API_BASE}/api/admin/settings/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE}/api/admin/settings/system`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (profRes?.data) {
          setAdmin({
            name: profRes.data.name || "",
            email: profRes.data.email || "",
            phone: profRes.data.phone || "",
          });
        }

        // sysRes expected array of setting docs
        if (Array.isArray(sysRes?.data) && sysRes.data.length) {
          const map = {};
          sysRes.data.forEach((s) => {
            map[s.key] = s.value;
          });

          setSystem((prev) => ({ ...prev, ...map }));
        }
      } catch (err) {
        console.error("Error loading admin settings:", err);
        setNotice("Failed to load settings (check server).");
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [API_BASE, token]);

  const updateSystemKey = (key, value) =>
    setSystem((s) => ({ ...s, [key]: value }));

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setNotice("");

    try {
      // update profile
      await axios.put(
        `${API_BASE}/api/admin/settings/profile`,
        { ...admin, password },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // build system payload as array
      const sysPayload = Object.keys(system).map((k) => ({
        key: k,
        value: system[k],
      }));

      await axios.put(`${API_BASE}/api/admin/settings/system`, sysPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPassword("");
      setNotice("✅ Settings saved");
    } catch (err) {
      console.error("Save error:", err);
      setNotice("❌ Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <div style={{ padding: 20, color: "#e2e8f0" }}>Loading…</div>;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Admin Settings</h1>
      <p style={styles.subtle}>
        Edit your profile and system-wide configuration
      </p>

      {notice && <div style={styles.notice}>{notice}</div>}

      <form onSubmit={handleSave} style={styles.grid}>
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Admin Profile</h3>

          <div style={styles.formGroup}>
            <label style={styles.label}>Full name</label>
            <input
              style={styles.input}
              value={admin.name}
              onChange={(e) => setAdmin({ ...admin, name: e.target.value })}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email address</label>
            <input
              style={styles.input}
              value={admin.email}
              type="email"
              onChange={(e) => setAdmin({ ...admin, email: e.target.value })}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Phone number</label>
            <input
              style={styles.input}
              value={admin.phone}
              onChange={(e) => setAdmin({ ...admin, phone: e.target.value })}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Change password</label>
            <input
              style={styles.input}
              value={password}
              type="password"
              placeholder="Leave blank to keep current"
              onChange={(e) => setPassword(e.target.value)}
            />
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
              Password must be at least 6 characters to update.
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>System & Maintenance</h3>

          <div style={styles.formGroupRow}>
            <div>
              <label style={styles.label}>Maintenance mode</label>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input
                  id="maintenance_toggle"
                  type="checkbox"
                  checked={!!system.maintenance_mode}
                  onChange={(e) =>
                    updateSystemKey("maintenance_mode", e.target.checked)
                  }
                />
                <label
                  htmlFor="maintenance_toggle"
                  style={{ color: "#cbd5e1" }}
                >
                  On / Off
                </label>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <button
                type="button"
                style={styles.secondaryBtn}
                onClick={() => setShowMaintenancePreview((s) => !s)}
              >
                Preview maintenance page
              </button>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Maintenance message</label>
            <input
              style={styles.input}
              value={system.maintenance_message || ""}
              onChange={(e) =>
                updateSystemKey("maintenance_message", e.target.value)
              }
              placeholder="Short message to show on maintenance page"
            />
          </div>

          <div style={styles.formGroupRow}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Start (UTC)</label>
              <input
                style={styles.input}
                type="datetime-local"
                value={system.maintenance_start || ""}
                onChange={(e) =>
                  updateSystemKey("maintenance_start", e.target.value)
                }
              />
            </div>

            <div style={{ flex: 1 }}>
              <label style={styles.label}>End (UTC)</label>
              <input
                style={styles.input}
                type="datetime-local"
                value={system.maintenance_end || ""}
                onChange={(e) =>
                  updateSystemKey("maintenance_end", e.target.value)
                }
              />
            </div>
          </div>

          <hr style={{ borderColor: "#1f2937", margin: "12px 0" }} />

          <div style={styles.formGroupRow}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Min withdrawal amount</label>
              <input
                style={styles.input}
                type="number"
                value={system.min_withdrawal_amount || 0}
                onChange={(e) =>
                  updateSystemKey(
                    "min_withdrawal_amount",
                    Number(e.target.value)
                  )
                }
              />
            </div>

            <div style={{ flex: 1 }}>
              <label style={styles.label}>Max withdrawal amount</label>
              <input
                style={styles.input}
                type="number"
                value={system.max_withdrawal_amount || 0}
                onChange={(e) =>
                  updateSystemKey(
                    "max_withdrawal_amount",
                    Number(e.target.value)
                  )
                }
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Default profit percentage</label>
            <input
              style={styles.input}
              type="number"
              value={system.profit_percentage || 0}
              onChange={(e) =>
                updateSystemKey("profit_percentage", Number(e.target.value))
              }
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit" disabled={saving} style={styles.primaryBtn}>
            {saving ? "Saving..." : "Save all changes"}
          </button>

          <button
            type="button"
            style={styles.ghostBtn}
            onClick={() => {
              setNotice("");
              // reload settings
              window.location.reload();
            }}
          >
            Reset
          </button>
        </div>
      </form>

      {showMaintenancePreview && (
        <div style={{ marginTop: 20 }}>
          <Maintenance
            message={system.maintenance_message}
            start={system.maintenance_start}
            end={system.maintenance_end}
          />
        </div>
      )}
    </div>
  );
}

/* ---------- styles ---------- */
const styles = {
  page: { color: "#e2e8f0", fontFamily: "Inter, sans-serif", padding: 16 },
  title: { fontSize: 20, fontWeight: 800 },
  subtle: { color: "#94a3b8", marginBottom: 12 },
  grid: { display: "grid", gap: 12, maxWidth: 1000 },
  card: {
    background: "#0b1220",
    padding: 12,
    borderRadius: 10,
    border: "1px solid #1f2937",
  },
  sectionTitle: { fontWeight: 700, marginBottom: 8 },
  formGroup: { marginBottom: 10 },
  formGroupRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  label: { color: "#94a3b8", display: "block", marginBottom: 6 },
  input: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #334155",
    background: "#071025",
    color: "#e2e8f0",
  },
  primaryBtn: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 700,
  },
  secondaryBtn: {
    background: "#1f2937",
    color: "#e2e8f0",
    border: "none",
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
  },
  ghostBtn: {
    background: "transparent",
    color: "#cbd5e1",
    border: "1px solid #334155",
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
  },
  notice: {
    background: "#0b1220",
    border: "1px solid #334155",
    color: "#93c5fd",
    padding: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
};
