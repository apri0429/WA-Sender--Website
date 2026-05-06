import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  Alert,
  Box,
  Button,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Snackbar,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import UploadCard from "../components/UploadCard";
import CustomerPreview from "../components/CustomerPreview";
import LogsPanel from "../components/LogsPanel";
import api from "../services/api";
import socket from "../services/socket";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import WifiRoundedIcon from "@mui/icons-material/WifiRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import SignalCellularAltRoundedIcon from "@mui/icons-material/SignalCellularAltRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ViewListRoundedIcon from "@mui/icons-material/ViewListRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

// ─────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────
const FONT_SANS = "'Plus Jakarta Sans', 'Inter', sans-serif";
const FONT_MONO = "'JetBrains Mono', 'Fira Code', monospace";

const T = {
  brand: "#233971",
  brandLight: "#eaeff7",
  brandBorder: "#b3c1d8",
  brandDark: "#1c2f5c",

  blue: "#2e5bba",
  blueBg: "#eef2f9",
  blueBorder: "#c5d0e6",

  amber: "#d97706",
  amberBg: "#fffbeb",
  amberBorder: "#fde68a",

  red: "#dc2626",
  redBg: "#fef2f2",
  redBorder: "#fecaca",

  violet: "#7c3aed",
  violetBg: "#f5f3ff",
  violetBorder: "#ddd6fe",

  sky: "#3a6fd8",
  skyBg: "#eef2f9",
  skyBorder: "#c5d0e6",

  teal: "#2a4585",
  tealBg: "#eaeff7",
  tealBorder: "#b3c1d8",

  rose: "#e11d48",
  roseBg: "#fff1f2",
  roseBorder: "#fecdd3",

  ink: "#0c111b",
  ink2: "#1c2433",
  text: "#374151",
  muted: "#6b7280",
  subtle: "#9ca3af",
  ghost: "#d1d5db",
  line: "#e5e7eb",
  surface: "#f9fafb",
  canvas: "#f3f4f6",
  white: "#ffffff",
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function normalizeProgress(progress) {
  const current = Number(progress?.current) || 0;
  const total = Number(progress?.total) || 0;
  if (total <= 0) return { current: 0, total: 0 };
  return { current: Math.min(current, total), total };
}

function normalizeSessions(sessions) {
  if (!Array.isArray(sessions)) return [];
  return sessions.map((session) => ({
    id: session?.id || "",
    label: session?.label || session?.id || "Akun WhatsApp",
    isActive: !!session?.isActive,
    runtimeReady: !!session?.runtimeReady,
    runtimeInitializing: !!session?.runtimeInitializing,
    runtimeHasQr: !!session?.runtimeHasQr,
    lastKnownNumber: session?.lastKnownNumber || "",
    lastKnownName: session?.lastKnownName || "",
    lastKnownPlatform: session?.lastKnownPlatform || "",
  }));
}

// ─────────────────────────────────────────────
// Reusable UI Atoms
// ─────────────────────────────────────────────
function Panel({ children, sx = {}, ...props }) {
  return (
    <Box
      sx={{
        background: T.white,
        borderRadius: "16px",
        border: `1px solid ${T.line}`,
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)",
        transition: "box-shadow 0.25s ease, transform 0.25s ease",
        "&:hover": {
          boxShadow: "0 8px 30px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)",
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}

function SectionTitle({ icon, children, action, accentColor }) {
  const accent = accentColor || T.brand;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2.5,
        py: 2,
        borderBottom: `1px solid ${T.line}`,
        background: `linear-gradient(135deg, ${accent}08 0%, ${accent}03 100%)`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <Box
          sx={{
            width: 5,
            height: 18,
            borderRadius: "3px",
            background: `linear-gradient(180deg, ${accent} 0%, ${accent}99 100%)`,
            flexShrink: 0,
          }}
        />
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "8px",
            background: `linear-gradient(135deg, ${accent}18 0%, ${accent}08 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "& svg": { fontSize: 15, color: accent },
          }}
        >
          {icon}
        </Box>
        <Typography
          sx={{
            fontFamily: FONT_SANS,
            fontSize: 13.5,
            fontWeight: 600,
            color: T.ink,
            letterSpacing: "-0.01em",
          }}
        >
          {children}
        </Typography>
      </Box>
      {action}
    </Box>
  );
}

function StatusPill({ label, color = "gray" }) {
  const map = {
    green: { bg: T.brandLight, text: T.brandDark, dot: T.brand },
    amber: { bg: T.amberBg, text: T.amber, dot: T.amber },
    red: { bg: T.redBg, text: T.red, dot: T.red },
    blue: { bg: T.blueBg, text: T.blue, dot: T.blue },
    sky: { bg: T.skyBg, text: T.sky, dot: T.sky },
    gray: { bg: T.canvas, text: T.muted, dot: T.ghost },
  };
  const s = map[color] || map.gray;
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.6,
        px: 1.25,
        py: 0.5,
        borderRadius: "20px",
        bgcolor: s.bg,
      }}
    >
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          bgcolor: s.dot,
          ...(color === "sky" && {
            animation: "pulse-dot 1.6s ease-in-out infinite",
            "@keyframes pulse-dot": {
              "0%,100%": { opacity: 1 },
              "50%": { opacity: 0.3 },
            },
          }),
        }}
      />
      <Typography
        sx={{
          fontFamily: FONT_SANS,
          fontSize: 11.5,
          fontWeight: 600,
          color: s.text,
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function ActionBtn({
  children,
  variant = "solid",
  color = "brand",
  size = "md",
  sx = {},
  ...props
}) {
  const h = size === "sm" ? 32 : size === "lg" ? 44 : 38;
  const fs = size === "sm" ? 12.5 : size === "lg" ? 14 : 13;

  const solidColors = {
    brand: { bg: T.brand, hover: T.brandDark, text: "#fff" },
    blue: { bg: T.blue, hover: "#233971", text: "#fff" },
    red: { bg: T.red, hover: "#b91c1c", text: "#fff" },
    slate: { bg: T.ink2, hover: T.ink, text: "#fff" },
  };

  const outlineColors = {
    brand: { bg: T.white, hover: T.brandLight, text: T.brand, border: T.brandBorder },
    blue: { bg: T.white, hover: T.blueBg, text: T.blue, border: T.blueBorder },
    red: { bg: T.white, hover: T.redBg, text: T.red, border: T.redBorder },
    default: { bg: T.white, hover: T.surface, text: T.text, border: T.line },
  };

  if (variant === "outline") {
    const s = outlineColors[color] || outlineColors.default;
    return (
      <Button
        sx={{
          height: h,
          px: 2,
          borderRadius: "8px",
          fontFamily: FONT_SANS,
          fontSize: fs,
          fontWeight: 500,
          textTransform: "none",
          letterSpacing: "-0.01em",
          color: s.text,
          bgcolor: s.bg,
          border: `1px solid ${s.border}`,
          boxShadow: "none",
          "&:hover": { bgcolor: s.hover, boxShadow: "none" },
          "&:disabled": { opacity: 0.4, pointerEvents: "none" },
          ...sx,
        }}
        {...props}
      >
        {children}
      </Button>
    );
  }

  const s = solidColors[color] || solidColors.brand;
  return (
    <Button
      variant="contained"
      sx={{
        height: h,
        px: 2,
        borderRadius: "8px",
        fontFamily: FONT_SANS,
        fontSize: fs,
        fontWeight: 500,
        textTransform: "none",
        letterSpacing: "-0.01em",
        bgcolor: s.bg,
        color: s.text,
        boxShadow: "none",
        "&:hover": { bgcolor: s.hover, boxShadow: "none" },
        "&:disabled": { bgcolor: T.canvas, color: T.ghost, boxShadow: "none" },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
}

function DataRow({ label, value, mono = false }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        py: 1.1,
        borderBottom: `1px solid ${T.line}`,
        "&:last-child": { borderBottom: "none" },
        gap: 2,
      }}
    >
      <Typography
        sx={{ fontFamily: FONT_SANS, fontSize: 12.5, color: T.subtle, flexShrink: 0 }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: mono ? FONT_MONO : FONT_SANS,
          fontSize: mono ? 11.5 : 12.5,
          fontWeight: 500,
          color: T.ink2,
          textAlign: "right",
          wordBreak: "break-all",
        }}
      >
        {value || "—"}
      </Typography>
    </Box>
  );
}

const fieldStyle = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    bgcolor: T.white,
    fontFamily: FONT_SANS,
    fontSize: 13.5,
    "& fieldset": { borderColor: T.line },
    "&:hover fieldset": { borderColor: T.ghost },
    "&.Mui-focused fieldset": { borderColor: T.brand, borderWidth: "1.5px" },
  },
  "& .MuiInputLabel-root": { fontFamily: FONT_SANS, fontSize: 13.5 },
  "& .MuiInputLabel-root.Mui-focused": { color: T.brand },
};

// ─────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// QR Section
// ─────────────────────────────────────────────
function QRSection({ waQr, waQrAt, whatsappReady, formatSyncTime }) {
  if (whatsappReady || !waQr) return null;
  return (
    <Box
      sx={{
        mb: 2,
        borderRadius: "10px",
        border: `1px solid ${T.brandBorder}`,
        overflow: "hidden",
        bgcolor: T.white,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1.5,
          bgcolor: T.brandLight,
          borderBottom: `1px solid ${T.brandBorder}`,
        }}
      >
        <QrCode2RoundedIcon sx={{ fontSize: 16, color: T.brandDark }} />
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: T.brandDark }}
          >
            Scan QR Code
          </Typography>
          <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.brand }}>
            WhatsApp → Perangkat Tertaut → Tautkan Perangkat
          </Typography>
        </Box>
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            bgcolor: T.brand,
            animation: "qr-pulse 1.8s ease-out infinite",
            "@keyframes qr-pulse": {
              "0%": { boxShadow: `0 0 0 0 ${T.brand}55` },
              "100%": { boxShadow: `0 0 0 9px ${T.brand}00` },
            },
          }}
        />
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          py: 3,
          px: 2,
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            p: "10px",
            borderRadius: "10px",
            bgcolor: T.white,
            border: `1px solid ${T.line}`,
          }}
        >
          <QRCodeSVG value={waQr} size={180} bgColor="#ffffff" fgColor={T.ink} level="M" />
        </Box>
        {waQrAt && (
          <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11, color: T.subtle }}>
            {formatSyncTime(waQrAt)}
          </Typography>
        )}
        <Typography
          sx={{
            fontFamily: FONT_SANS,
            fontSize: 12,
            color: T.muted,
            textAlign: "center",
            maxWidth: 220,
            lineHeight: 1.7,
          }}
        >
          QR berlaku beberapa menit. Klik <strong style={{ color: T.brand }}>Hubungkan</strong>{" "}
          lagi jika expired.
        </Typography>
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────
// Source Toggle
// ─────────────────────────────────────────────
function SourceToggle({ value, onChange }) {
  const options = [
    { key: "manual", icon: <UploadFileRoundedIcon />, label: "Manual Excel" },
    { key: "gsheet", icon: <TableChartRoundedIcon />, label: "Google Sheet" },
  ];
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        bgcolor: T.surface,
        border: `1px solid ${T.line}`,
        borderRadius: "10px",
        p: "4px",
        gap: "4px",
      }}
    >
      {options.map((o) => (
        <Box
          key={o.key}
          onClick={() => onChange(o.key)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.75,
            py: 1,
            borderRadius: "7px",
            cursor: "pointer",
            transition: "all 0.15s",
            bgcolor: value === o.key ? T.white : "transparent",
            border: value === o.key ? `1px solid ${T.line}` : "1px solid transparent",
            boxShadow: value === o.key ? "0 1px 3px rgba(0,0,0,0.07)" : "none",
            "& svg": { fontSize: 15, color: value === o.key ? T.ink2 : T.subtle },
          }}
        >
          {o.icon}
          <Typography
            sx={{
              fontFamily: FONT_SANS,
              fontSize: 12.5,
              fontWeight: value === o.key ? 600 : 400,
              color: value === o.key ? T.ink2 : T.muted,
              letterSpacing: "-0.01em",
            }}
          >
            {o.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

// ─────────────────────────────────────────────
// Main Dashboard Page
// ─────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [delay, setDelay] = useState(4000);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [fileInfo, setFileInfo] = useState(null);
  const [template, setTemplate] = useState("");
  const [gsheetUrl, setGsheetUrl] = useState("");
  const [whatsappReady, setWhatsappReady] = useState(false);
  const [checkingWhatsapp, setCheckingWhatsapp] = useState(false);
  const [sending, setSending] = useState(false);
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [autoSync, setAutoSync] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [sourceMode, setSourceMode] = useState("manual");
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [syncingSheet, setSyncingSheet] = useState(false);
  const [savingGsheet, setSavingGsheet] = useState(false);
  const [loadingAutoCustomers, setLoadingAutoCustomers] = useState(false);
  const [lastSendSummary, setLastSendSummary] = useState(null);
  const [lastSendResults, setLastSendResults] = useState([]);
  const [waQr, setWaQr] = useState("");
  const [waQrAt, setWaQrAt] = useState(null);
  const [waInitializing, setWaInitializing] = useState(false);
  const [waSessions, setWaSessions] = useState([]);
  const [activeWaSessionId, setActiveWaSessionId] = useState("");
  const [pendingWaSessionId, setPendingWaSessionId] = useState("");
  const [waAccount, setWaAccount] = useState({ name: "", number: "", wid: "", platform: "" });
  const lastWhatsappLogRef = useRef("");
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!document.getElementById("plus-jakarta-sans-font")) {
      const link = document.createElement("link");
      link.id = "plus-jakarta-sans-font";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;500&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  const showToast = (msg, sev = "success") =>
    setToast({ open: true, message: msg, severity: sev });

  const addLog = (type, message) =>
    setLogs((p) => [{ type, message, time: new Date().toISOString() }, ...p]);

  const addWhatsappLogOnce = (key, type, message) => {
    if (lastWhatsappLogRef.current === key) return;
    lastWhatsappLogRef.current = key;
    addLog(type, message);
  };

  const formatSyncTime = (v) => {
    if (!v) return "-";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openGSheet = () => {
    if (!gsheetUrl?.trim()) {
      showToast("URL Google Sheet belum tersedia", "warning");
      return;
    }
    window.open(gsheetUrl, "_blank", "noopener,noreferrer");
  };

  const applyWhatsappState = (data = {}, options = {}) => {
    const sessions = normalizeSessions(data?.sessions);
    const nextActiveSessionId =
      data?.activeSessionId || sessions.find((s) => s.isActive)?.id || "";
    const nextActiveExistsInList = sessions.some((s) => s.id === nextActiveSessionId);

    setWhatsappReady(!!data.whatsappReady);
    setWaQr(data?.qr || "");
    setWaQrAt(data?.meta?.lastQrAt || null);
    setWaInitializing(!!data?.meta?.initializing && !data?.whatsappReady);
    setWaSessions(sessions);

    if (!options.preserveActiveSelection || nextActiveExistsInList) {
      setActiveWaSessionId(nextActiveSessionId);
    }

    if (nextActiveExistsInList && pendingWaSessionId === nextActiveSessionId) {
      setPendingWaSessionId("");
    }

    setWaAccount({
      name: data?.account?.name || "",
      number: data?.account?.number || "",
      wid: data?.account?.wid || "",
      platform: data?.account?.platform || "",
    });
  };

  const syncWhatsappSession = async ({
    showToastMessage = false,
    sessionId = activeWaSessionId,
    createNew = false,
  } = {}) => {
    try {
      setWaInitializing(true);
      const res = await api.post("/init-whatsapp", {
        sessionId: createNew ? "" : sessionId,
        createNew,
      });
      const data = res?.data || {};

      applyWhatsappState(data, { preserveActiveSelection: createNew });

      if (createNew && data?.activeSessionId) {
        setPendingWaSessionId(data.activeSessionId);
      }

      if (data.whatsappReady) {
        if (showToastMessage) {
          showToast(data.message || "WhatsApp terhubung", "success");
        }
        return true;
      }

      if (!data.qr) {
        const targetSessionId = data?.activeSessionId || sessionId || "";
        for (let attempt = 0; attempt < 8; attempt += 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 1000));
          const statusRes = await api.post("/check-whatsapp", {
            sessionId: targetSessionId,
          });
          const statusData = statusRes?.data || {};
          applyWhatsappState(statusData, { preserveActiveSelection: createNew });

          if (statusData.whatsappReady) {
            if (showToastMessage) {
              showToast(statusData.message || "WhatsApp terhubung", "success");
            }
            setPendingWaSessionId("");
            return true;
          }

          if (statusData.qr) break;
        }
      }

      if (showToastMessage) {
        showToast(data.message || "Silakan scan QR code.", "warning");
      }
      return false;
    } catch (err) {
      const m = err?.response?.data?.message || "Gagal konek WhatsApp";
      setWhatsappReady(false);
      setWaInitializing(false);
      setWaQr("");
      if (createNew) setPendingWaSessionId("");
      if (showToastMessage) showToast(m, "error");
      addLog("error", m);
      return false;
    }
  };

  const fetchSheetNames = async (showMsg = false) => {
    try {
      setLoadingSheets(true);
      const res = await api.get("/gsheet/sheets");
      const data = res?.data || {};
      const sheets = Array.isArray(data.sheets) ? data.sheets : [];
      setSheetNames(sheets);
      setSelectedSheet(data.selectedSheet || sheets[0] || "");
      setAutoSync(!!data.autoSync);
      if (showMsg) {
        showToast(
          sheets.length ? `${sheets.length} sheet dimuat` : "Tidak ada sheet",
          sheets.length ? "success" : "warning"
        );
      }
      return sheets;
    } catch (err) {
      const m = err?.response?.data?.message || "Gagal mengambil daftar sheet";
      if (showMsg) showToast(m, "error");
      addLog("error", m);
      return [];
    } finally {
      setLoadingSheets(false);
    }
  };

  const loadCustomersFromGSheet = async (sheetName, showMsg = true, silentLog = false) => {
    try {
      setSyncingSheet(true);
      const res = await api.post("/gsheet/sync", {
        selectedSheet: sheetName || selectedSheet || "",
      });
      const data = res?.data || {};
      const synced = Array.isArray(data.data) ? data.data : [];
      setCustomers(synced);
      setSelectedSheet(data.selectedSheet || sheetName || "");
      setSheetNames(Array.isArray(data.sheets) ? data.sheets : []);
      setAutoSync(!!data.autoSync);
      setLastSyncAt(data.lastSyncAt || null);
      setSourceMode("gsheet");
      setFileInfo({
        fileName: `Google Sheet — ${data.selectedSheet || "-"}`,
        message: data.message || `${synced.length} pelanggan dimuat`,
      });
      if (!silentLog) addLog("success", data.message || `Sync ${synced.length} pelanggan`);
      if (showMsg) {
        showToast(data.message || `Sync ${synced.length} pelanggan berhasil`, "success");
      }
      return synced;
    } catch (err) {
      const m = err?.response?.data?.message || "Gagal sync Google Sheet";
      addLog("error", m);
      if (showMsg) showToast(m, "error");
      return [];
    } finally {
      setSyncingSheet(false);
    }
  };

  const fetchInitial = async () => {
    try {
      const results = await Promise.allSettled([
        api.get("/template"),
        api.get("/gsheet"),
        api.get("/status"),
      ]);

      const [tplRes, gsRes, stRes] = results;

      if (tplRes.status === "fulfilled") {
        setTemplate(tplRes.value?.data?.template || "");
      } else {
        addLog("error", tplRes.reason?.response?.data?.message || "Gagal load template");
      }

      let gs = {};
      if (gsRes.status === "fulfilled") {
        gs = gsRes.value?.data || {};
        setGsheetUrl(gs?.url || "");
        setSelectedSheet(gs?.selectedSheet || "");
        setAutoSync(!!gs?.autoSync);
        setLastSyncAt(gs?.lastSyncAt || null);
      } else {
        addLog("error", gsRes.reason?.response?.data?.message || "Gagal load konfigurasi GSheet");
      }

      if (stRes.status === "fulfilled") {
        const statusData = stRes.value?.data || {};
        applyWhatsappState(statusData);
        setSending(!!statusData.isSending);
        setLastSendSummary(statusData.lastSendSummary || null);
        setLastSendResults(
          Array.isArray(statusData.lastSendResults) ? statusData.lastSendResults : []
        );
        setProgress(
          statusData.isSending
            ? normalizeProgress(statusData.progress)
            : { current: 0, total: 0 }
        );

        if (
          !statusData.whatsappReady &&
          statusData.activeSessionId &&
          !statusData.qr &&
          !statusData.meta?.initializing
        ) {
          await syncWhatsappSession({
            sessionId: statusData.activeSessionId || "",
            createNew: false,
          });
        }
      } else {
        addLog("error", stRes.reason?.response?.data?.message || "Gagal load status WhatsApp");
      }

      if (gs?.url) {
        const sheets = await fetchSheetNames(false);
        if (gs?.autoSync && sheets.length > 0) {
          setLoadingAutoCustomers(true);
          const target = gs?.selectedSheet || sheets[0] || "";
          await loadCustomersFromGSheet(target, false, true);
          addLog("success", `Auto sync — ${target || "sheet aktif"}`);
        }
      }
    } catch (error) {
      const m = error?.response?.data?.message || error?.message || "Gagal load data awal";
      addLog("error", m);
      showToast(m, "error");
    } finally {
      setLoadingAutoCustomers(false);
    }
  };

  const checkWhatsappStatus = async (showMsg = false, sessionId = activeWaSessionId) => {
    try {
      setCheckingWhatsapp(true);
      const res = await api.post("/check-whatsapp", { sessionId });
      const ready = !!res?.data?.whatsappReady;
      const needScan = !!res?.data?.needScan;

      applyWhatsappState(res?.data || {});
      setSending(!!res?.data?.isSending);

      if (ready) {
        addWhatsappLogOnce("wa-ready", "success", "WhatsApp siap digunakan");
        if (showMsg) showToast("WhatsApp sudah login", "success");
      } else if (needScan) {
        addWhatsappLogOnce("wa-need-scan", "info", "Silakan scan QR WhatsApp");
        if (showMsg) showToast("Silakan scan QR WhatsApp", "warning");
      } else {
        if (showMsg) showToast("WhatsApp belum siap", "warning");
      }

      return ready;
    } catch (err) {
      const m = err?.response?.data?.message || "Gagal cek status WhatsApp";
      setWhatsappReady(false);
      addWhatsappLogOnce(`wa-error-${m}`, "error", m);
      if (showMsg) showToast(m, "error");
      return false;
    } finally {
      setCheckingWhatsapp(false);
    }
  };

  const fetchSendResults = async (showFinishToast = false) => {
    try {
      const res = await api.get("/send-results");
      const data = res?.data || {};
      setSending(!!data.isSending);
      setLastSendSummary(data.summary || null);
      setLastSendResults(Array.isArray(data.results) ? data.results : []);
      setProgress(data.isSending ? normalizeProgress(data.progress) : { current: 0, total: 0 });

      if (!data.isSending && data.summary && showFinishToast) {
        showToast(
          `Selesai — Berhasil: ${data.summary.success || 0}, Gagal: ${data.summary.failed || 0}`,
          "success"
        );
      }
      return data;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    fetchInitial();

    const onProgress = (d) => {
      setSending(true);
      setProgress({ current: d.current || 0, total: d.total || 0 });
    };

    const onLog = (d) => setLogs((p) => [d, ...p]);

    const onFinished = (d) => {
      const summary = d?.summary || null;
      const results = Array.isArray(d?.results) ? d.results : [];
      setSending(false);
      setLastSendSummary(summary);
      setLastSendResults(results);

      if (summary) {
        setProgress({ current: summary.total || 0, total: summary.total || 0 });
        addLog(
          d?.success === false ? "error" : "success",
          `Selesai — Berhasil: ${summary.success || 0}, Gagal: ${summary.failed || 0}`
        );
        showToast(
          `Selesai — Berhasil: ${summary.success || 0}, Gagal: ${summary.failed || 0}`,
          d?.success === false ? "error" : "success"
        );
      } else {
        setProgress({ current: 0, total: 0 });
      }
    };

    const onWaQr = (d) => {
      if (d?.sessionId) setActiveWaSessionId(d.sessionId);
      setWaQr(d?.qr || "");
      setWaQrAt(d?.time || null);
      setWhatsappReady(false);
      setWaInitializing(false);

      if (!d?.isRefresh) {
        lastWhatsappLogRef.current = "wa-qr";
        addLog("info", "QR diterima — silakan scan");
      }
    };

    const onWaAuthenticated = (d) => {
      setWaQr("");
      setWaInitializing(true);
      lastWhatsappLogRef.current = "wa-authenticated";
      addLog("info", "QR discan, menyinkronkan WhatsApp...");
      window.setTimeout(() => {
        checkWhatsappStatus(false, d?.sessionId || "");
      }, 1200);
    };

    const onWaReady = async (d) => {
      if (d?.sessionId) setActiveWaSessionId(d.sessionId);
      setPendingWaSessionId("");
      setWhatsappReady(true);
      setWaQr("");
      setWaInitializing(false);
      lastWhatsappLogRef.current = "wa-ready";
      addLog("success", "WhatsApp siap digunakan");
      showToast("WhatsApp siap digunakan", "success");
      await checkWhatsappStatus(false, d?.sessionId || "");
    };

    if (socket?.on) {
      socket.on("send-progress", onProgress);
      socket.on("send-log", onLog);
      socket.on("send-finished", onFinished);
      socket.on("wa-qr", onWaQr);
      socket.on("wa-authenticated", onWaAuthenticated);
      socket.on("wa-ready", onWaReady);
    }

    fetchSendResults(false);

    return () => {
      if (socket?.off) {
        socket.off("send-progress", onProgress);
        socket.off("send-log", onLog);
        socket.off("send-finished", onFinished);
        socket.off("wa-qr", onWaQr);
        socket.off("wa-authenticated", onWaAuthenticated);
        socket.off("wa-ready", onWaReady);
      }
    };
  }, []);

  useEffect(() => {
    if (whatsappReady || (!waInitializing && !waQr)) return;
    const timer = window.setInterval(() => {
      checkWhatsappStatus(false, pendingWaSessionId || activeWaSessionId);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [whatsappReady, waInitializing, waQr, activeWaSessionId, pendingWaSessionId]);

  const handleUpload = async (file) => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/upload-excel", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCustomers(res?.data?.data || []);
      setSourceMode("manual");
      setFileInfo({
        fileName: res?.data?.fileName,
        message: res?.data?.message,
      });
      addLog("success", res?.data?.message || "Upload berhasil");
      showToast(res?.data?.message || "Upload berhasil", "success");
    } catch (err) {
      const m = err?.response?.data?.message || "Upload gagal";
      addLog("error", m);
      showToast(m, "error");
    }
  };

  const handleInitWhatsapp = async () => {
    addLog("info", "Menghubungkan WhatsApp...");
    const ready = await syncWhatsappSession({
      showToastMessage: true,
      sessionId: activeWaSessionId,
      createNew: !activeWaSessionId,
    });
    addLog("info", ready ? "Session aktif" : "Menunggu scan QR");
  };

  const handleAddWhatsappAccount = async () => {
    addLog("info", "Menyiapkan akun WhatsApp baru...");
    const ready = await syncWhatsappSession({
      showToastMessage: true,
      createNew: true,
    });
    addLog("info", ready ? "Akun baru aktif" : "QR akun baru siap discan");
  };

  const handleSelectWhatsappSession = async (sessionId) => {
    setActiveWaSessionId(sessionId);
    const session = waSessions.find((item) => item.id === sessionId);
    setWaAccount({
      name: session?.lastKnownName || "",
      number: session?.lastKnownNumber || "",
      wid: "",
      platform: session?.lastKnownPlatform || "",
    });
    addLog("info", `Memilih akun ${session?.label || sessionId}`);
    try {
      setWaInitializing(true);
      const res = await api.post("/select-whatsapp-session", { sessionId });
      const data = res?.data || {};
      applyWhatsappState(data);
      addLog(
        data?.whatsappReady ? "success" : data?.qr ? "info" : "info",
        data?.message || "Akun WhatsApp dipilih"
      );
    } catch (err) {
      const m = err?.response?.data?.message || "Gagal memilih akun WhatsApp";
      setWhatsappReady(false);
      setWaInitializing(false);
      setWaQr("");
      addLog("error", m);
      showToast(m, "error");
    }
  };

  const handleDeleteWhatsappSession = async () => {
    if (!activeWaSessionId) {
      showToast("Pilih akun WhatsApp dulu", "warning");
      return;
    }

    const selectedWaSession = waSessions.find((s) => s.id === activeWaSessionId) || null;
    const sessionLabel =
      selectedWaSession?.lastKnownName || selectedWaSession?.label || activeWaSessionId;

    const confirmed = window.confirm(`Hapus sesi WhatsApp ${sessionLabel}?`);
    if (!confirmed) return;

    try {
      const res = await api.post("/delete-whatsapp-session", {
        sessionId: activeWaSessionId,
      });
      const data = res?.data || {};
      applyWhatsappState(data);
      showToast(data.message || "Sesi WhatsApp berhasil dihapus", "success");
      addLog("success", data.message || `Sesi ${sessionLabel} dihapus`);
    } catch (err) {
      const m = err?.response?.data?.message || "Gagal menghapus sesi WhatsApp";
      addLog("error", m);
      showToast(m, "error");
    }
  };

  const handleSend = async () => {
    try {
      if (sending) return;
      if (!activeWaSessionId) {
        showToast("Pilih akun WhatsApp dulu", "warning");
        return;
      }
      if (!customers.length) {
        showToast("Data pelanggan kosong", "error");
        return;
      }
      if (Number(delay) < 3000) {
        showToast("Delay minimal 3000 ms", "warning");
        return;
      }

      setSending(true);
      setLastSendSummary(null);
      setLastSendResults([]);
      setProgress({ current: 0, total: customers.length });

      const ready = await checkWhatsappStatus(false);
      if (!ready) {
        setSending(false);
        showToast("WhatsApp belum siap. Hubungkan dan scan QR dulu.", "warning");
        return;
      }

      addLog("info", `Mulai kirim ke ${customers.length} pelanggan...`);
      const res = await api.post("/send-messages", {
        customers,
        delay: Number(delay),
        sessionId: activeWaSessionId,
      });
      const data = res?.data || {};

      if (data.background) {
        addLog("success", data.message || "Pengiriman berjalan di background");
        showToast(data.message || "Pengiriman berjalan di background", "success");
      } else {
        const s = data.summary || { success: 0, failed: 0 };
        setSending(false);
        setLastSendSummary(s);
        addLog("success", `Selesai — Berhasil: ${s.success}, Gagal: ${s.failed}`);
        showToast(`Selesai — Berhasil: ${s.success}, Gagal: ${s.failed}`, "success");
      }
    } catch (err) {
      const m = err?.response?.data?.message || "Gagal kirim pesan";
      setSending(false);
      addLog("error", m);
      showToast(m, "error");
    }
  };

  const selectedWaSession = waSessions.find((s) => s.id === activeWaSessionId) || null;

  const handleSaveGsheetConfig = async ({
    url = gsheetUrl,
    selected = selectedSheet,
    auto = autoSync,
    showSuccess = true,
  } = {}) => {
    try {
      setSavingGsheet(true);
      const res = await api.post("/gsheet", {
        url,
        selectedSheet: selected || "",
        autoSync: !!auto,
      });
      setGsheetUrl(url);
      setSelectedSheet(selected || "");
      setAutoSync(!!auto);
      if (showSuccess) {
        showToast(res?.data?.message || "Konfigurasi tersimpan", "success");
      }
      addLog("success", "Konfigurasi Google Sheet tersimpan");
      return true;
    } catch (err) {
      const m = err?.response?.data?.message || "Gagal simpan konfigurasi";
      addLog("error", m);
      showToast(m, "error");
      return false;
    } finally {
      setSavingGsheet(false);
    }
  };

  const handleSelectSheet = async (val) => {
    try {
      setSelectedSheet(val);
      const res = await api.post("/gsheet/select-sheet", {
        selectedSheet: val,
      });
      const data = res?.data || {};
      setSheetNames(Array.isArray(data.sheets) ? data.sheets : []);
      showToast(data.message || "Sheet dipilih", "success");
      addLog("success", `Sheet: ${val}`);
    } catch (err) {
      const m = err?.response?.data?.message || "Gagal memilih sheet";
      addLog("error", m);
      showToast(m, "error");
    }
  };

  const handleSyncGSheet = async () => {
    if (!gsheetUrl) {
      showToast("URL Google Sheet belum diisi", "warning");
      return;
    }
    if (!selectedSheet && sheetNames.length > 0) {
      showToast("Pilih sheet terlebih dahulu", "warning");
      return;
    }
    await loadCustomersFromGSheet(selectedSheet, true, false);
  };

  const handleToggleAutoSync = async (checked) => {
    const ok = await handleSaveGsheetConfig({
      url: gsheetUrl,
      selected: selectedSheet,
      auto: checked,
      showSuccess: true,
    });
    if (ok) setAutoSync(checked);
  };

  const handleLoadCustomers = async () => {
    try {
      const res = await api.post("/load-customers", {
        source: "gsheet",
        selectedSheet,
      });
      const data = res?.data || {};
      const list = Array.isArray(data.data) ? data.data : [];
      setCustomers(list);
      setSourceMode("gsheet");
      setSelectedSheet(data.selectedSheet || selectedSheet);
      setSheetNames(Array.isArray(data.sheets) ? data.sheets : []);
      setAutoSync(!!data.autoSync);
      setLastSyncAt(data.lastSyncAt || null);
      setFileInfo({
        fileName: `Google Sheet — ${data.selectedSheet || "-"}`,
        message: data.message || `${list.length} pelanggan dimuat`,
      });
      addLog("success", data.message || `${list.length} pelanggan dimuat`);
      showToast(data.message || `${list.length} pelanggan dimuat`, "success");
    } catch (err) {
      const m = err?.response?.data?.message || "Gagal memuat pelanggan";
      addLog("error", m);
      showToast(m, "error");
    }
  };

  const percent =
    progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  const waStatus = whatsappReady ? "green" : waInitializing ? "sky" : "amber";
  const waLabel = whatsappReady ? "Terhubung" : waInitializing ? "Menyiapkan..." : "Belum login";
  const templatePreview = template?.trim()
    ? template
    : "Template belum diisi. Buka Pengaturan untuk mengatur pesan yang akan dikirim.";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        fontFamily: FONT_SANS,
        p: { xs: 1.5, sm: 2.5, lg: 3 },
        boxSizing: "border-box",
        "&, & *": {
          boxSizing: "border-box",
        },
      }}
    >
      <Grid container spacing={2} alignItems={{ xs: "flex-start", lg: "stretch" }}>
        <Grid
          item
          xs={12}
          md={6}
          lg={4}
          sx={{ display: "flex", alignSelf: { xs: "flex-start", lg: "stretch" } }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              minWidth: 0,
              width: "100%",
              height: { xs: "auto", lg: "100%" },
            }}
          >
            <SourceToggle value={sourceMode} onChange={setSourceMode} />

            {sourceMode === "manual" && (
              <Panel
                sx={{
                  width: "100%",
                  flex: { lg: 1 },
                  background: "linear-gradient(155deg, #ffffff 40%, #eaeff7 100%)",
                  borderColor: T.brandBorder,
                }}
              >
                <Box
                  sx={{
                    height: 3,
                    background: "linear-gradient(90deg, #172649 0%, #233971 55%, #3a5ca8 100%)",
                  }}
                />

                <SectionTitle
                  icon={<UploadFileRoundedIcon />}
                  accentColor={T.brand}
                  action={
                    <StatusPill
                      label={fileInfo ? "Dimuat" : "Belum ada file"}
                      color={fileInfo ? "green" : "gray"}
                    />
                  }
                >
                  Upload File Excel
                </SectionTitle>

                <Box sx={{ p: 2.5, position: "relative", overflow: "hidden" }}>
                  <Box
                    sx={{
                      position: "absolute",
                      right: -16,
                      bottom: -16,
                      pointerEvents: "none",
                      zIndex: 0,
                      "& svg": { fontSize: 160, color: T.brand, opacity: 0.045 },
                    }}
                  >
                    <UploadFileRoundedIcon />
                  </Box>

                  <Box sx={{ position: "relative", zIndex: 1 }}>
                    <Box
                      sx={{
                        p: 1.75,
                        borderRadius: "8px",
                        bgcolor: T.brandLight,
                        border: `1px solid ${T.brandBorder}`,
                        mb: 2,
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: FONT_SANS,
                          fontSize: 12.5,
                          color: T.brandDark,
                          lineHeight: 1.7,
                        }}
                      >
                        Upload file <strong>.xlsx</strong> dengan kolom nomor HP dan nama pelanggan.
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 2 }}>
                      {[".xlsx", ".xls"].map((ext) => (
                        <Box
                          key={ext}
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                            px: 1.25,
                            py: 0.5,
                            borderRadius: "6px",
                            bgcolor: "#fff",
                            border: `1px solid ${T.brandBorder}`,
                            boxShadow: "0 1px 3px rgba(35,57,113,0.08)",
                          }}
                        >
                          <DescriptionRoundedIcon sx={{ fontSize: 12, color: T.brand }} />
                          <Typography
                            sx={{
                              fontFamily: FONT_MONO,
                              fontSize: 11.5,
                              fontWeight: 600,
                              color: T.brand,
                            }}
                          >
                            {ext}
                          </Typography>
                        </Box>
                      ))}
                      <Typography
                        sx={{
                          fontFamily: FONT_SANS,
                          fontSize: 11.5,
                          color: T.subtle,
                        }}
                      >
                        format yang didukung
                      </Typography>
                    </Box>

                    <UploadCard onUpload={handleUpload} fileInfo={fileInfo} />
                  </Box>
                </Box>
              </Panel>
            )}

            {sourceMode === "gsheet" && (
              <Panel sx={{ width: "100%", flex: { lg: 1 } }}>
                <SectionTitle
                  icon={<TableChartRoundedIcon />}
                  accentColor={T.brand}
                  action={
                    gsheetUrl ? (
                      <ActionBtn
                        variant="outline"
                        color="brand"
                        size="sm"
                        startIcon={<OpenInNewRoundedIcon sx={{ fontSize: "13px !important" }} />}
                        onClick={openGSheet}
                      >
                        Buka
                      </ActionBtn>
                    ) : null
                  }
                >
                  Google Sheet
                </SectionTitle>
                <Box sx={{ p: 2.5 }}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    {[
                      {
                        label: loadingSheets ? "Memuat..." : "Ambil Sheet",
                        icon: <ViewListRoundedIcon />,
                        action: () => fetchSheetNames(true),
                        disabled: loadingSheets || !gsheetUrl.trim(),
                        variant: "outline",
                      },
                      {
                        label: syncingSheet ? "Syncing..." : "Sync Data",
                        icon: <SyncRoundedIcon />,
                        action: handleSyncGSheet,
                        disabled:
                          syncingSheet ||
                          loadingSheets ||
                          !gsheetUrl.trim() ||
                          (sheetNames.length > 0 && !selectedSheet),
                        variant: "solid",
                      },
                      {
                        label: "Load Data",
                        icon: <PeopleAltRoundedIcon />,
                        action: handleLoadCustomers,
                        disabled: !gsheetUrl.trim() || syncingSheet,
                        variant: "outline",
                      },
                      {
                        label: "Buka Sheet",
                        icon: <LaunchRoundedIcon />,
                        action: openGSheet,
                        disabled: !gsheetUrl.trim(),
                        variant: "outline",
                      },
                    ].map((btn, i) => (
                      <ActionBtn
                        key={i}
                        variant={btn.variant}
                        color="brand"
                        size="sm"
                        startIcon={
                          <Box sx={{ "& svg": { fontSize: "14px !important" } }}>{btn.icon}</Box>
                        }
                        onClick={btn.action}
                        disabled={btn.disabled}
                        sx={{ width: "100%", justifyContent: "center" }}
                      >
                        {btn.label}
                      </ActionBtn>
                    ))}
                  </Box>

                  <FormControl fullWidth size="small" sx={{ ...fieldStyle, mb: 2 }}>
                    <InputLabel>Pilih Sheet</InputLabel>
                    <Select
                      value={selectedSheet}
                      label="Pilih Sheet"
                      onChange={(e) => handleSelectSheet(e.target.value)}
                      disabled={!sheetNames.length || loadingSheets}
                    >
                      {sheetNames.map((s) => (
                        <MenuItem
                          key={s}
                          value={s}
                          sx={{ fontFamily: FONT_SANS, fontSize: 13.5 }}
                        >
                          {s}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 1.5,
                      py: 1.25,
                      borderRadius: "8px",
                      bgcolor: T.surface,
                      border: `1px solid ${T.line}`,
                      mb: 2,
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: FONT_SANS,
                        fontSize: 13,
                        color: T.text,
                        fontWeight: 500,
                      }}
                    >
                      Auto sync saat dibuka
                    </Typography>
                    <Switch
                      checked={autoSync}
                      onChange={(e) => handleToggleAutoSync(e.target.checked)}
                      disabled={savingGsheet || !gsheetUrl.trim()}
                      size="small"
                      color="success"
                    />
                  </Box>

                  <Box
                    sx={{
                      borderRadius: "8px",
                      border: `1px solid ${T.line}`,
                      overflow: "hidden",
                      bgcolor: T.surface,
                      px: 1.5,
                    }}
                  >
                    <DataRow label="Sheet aktif" value={selectedSheet} />
                    <DataRow label="Jumlah sheet" value={sheetNames.length || "—"} />
                    <DataRow label="Last sync" value={formatSyncTime(lastSyncAt)} mono />
                  </Box>
                </Box>
              </Panel>
            )}
          </Box>
        </Grid>

        <Grid
          item
          xs={12}
          md={6}
          lg={4}
          sx={{ display: "flex", alignSelf: { xs: "flex-start", lg: "stretch" } }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              minWidth: 0,
              width: "100%",
              height: { xs: "auto", lg: "100%" },
            }}
          >
            <Panel sx={{ width: "100%" }}>
              <SectionTitle
                icon={<WhatsAppIcon />}
                accentColor="#25D366"
                action={<StatusPill label={waLabel} color={waStatus} />}
              >
                Kirim WhatsApp
              </SectionTitle>
              <Box sx={{ p: 2.5 }}>
                <FormControl fullWidth size="small" sx={{ ...fieldStyle, mb: 1.5 }}>
                  <InputLabel>Akun WhatsApp</InputLabel>
                  <Select
                    value={activeWaSessionId}
                    label="Akun WhatsApp"
                    onChange={(e) => handleSelectWhatsappSession(e.target.value)}
                  >
                    {waSessions.length === 0 ? (
                      <MenuItem value="" disabled>
                        Belum ada akun tersimpan
                      </MenuItem>
                    ) : (
                      waSessions.map((s) => (
                        <MenuItem
                          key={s.id}
                          value={s.id}
                          sx={{ fontFamily: FONT_SANS, fontSize: 13.5 }}
                        >
                          {s.label}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>

                <Box
                  sx={{
                    borderRadius: "8px",
                    border: `1px solid ${T.line}`,
                    bgcolor: T.surface,
                    px: 1.5,
                    mb: 1.5,
                  }}
                >
                  <DataRow
                    label="Nama akun"
                    value={
                      waAccount.name ||
                      selectedWaSession?.lastKnownName ||
                      selectedWaSession?.label ||
                      "-"
                    }
                  />
                  <DataRow
                    label="Nomor WA"
                    value={waAccount.number || selectedWaSession?.lastKnownNumber || "-"}
                    mono
                  />
                  <DataRow
                    label="Session ID"
                    value={activeWaSessionId || "Belum dipilih"}
                    mono
                  />
                </Box>

                {!whatsappReady && !waQr && (
                  <Box
                    sx={{
                      px: 1.75,
                      py: 1.25,
                      borderRadius: "8px",
                      bgcolor: T.amberBg,
                      border: `1px solid ${T.amberBorder}`,
                      mb: 1.5,
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: FONT_SANS,
                        fontSize: 12.5,
                        color: "#92400e",
                        lineHeight: 1.7,
                      }}
                    >
                      {waInitializing
                        ? "Menyiapkan koneksi WhatsApp..."
                        : "Pilih akun lalu klik Hubungkan, atau tambah akun baru."}
                    </Typography>
                  </Box>
                )}

                <QRSection
                  waQr={waQr}
                  waQrAt={waQrAt}
                  whatsappReady={whatsappReady}
                  formatSyncTime={formatSyncTime}
                />

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 1.75,
                    py: 1.5,
                    borderRadius: "8px",
                    bgcolor: T.surface,
                    border: `1px solid ${T.line}`,
                    mb: 2,
                  }}
                >
                  <AccessTimeRoundedIcon sx={{ fontSize: 16, color: T.muted, flexShrink: 0 }} />
                  <Typography
                    sx={{
                      fontFamily: FONT_SANS,
                      fontSize: 13,
                      color: T.text,
                      flex: 1,
                      fontWeight: 500,
                    }}
                  >
                    Jeda antar pesan
                  </Typography>
                  <TextField
                    type="number"
                    value={delay}
                    size="small"
                    onChange={(e) => setDelay(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Typography
                            sx={{
                              fontFamily: FONT_MONO,
                              fontSize: 12,
                              color: T.subtle,
                            }}
                          >
                            ms
                          </Typography>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      width: 120,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "7px",
                        fontFamily: FONT_MONO,
                        fontSize: 13,
                        "& fieldset": { borderColor: T.line },
                        "&:hover fieldset": { borderColor: T.brand },
                        "&.Mui-focused fieldset": { borderColor: T.brand },
                      },
                    }}
                  />
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <ActionBtn
                    color="brand"
                    fullWidth
                    size="md"
                    startIcon={<WhatsAppIcon sx={{ fontSize: "16px !important" }} />}
                    onClick={handleInitWhatsapp}
                    sx={{ fontWeight: 600 }}
                  >
                    {whatsappReady
                      ? "WhatsApp Terhubung ✓"
                      : waInitializing
                      ? "Menyiapkan..."
                      : "Hubungkan WhatsApp"}
                  </ActionBtn>

                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                    <ActionBtn
                      variant="outline"
                      color="brand"
                      size="md"
                      fullWidth
                      startIcon={<AddRoundedIcon sx={{ fontSize: "15px !important" }} />}
                      onClick={handleAddWhatsappAccount}
                      disabled={sending}
                    >
                      Tambah Akun
                    </ActionBtn>
                    <ActionBtn
                      variant="outline"
                      color="red"
                      size="md"
                      fullWidth
                      startIcon={
                        <DeleteOutlineRoundedIcon sx={{ fontSize: "15px !important" }} />
                      }
                      onClick={handleDeleteWhatsappSession}
                      disabled={!activeWaSessionId || sending || waInitializing}
                    >
                      Hapus Sesi
                    </ActionBtn>
                  </Box>

                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                    <ActionBtn
                      color="slate"
                      size="md"
                      fullWidth
                      startIcon={<SendRoundedIcon sx={{ fontSize: "15px !important" }} />}
                      onClick={handleSend}
                      disabled={!whatsappReady || !customers.length || sending}
                    >
                      {sending ? "Mengirim..." : "Kirim Pesan"}
                    </ActionBtn>
                    <ActionBtn
                      variant="outline"
                      size="md"
                      fullWidth
                      startIcon={<WifiRoundedIcon sx={{ fontSize: "15px !important" }} />}
                      onClick={() => checkWhatsappStatus(true)}
                      disabled={checkingWhatsapp || sending}
                    >
                      {checkingWhatsapp ? "Mengecek..." : "Cek Status"}
                    </ActionBtn>
                  </Box>
                </Box>

                <Box
                  sx={{
                    mt: 2,
                    px: 1.75,
                    py: 1.25,
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: customers.length ? T.brandLight : T.surface,
                    border: `1px solid ${customers.length ? T.brandBorder : T.line}`,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: FONT_SANS,
                      fontSize: 12.5,
                      color: T.muted,
                    }}
                  >
                    Data siap kirim
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: FONT_MONO,
                      fontSize: 14,
                      fontWeight: 600,
                      color: customers.length ? T.brand : T.subtle,
                    }}
                  >
                    {customers.length.toLocaleString()} pelanggan
                  </Typography>
                </Box>

                {(progress.total > 0 || loadingAutoCustomers || sending) && (
                  <Box
                    sx={{
                      mt: 1.5,
                      p: 1.75,
                      borderRadius: "8px",
                      bgcolor: T.brandLight,
                      border: `1px solid ${T.brandBorder}`,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 1.25,
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: FONT_SANS,
                          fontSize: 12.5,
                          fontWeight: 500,
                          color: T.brand,
                        }}
                      >
                        {loadingAutoCustomers
                          ? "Memuat auto sync..."
                          : sending
                          ? "Mengirim pesan..."
                          : "Progress pengiriman"}
                      </Typography>
                      {!loadingAutoCustomers && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography
                            sx={{
                              fontFamily: FONT_MONO,
                              fontSize: 11.5,
                              color: T.muted,
                            }}
                          >
                            {progress.current}/{progress.total}
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: FONT_MONO,
                              fontSize: 11.5,
                              fontWeight: 600,
                              px: 0.75,
                              py: 0.25,
                              borderRadius: "5px",
                              bgcolor: T.white,
                              color: T.brand,
                              border: `1px solid ${T.brandBorder}`,
                            }}
                          >
                            {percent}%
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    <LinearProgress
                      variant={loadingAutoCustomers ? "indeterminate" : "determinate"}
                      value={loadingAutoCustomers ? undefined : percent}
                      sx={{
                        height: 4,
                        borderRadius: 999,
                        bgcolor: T.white,
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 999,
                          bgcolor: T.brand,
                        },
                      }}
                    />
                  </Box>
                )}

                {lastSendSummary && (
                  <Box
                    sx={{
                      mt: 1.5,
                      px: 1.5,
                      py: 1.25,
                      borderRadius: "8px",
                      bgcolor: T.surface,
                      border: `1px solid ${T.line}`,
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: FONT_SANS,
                        fontSize: 11,
                        fontWeight: 700,
                        color: T.subtle,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        mb: 1,
                      }}
                    >
                      Hasil terakhir
                    </Typography>
                    <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                      {[
                        {
                          label: `Total ${lastSendSummary.total || 0}`,
                          bg: T.brandLight,
                          color: T.brand,
                          border: T.brandBorder,
                        },
                        {
                          label: `Berhasil ${lastSendSummary.success || 0}`,
                          bg: T.brandLight,
                          color: T.brand,
                          border: T.brandBorder,
                        },
                        {
                          label: `Gagal ${lastSendSummary.failed || 0}`,
                          bg: T.redBg,
                          color: T.red,
                          border: T.redBorder,
                        },
                      ].map((c, i) => (
                        <Box
                          key={i}
                          sx={{
                            px: 1,
                            py: 0.4,
                            borderRadius: "5px",
                            bgcolor: c.bg,
                            border: `1px solid ${c.border}`,
                          }}
                        >
                          <Typography
                            sx={{
                              fontFamily: FONT_MONO,
                              fontSize: 11.5,
                              fontWeight: 600,
                              color: c.color,
                            }}
                          >
                            {c.label}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Panel>

            <Panel sx={{ width: "100%", flex: { lg: 1 } }}>
              <SectionTitle
                icon={<DescriptionRoundedIcon />}
                accentColor={T.brand}
                action={
                  <ActionBtn
                    variant="outline"
                    color="brand"
                    size="sm"
                    startIcon={<SettingsRoundedIcon sx={{ fontSize: "13px !important" }} />}
                    onClick={() => navigate("/settings")}
                  >
                    Edit
                  </ActionBtn>
                }
              >
                Template Pesan
              </SectionTitle>
              <Box sx={{ p: 2.5 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.5,
                    py: 1.25,
                    borderRadius: "8px",
                    bgcolor: T.brandLight,
                    border: `1px solid ${T.brandBorder}`,
                    mb: 1.5,
                    cursor: "pointer",
                    "&:hover": { filter: "brightness(0.97)" },
                  }}
                  onClick={() => navigate("/settings")}
                >
                  <LockRoundedIcon sx={{ fontSize: 14, color: T.brand }} />
                  <Typography
                    sx={{
                      fontFamily: FONT_SANS,
                      fontSize: 12.5,
                      color: T.brandDark,
                      flex: 1,
                    }}
                  >
                    Template hanya bisa diedit di halaman Pengaturan
                  </Typography>
                </Box>

                <Box
                  sx={{
                    borderRadius: "12px",
                    border: `1px solid ${T.brandBorder}`,
                    background:
                      "radial-gradient(circle at top right, rgba(58,92,168,0.12) 0%, rgba(58,92,168,0) 32%), linear-gradient(180deg, #ffffff 0%, #f8fafe 100%)",
                    overflow: "hidden",
                    position: "relative",
                    minHeight: 168,
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.85), 0 10px 24px rgba(35,57,113,0.08)",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 1.5,
                      py: 1.1,
                      borderBottom: `1px solid ${T.brandBorder}`,
                      bgcolor: "rgba(234,239,247,0.8)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontFamily: FONT_SANS,
                          fontSize: 11,
                          fontWeight: 700,
                          color: T.brand,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        Template Preview
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: FONT_SANS,
                          fontSize: 12,
                          color: T.muted,
                          mt: 0.35,
                        }}
                      >
                        Pesan yang akan dikirim
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: template?.trim() ? T.brand : T.ghost,
                        boxShadow: template?.trim()
                          ? "0 0 0 6px rgba(35,57,113,0.12)"
                          : "0 0 0 6px rgba(209,213,219,0.35)",
                        transition: "all 0.2s ease",
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      position: "relative",
                      px: 1.75,
                      pt: 1.75,
                      pb: 4.75,
                      minHeight: 126,
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: FONT_SANS,
                        fontSize: 13.5,
                        color: template?.trim() ? T.text : T.subtle,
                        lineHeight: 1.9,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        maxHeight: 118,
                        overflow: "hidden",
                        pr: 0.5,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {templatePreview}
                    </Typography>

                    <Box
                      sx={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: 72,
                        background:
                          "linear-gradient(180deg, rgba(248,250,254,0) 0%, rgba(248,250,254,0.8) 42%, #f8fafe 100%)",
                        pointerEvents: "none",
                      }}
                    />

                    <Box
                      sx={{
                        position: "absolute",
                        left: 14,
                        right: 14,
                        bottom: 12,
                        zIndex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                        px: 1.4,
                        py: 1,
                        borderRadius: "10px",
                        bgcolor: "rgba(255,255,255,0.88)",
                        border: `1px solid rgba(179,193,216,0.8)`,
                        backdropFilter: "blur(10px)",
                        boxShadow: "0 8px 18px rgba(12,17,27,0.06)",
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            fontFamily: FONT_SANS,
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: T.ink2,
                          }}
                        >
                          Buka editor template
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: FONT_SANS,
                            fontSize: 11.5,
                            color: T.muted,
                            mt: 0.2,
                          }}
                        >
                          Atur isi pesan, format, dan detail lengkap.
                        </Typography>
                      </Box>
                      <ActionBtn
                        variant="outline"
                        color="brand"
                        size="sm"
                        onClick={() => navigate("/settings")}
                        sx={{ flexShrink: 0 }}
                      >
                        Edit
                      </ActionBtn>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Panel>
          </Box>
        </Grid>

        <Grid
          item
          xs={12}
          lg={4}
          sx={{ display: "flex", alignSelf: { xs: "flex-start", lg: "stretch" } }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              minWidth: 0,
              width: "100%",
              height: { xs: "auto", lg: "100%" },
            }}
          >
            <Panel sx={{ width: "100%", flex: { lg: 1 } }}>
              <SectionTitle icon={<PeopleAltRoundedIcon />} accentColor={T.teal}>
                Preview Data
              </SectionTitle>
              <Box sx={{ p: 2.5 }}>
                <CustomerPreview customers={customers} />
              </Box>
            </Panel>

            <Panel sx={{ width: "100%", flex: { lg: 1 } }}>
              <SectionTitle icon={<SignalCellularAltRoundedIcon />} accentColor={T.brand}>
                Activity Log
              </SectionTitle>
              <Box sx={{ p: 2.5 }}>
                <LogsPanel logs={logs} />
              </Box>
            </Panel>
          </Box>
        </Grid>
      </Grid>

      <Snackbar
        open={toast.open}
        autoHideDuration={3200}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          sx={{
            fontFamily: FONT_SANS,
            fontWeight: 500,
            fontSize: 13,
            borderRadius: "10px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
            letterSpacing: "-0.01em",
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
