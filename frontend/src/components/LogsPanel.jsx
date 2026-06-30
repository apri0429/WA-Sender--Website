import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";

const F = "'Manrope', 'Segoe UI', sans-serif";
const FM = "'IBM Plex Mono', monospace";

const TYPE_DOT = {
  success: "#22c55e",
  error:   "#ef4444",
  warning: "#f59e0b",
  info:    "#60a5fa",
};

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function normalizeLogs(logs = []) {
  if (!Array.isArray(logs)) return [];
  return logs.map((log, i) => ({
    id:      log?.id || `${log?.time || "t"}-${i}`,
    type:    log?.type || "info",
    message: log?.message || "",
    time:    log?.time || "",
  }));
}

export default function LogsPanel({ logs = [] }) {
  const normalized = normalizeLogs(logs);

  if (normalized.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 16px", gap: 10, borderRadius: 12, border: "1px dashed #d1d9e6", background: "#f8fafc" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#eaeff7", border: "1px solid #b3c1d8", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ChecklistRoundedIcon style={{ fontSize: 22, color: "#233971", opacity: 0.45 }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: "#163a6b", margin: "0 0 2px" }}>Belum ada aktivitas</p>
          <p style={{ fontFamily: F, fontSize: 12, color: "#9ca3af", margin: 0 }}>Log akan muncul secara realtime</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {normalized.map((log, i) => (
        <div
          key={log.id}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "7px 10px",
            background: (log._seq ?? i) % 2 === 0 ? "#ffffff" : "#f8fafc",
            borderBottom: i < normalized.length - 1 ? "1px solid #f0f2f5" : "none",
          }}
        >
          <div style={{ flexShrink: 0, marginTop: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: TYPE_DOT[log.type] || TYPE_DOT.info }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: F, fontSize: 12.5, color: "#374151", fontWeight: 500, margin: 0, lineHeight: 1.5, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
              {log.message}
            </p>
          </div>
          {log.time && (
            <span style={{ fontFamily: FM, fontSize: 10, color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>
              {formatTime(log.time)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
