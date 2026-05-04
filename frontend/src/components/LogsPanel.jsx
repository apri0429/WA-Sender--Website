import { Box, Typography } from "@mui/material";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";

const FONT = "'Plus Jakarta Sans', 'Inter', sans-serif";
const FONT_MONO = "'JetBrains Mono', 'Fira Code', monospace";
const VISIBLE_LOG_COUNT = 6;

const LOG_CONFIG = {
  success: {
    color: "#233971",
    bg: "#eaeff7",
    bgCard: "#f0f4fb",
    border: "#b3c1d8",
    Icon: CheckCircleRoundedIcon,
    label: "Success",
  },
  error: {
    color: "#dc2626",
    bg: "#fef2f2",
    bgCard: "#fff8f8",
    border: "#fecaca",
    Icon: ErrorRoundedIcon,
    label: "Error",
  },
  info: {
    color: "#2e5bba",
    bg: "#eef2f9",
    bgCard: "#f4f7fb",
    border: "#c5d0e6",
    Icon: InfoRoundedIcon,
    label: "Info",
  },
  warning: {
    color: "#d97706",
    bg: "#fffbeb",
    bgCard: "#fffdf5",
    border: "#fde68a",
    Icon: WarningRoundedIcon,
    label: "Warning",
  },
};

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function normalizeLogs(logs = []) {
  if (!Array.isArray(logs)) return [];
  return logs.map((log, i) => ({
    id: log?.id || `${log?.time || "t"}-${log?.type || "info"}-${i}`,
    type: log?.type || "info",
    message: log?.message || "",
    time: log?.time || "",
  }));
}

export default function LogsPanel({ logs = [] }) {
  const normalized = normalizeLogs(logs);
  const errorCount = normalized.filter((l) => l.type === "error").length;
  const successCount = normalized.filter((l) => l.type === "success").length;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {normalized.length > 0 && (
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
          {[
            { label: `${normalized.length} log`, color: "#2e5bba", bg: "#eef2f9", border: "#c5d0e6" },
            { label: `${successCount} ok`, color: "#233971", bg: "#eaeff7", border: "#b3c1d8" },
            {
              label: `${errorCount} error`,
              color: errorCount ? "#dc2626" : "#94a3b8",
              bg: errorCount ? "#fef2f2" : "#f8fafc",
              border: errorCount ? "#fecaca" : "#e2e8f0",
            },
          ].map((s, i) => (
            <Box
              key={i}
              sx={{
                px: 1,
                py: 0.35,
                borderRadius: "6px",
                bgcolor: s.bg,
                border: `1px solid ${s.border}`,
              }}
            >
              <Typography
                sx={{
                  fontFamily: FONT_MONO,
                  fontSize: 11,
                  fontWeight: 600,
                  color: s.color,
                }}
              >
                {s.label}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {normalized.length === 0 ? (
        <Box
          sx={{
            py: 5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
            borderRadius: "12px",
            border: "1px dashed #b3c1d8",
            bgcolor: "#f4f7fb",
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "12px",
              background: "linear-gradient(135deg, #eaeff7 0%, #dce5f5 100%)",
              border: "1px solid #b3c1d8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              "& svg": { fontSize: 24, color: "#233971", opacity: 0.5 },
            }}
          >
            <ChecklistRoundedIcon />
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography
              sx={{
                fontFamily: FONT,
                fontSize: 13.5,
                fontWeight: 600,
                color: "#1c2f5c",
              }}
            >
              Belum ada aktivitas
            </Typography>
            <Typography
              sx={{
                fontFamily: FONT,
                fontSize: 12,
                color: "#7a8fbb",
                mt: 0.25,
              }}
            >
              Log akan muncul secara realtime
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            maxHeight: 54 * VISIBLE_LOG_COUNT + (VISIBLE_LOG_COUNT - 1) * 6,
            overflowY: "auto",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
            gap: 0.75,
            pr: 0.5,
            "&::-webkit-scrollbar": { width: 3 },
            "&::-webkit-scrollbar-track": { background: "transparent" },
            "&::-webkit-scrollbar-thumb": {
              background: "#b3c1d8",
              borderRadius: 999,
            },
            "&::-webkit-scrollbar-thumb:hover": { background: "#233971" },
          }}
        >
          {normalized.map((log) => {
            const s = LOG_CONFIG[log.type] || LOG_CONFIG.info;
            const { Icon } = s;
            return (
              <Box
                key={log.id}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.25,
                  px: 1.25,
                  py: 1,
                  borderRadius: "10px",
                  bgcolor: s.bgCard,
                  border: `1px solid ${s.border}`,
                  borderLeft: `3px solid ${s.color}`,
                  transition: "all 0.15s",
                  "&:hover": {
                    bgcolor: s.bg,
                    boxShadow: "0 2px 10px rgba(35,57,113,0.09)",
                  },
                }}
              >
                <Box
                  sx={{
                    mt: 0.2,
                    flexShrink: 0,
                    color: s.color,
                    "& svg": { fontSize: 15 },
                  }}
                >
                  <Icon />
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                      mb: 0.2,
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: FONT_MONO,
                        fontSize: 10,
                        fontWeight: 700,
                        color: s.color,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {s.label}
                    </Typography>
                    {log.time && (
                      <Typography
                        sx={{
                          fontFamily: FONT_MONO,
                          fontSize: 10.5,
                          color: "#7a8fbb",
                          flexShrink: 0,
                        }}
                      >
                        {formatTime(log.time)}
                      </Typography>
                    )}
                  </Box>
                  <Typography
                    sx={{
                      fontFamily: FONT,
                      fontSize: 12.5,
                      color: "#1c2f5c",
                      fontWeight: 500,
                      lineHeight: 1.5,
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {log.message}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {normalized.length > VISIBLE_LOG_COUNT && (
        <Typography
          sx={{
            textAlign: "center",
            fontFamily: FONT,
            fontSize: 11.5,
            color: "#7a8fbb",
            pt: 0.75,
            borderTop: "1px dashed #b3c1d8",
          }}
        >
          Scroll · {normalized.length - VISIBLE_LOG_COUNT} log lainnya
        </Typography>
      )}
    </Box>
  );
}
