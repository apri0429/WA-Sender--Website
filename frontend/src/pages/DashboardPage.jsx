import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog, DialogContent, DialogTitle,
  FormControl, Grid, IconButton, InputAdornment, InputLabel,
  LinearProgress, MenuItem, Select, TextField, Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import CardBox      from "../components/cardbox/CardBox";
import CardBigBox   from "../components/cardbox/CardBigBox";
import CreateButton from "../components/button/CreateButton";
import AlertModal   from "../components/AlertModal";
import LogsPanel    from "../components/LogsPanel";
import api    from "../services/api";
import socket from "../services/socket";

import WhatsAppIcon                from "@mui/icons-material/WhatsApp";
import SendRoundedIcon             from "@mui/icons-material/SendRounded";
import DescriptionRoundedIcon      from "@mui/icons-material/DescriptionRounded";
import AccessTimeRoundedIcon       from "@mui/icons-material/AccessTimeRounded";
import SyncRoundedIcon             from "@mui/icons-material/SyncRounded";
import TableChartRoundedIcon       from "@mui/icons-material/TableChartRounded";
import PeopleAltRoundedIcon        from "@mui/icons-material/PeopleAltRounded";
import WifiRoundedIcon             from "@mui/icons-material/WifiRounded";
import SettingsRoundedIcon         from "@mui/icons-material/SettingsRounded";
import QrCode2RoundedIcon          from "@mui/icons-material/QrCode2Rounded";
import DeleteOutlineRoundedIcon    from "@mui/icons-material/DeleteOutlineRounded";
import AddRoundedIcon              from "@mui/icons-material/AddRounded";
import SignalCellularAltRoundedIcon from "@mui/icons-material/SignalCellularAltRounded";

// ─── Design tokens ────────────────────────────────────────────────────────────

const F = {
  sans: "'Plus Jakarta Sans', 'Inter', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
};

const C = {
  brand:        "#233971",
  brandBg:      "#eaeff7",
  brandBorder:  "#b3c1d8",
  ink:          "#163a6b",
  text:         "#374151",
  muted:        "#6b7280",
  subtle:       "#9ca3af",
  line:         "#e5e7eb",
  surface:      "#f9fafb",
  white:        "#ffffff",
  amber:        "#92400e",
  amberBg:      "#fffbeb",
  amberBorder:  "#fde68a",
};

// ─── Shared style objects (keeps JSX clean) ───────────────────────────────────

const S = {
  page:         { fontFamily: F.sans, padding: 16, paddingBottom: 32 },
  col:          { display: "flex", flexDirection: "column", gap: 16, height: "100%" },
  col12:        { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  row:          { display: "flex", alignItems: "center", gap: 8 },
  rowBetween:   { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  stack:        { display: "flex", flexDirection: "column", gap: 8 },

  // cards / panels
  infoBox:      { borderRadius: 8, border: `1px solid ${C.line}`, background: C.surface, padding: "0 12px" },
  warnBox:      { padding: "10px 14px", borderRadius: 8, background: C.amberBg, border: `1px solid ${C.amberBorder}` },
  counterBox:   (active) => ({ padding: "10px 14px", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between", background: active ? C.brandBg : C.surface, border: `1px solid ${active ? C.brandBorder : C.line}` }),
  progressBox:  { padding: 14, borderRadius: 8, background: C.brandBg, border: `1px solid ${C.brandBorder}` },
  summaryBox:   { padding: "10px 12px", borderRadius: 8, background: C.surface, border: `1px solid ${C.line}` },
  delayRow:     { display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, background: C.surface, border: `1px solid ${C.line}` },
  listScroll:   { flex: 1, minHeight: 0, overflow: "auto", borderRadius: 10, border: `1px solid ${C.line}` },
  logScroll:    { overflow: "auto", paddingRight: 2 },

  // customer list row
  custRow:      (even) => ({ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderBottom: `1px solid ${C.line}`, background: even ? C.white : C.surface }),

  // text styles
  label:        (sz = 12.5) => ({ fontFamily: F.sans, fontSize: sz, color: C.muted }),
  title:        (sz = 13) =>   ({ fontFamily: F.sans, fontSize: sz, fontWeight: 600, color: C.ink, margin: 0, lineHeight: 1.3 }),
  sub:          (sz = 11) =>   ({ fontFamily: F.sans, fontSize: sz, color: C.muted, margin: 0, lineHeight: 1.4 }),
  mono:         (sz = 10) =>   ({ fontFamily: F.mono, fontSize: sz, color: C.muted }),
  eyebrow:      { fontFamily: F.sans, fontSize: 10.5, fontWeight: 700, color: C.subtle, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" },
  counterVal:   (active) => ({ fontFamily: F.mono, fontSize: 14, fontWeight: 600, color: active ? C.brand : C.subtle }),

  // QR
  qrWrap:       { borderRadius: 10, border: `1px solid ${C.brandBorder}`, overflow: "hidden", background: C.white, marginBottom: 4 },
  qrHeader:     { display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.brandBg, borderBottom: `1px solid ${C.brandBorder}` },
  qrBody:       { display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 16px", gap: 10 },
  qrFrame:      { padding: 8, borderRadius: 10, background: C.white, border: `1px solid ${C.line}` },

  // MUI overrides
  fieldSx: {
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px", background: C.white, fontFamily: F.sans, fontSize: 13.5,
      "& fieldset": { borderColor: C.line },
      "&:hover fieldset": { borderColor: C.subtle },
      "&.Mui-focused fieldset": { borderColor: C.brand, borderWidth: "1.5px" },
    },
    "& .MuiInputLabel-root": { fontFamily: F.sans, fontSize: 13.5 },
    "& .MuiInputLabel-root.Mui-focused": { color: C.brand },
  },
  delaySx: {
    width: 120,
    "& .MuiOutlinedInput-root": {
      borderRadius: "7px", fontFamily: F.mono, fontSize: 13,
      "& fieldset": { borderColor: C.line },
      "&.Mui-focused fieldset": { borderColor: C.brand },
    },
  },

  // primary action button
  primaryBtn: (full = false, disabled = false) => ({
    ...(full ? { width: "100%" } : {}),
    justifyContent: "center", gap: 8, fontSize: 13.5,
    opacity: disabled ? 0.5 : 1,
    cursor:  disabled ? "not-allowed" : "pointer",
  }),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeProgress(p) {
  const current = Number(p?.current) || 0;
  const total   = Number(p?.total)   || 0;
  if (total <= 0) return { current: 0, total: 0 };
  return { current: Math.min(current, total), total };
}

function normalizeSessions(sessions) {
  if (!Array.isArray(sessions)) return [];
  return sessions.map((s) => ({
    id:                  s?.id || "",
    label:               s?.label || s?.id || "Akun WhatsApp",
    isActive:            !!s?.isActive,
    runtimeReady:        !!s?.runtimeReady,
    runtimeInitializing: !!s?.runtimeInitializing,
    runtimeHasQr:        !!s?.runtimeHasQr,
    lastKnownNumber:     s?.lastKnownNumber  || "",
    lastKnownName:       s?.lastKnownName    || "",
    lastKnownPlatform:   s?.lastKnownPlatform || "",
  }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function QRDialog({ waQr, waQrAt, whatsappReady, formatSyncTime, onClose }) {
  const open = !whatsappReady && !!waQr;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: "16px", fontFamily: F.sans, overflow: "hidden" } }}>
      <DialogTitle sx={{ fontFamily: F.sans, fontWeight: 700, fontSize: 15, color: C.ink, pb: 0.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <QrCode2RoundedIcon style={{ fontSize: 18, color: C.brand }} />
          Scan QR Code
        </div>
        <IconButton size="small" onClick={onClose} sx={{ color: C.subtle }}>
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 1, pb: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <p style={{ fontFamily: F.sans, fontSize: 12, color: C.brand, margin: 0, textAlign: "center" }}>
          WhatsApp → Perangkat Tertaut → Tautkan Perangkat
        </p>
        <div style={{ padding: 10, borderRadius: 12, background: C.white, border: `1.5px solid ${C.brandBorder}`, boxShadow: `0 4px 16px rgba(35,57,113,0.10)` }}>
          <QRCodeSVG value={waQr} size={200} bgColor="#ffffff" fgColor="#0c111b" level="M" />
        </div>
        {waQrAt && <p style={{ ...S.mono(11), margin: 0 }}>{formatSyncTime(waQrAt)}</p>}
        <p style={{ fontFamily: F.sans, fontSize: 12, color: C.muted, textAlign: "center", maxWidth: 240, lineHeight: 1.7, margin: 0 }}>
          QR berlaku beberapa menit. Klik <strong style={{ color: C.brand }}>Hubungkan</strong> lagi jika expired.
        </p>
      </DialogContent>
    </Dialog>
  );
}

function DataRow({ label, value, mono = false, last = false }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: last ? "none" : `1px solid ${C.line}`, gap: 8 }}>
      <span style={{ fontFamily: F.sans, fontSize: 12.5, color: C.subtle, flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: mono ? F.mono : F.sans, fontSize: mono ? 11.5 : 12.5, fontWeight: 500, color: "#1c2433", textAlign: "right", wordBreak: "break-all" }}>
        {value || "—"}
      </span>
    </div>
  );
}

function WaStatusBadge({ whatsappReady, waInitializing, label }) {
  const bg    = whatsappReady ? "rgba(22,163,74,0.12)"  : waInitializing ? "rgba(217,119,6,0.12)"  : "rgba(220,38,38,0.12)";
  const color = whatsappReady ? "#16a34a"               : waInitializing ? "#d97706"               : "#dc2626";
  return <span className="dashboard-card__state" style={{ background: bg, color, fontSize: 11 }}>{label}</span>;
}

function SendSummaryBadges({ summary }) {
  if (!summary) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <span className="users-table__status users-table__status--app    users-table__status--inline">Total {summary.total   || 0}</span>
      <span className="users-table__status users-table__status--active users-table__status--inline">Berhasil {summary.success || 0}</span>
      <span className="users-table__status users-table__status--inactive users-table__status--inline">Gagal {summary.failed  || 0}</span>
    </div>
  );
}


// ─── Main component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [customers,            setCustomers]            = useState([]);
  const [logs,                 setLogs]                 = useState([]);
  const [delay,                setDelay]                = useState(4000);
  const [progress,             setProgress]             = useState({ current: 0, total: 0 });
  const [fileInfo,             setFileInfo]             = useState(null);
  const [template,             setTemplate]             = useState("");
  const [gsheetUrl,            setGsheetUrl]            = useState("");
  const [whatsappReady,        setWhatsappReady]        = useState(false);
  const [checkingWhatsapp,     setCheckingWhatsapp]     = useState(false);
  const [sending,              setSending]              = useState(false);
  const [sheetNames,           setSheetNames]           = useState([]);
  const [selectedSheet,        setSelectedSheet]        = useState("");
  const [autoSync,             setAutoSync]             = useState(false);
  const [lastSyncAt,           setLastSyncAt]           = useState(null);
  const [sourceMode,           setSourceMode]           = useState("manual");
  const [loadingSheets,        setLoadingSheets]        = useState(false);
  const [syncingSheet,         setSyncingSheet]         = useState(false);
  const [savingGsheet,         setSavingGsheet]         = useState(false);
  const [loadingAutoCustomers, setLoadingAutoCustomers] = useState(false);
  const [lastSendSummary,      setLastSendSummary]      = useState(null);
  const [lastSendResults,      setLastSendResults]      = useState([]);
  const [pdfLogRows,           setPdfLogRows]           = useState([]);
  const [waQr,                 setWaQr]                 = useState("");
  const [waQrAt,               setWaQrAt]               = useState(null);
  const [waInitializing,       setWaInitializing]       = useState(false);
  const [waSessions,           setWaSessions]           = useState([]);
  const [activeWaSessionId,    setActiveWaSessionId]    = useState("");
  const [pendingWaSessionId,   setPendingWaSessionId]   = useState("");
  const [waAccount,            setWaAccount]            = useState({ name: "", number: "", wid: "", platform: "" });
  const [alert,                setAlert]                = useState({ open: false, message: "", severity: "info" });
  const [qrOpen,               setQrOpen]               = useState(false);
  const lastWhatsappLogRef = useRef("");

  // Load font
  useEffect(() => {
    if (typeof document === "undefined" || document.getElementById("pjs-font")) return;
    const link = Object.assign(document.createElement("link"), {
      id: "pjs-font", rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;500&display=swap",
    });
    document.head.appendChild(link);
  }, []);

  // Utilities
  const showToast = (msg, sev = "success") => setAlert({ open: true, message: msg, severity: sev });
  const addLog    = (type, message) => setLogs((prev) => [{ type, message, time: new Date().toISOString() }, ...prev]);

  const addWhatsappLogOnce = (key, type, message) => {
    if (lastWhatsappLogRef.current === key) return;
    lastWhatsappLogRef.current = key;
    addLog(type, message);
  };

  const formatSyncTime = (v) => {
    if (!v) return "-";
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? v : d.toLocaleString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  // WA state helpers
  const applyWhatsappState = (data = {}, options = {}) => {
    const sessions            = normalizeSessions(data?.sessions);
    const nextActiveId        = data?.activeSessionId || sessions.find((s) => s.isActive)?.id || "";
    const nextActiveExists    = sessions.some((s) => s.id === nextActiveId);

    setWhatsappReady(!!data.whatsappReady);
    setWaQr(data?.qr || "");
    setWaQrAt(data?.meta?.lastQrAt || null);
    setWaInitializing(!!data?.meta?.initializing && !data?.whatsappReady);
    setWaSessions(sessions);
    if (!options.preserveActiveSelection || nextActiveExists) setActiveWaSessionId(nextActiveId);
    if (nextActiveExists && pendingWaSessionId === nextActiveId) setPendingWaSessionId("");
    setWaAccount({ name: data?.account?.name || "", number: data?.account?.number || "", wid: data?.account?.wid || "", platform: data?.account?.platform || "" });
  };

  // WA session sync
  const syncWhatsappSession = async ({ showToastMessage = false, sessionId = activeWaSessionId, createNew = false } = {}) => {
    try {
      setWaInitializing(true);
      const { data } = await api.post("/init-whatsapp", { sessionId: createNew ? "" : sessionId, createNew });

      applyWhatsappState(data, { preserveActiveSelection: createNew });
      if (createNew && data?.activeSessionId) setPendingWaSessionId(data.activeSessionId);
      if (data.whatsappReady) { if (showToastMessage) showToast(data.message || "WhatsApp terhubung", "success"); return true; }

      if (!data.qr) {
        const targetId = data?.activeSessionId || sessionId || "";
        for (let i = 0; i < 8; i += 1) {
          await new Promise((r) => window.setTimeout(r, 1000));
          const { data: sd } = await api.post("/check-whatsapp", { sessionId: targetId });
          applyWhatsappState(sd, { preserveActiveSelection: createNew });
          if (sd.whatsappReady) { if (showToastMessage) showToast(sd.message || "WhatsApp terhubung", "success"); setPendingWaSessionId(""); return true; }
          if (sd.qr) break;
        }
      }
      if (showToastMessage) showToast(data.message || "Silakan scan QR code.", "warning");
      return false;
    } catch (err) {
      const m = err?.response?.data?.message || "Gagal konek WhatsApp";
      setWhatsappReady(false); setWaInitializing(false); setWaQr("");
      if (createNew) setPendingWaSessionId("");
      if (showToastMessage) showToast(m, "error");
      addLog("error", m);
      return false;
    }
  };

  const checkWhatsappStatus = async (showMsg = false, sessionId = activeWaSessionId) => {
    try {
      setCheckingWhatsapp(true);
      const { data } = await api.post("/check-whatsapp", { sessionId });
      applyWhatsappState(data);
      setSending(!!data?.isSending);
      if (data?.whatsappReady)  { addWhatsappLogOnce("wa-ready",     "success", "WhatsApp siap digunakan");  if (showMsg) showToast("WhatsApp sudah login", "success"); }
      else if (data?.needScan)  { addWhatsappLogOnce("wa-need-scan", "info",    "Silakan scan QR WhatsApp"); if (showMsg) showToast("Silakan scan QR WhatsApp", "warning"); }
      else if (showMsg)           showToast("WhatsApp belum siap", "warning");
      return !!data?.whatsappReady;
    } catch (err) {
      const m = err?.response?.data?.message || "Gagal cek status WhatsApp";
      setWhatsappReady(false);
      addWhatsappLogOnce(`wa-error-${m}`, "error", m);
      if (showMsg) showToast(m, "error");
      return false;
    } finally { setCheckingWhatsapp(false); }
  };

  // GSheet
  const fetchSheetNames = async (showMsg = false) => {
    try {
      setLoadingSheets(true);
      const { data } = await api.get("/gsheet/sheets");
      const sheets   = Array.isArray(data.sheets) ? data.sheets : [];
      setSheetNames(sheets);
      setSelectedSheet(data.selectedSheet || sheets[0] || "");
      setAutoSync(!!data.autoSync);
      if (showMsg) showToast(sheets.length ? `${sheets.length} sheet dimuat` : "Tidak ada sheet", sheets.length ? "success" : "warning");
      return sheets;
    } catch (err) {
      const m = err?.response?.data?.message || "Gagal mengambil daftar sheet";
      if (showMsg) showToast(m, "error");
      addLog("error", m);
      return [];
    } finally { setLoadingSheets(false); }
  };

  const loadCustomersFromGSheet = async (sheetName, showMsg = true, silentLog = false) => {
    try {
      setSyncingSheet(true);
      const { data } = await api.post("/gsheet/sync", { selectedSheet: sheetName || selectedSheet || "" });
      const synced   = Array.isArray(data.data) ? data.data : [];
      setCustomers(synced);
      setSelectedSheet(data.selectedSheet || sheetName || "");
      setSheetNames(Array.isArray(data.sheets) ? data.sheets : []);
      setAutoSync(!!data.autoSync);
      setLastSyncAt(data.lastSyncAt || null);
      setSourceMode("gsheet");
      setFileInfo({ fileName: `Google Sheet — ${data.selectedSheet || "-"}`, message: data.message || `${synced.length} pelanggan dimuat` });
      if (!silentLog) addLog("success", data.message || `Sync ${synced.length} pelanggan`);
      if (showMsg) showToast(data.message || `Sync ${synced.length} pelanggan berhasil`, "success");
      return synced;
    } catch (err) {
      const m = err?.response?.data?.message || "Gagal sync Google Sheet";
      addLog("error", m);
      if (showMsg) showToast(m, "error");
      return [];
    } finally { setSyncingSheet(false); }
  };

  const handleSaveGsheetConfig = async ({ url = gsheetUrl, selected = selectedSheet, auto = autoSync, showSuccess = true } = {}) => {
    try {
      setSavingGsheet(true);
      const { data } = await api.post("/gsheet", { url, selectedSheet: selected || "", autoSync: !!auto });
      setGsheetUrl(url); setSelectedSheet(selected || ""); setAutoSync(!!auto);
      if (showSuccess) showToast(data?.message || "Konfigurasi tersimpan", "success");
      addLog("success", "Konfigurasi Google Sheet tersimpan");
      return true;
    } catch (err) {
      const m = err?.response?.data?.message || "Gagal simpan konfigurasi";
      addLog("error", m); showToast(m, "error");
      return false;
    } finally { setSavingGsheet(false); }
  };

  const handleSelectSheet = async (val) => {
    try {
      setSelectedSheet(val);
      const { data } = await api.post("/gsheet/select-sheet", { selectedSheet: val });
      setSheetNames(Array.isArray(data.sheets) ? data.sheets : []);
      showToast(data.message || "Sheet dipilih", "success");
      addLog("success", `Sheet: ${val}`);
    } catch (err) {
      const m = err?.response?.data?.message || "Gagal memilih sheet";
      addLog("error", m); showToast(m, "error");
    }
  };

  const handleSyncGSheet = async () => {
    if (!gsheetUrl)                                  { showToast("URL Google Sheet belum diisi", "warning"); return; }
    if (!selectedSheet && sheetNames.length > 0)     { showToast("Pilih sheet terlebih dahulu", "warning"); return; }
    await loadCustomersFromGSheet(selectedSheet, true, false);
  };

  const handleToggleAutoSync = async (checked) => {
    const ok = await handleSaveGsheetConfig({ url: gsheetUrl, selected: selectedSheet, auto: checked, showSuccess: true });
    if (ok) setAutoSync(checked);
  };

  // PDF
  const loadCustomersFromPdf = async (showMsg = false) => {
    try {
      const { data } = await api.get("/pdf/log");
      const rows     = Array.isArray(data?.rows) ? data.rows : [];
      const valid    = rows.filter((r) => r.nomor && r.nomor !== "TIDAK DITEMUKAN").map((r) => ({ nama: r.nama, nomor: r.nomor }));
      setPdfLogRows(rows);
      setCustomers(valid);
      setSourceMode("pdf");
      setFileInfo({ fileName: `Hasil PDF — ${valid.length} pelanggan`, message: `${valid.length} dari ${rows.length} siap kirim` });
      if (showMsg) showToast(`${valid.length} pelanggan dari Hasil PDF dimuat`, "success");
      addLog("success", `${valid.length} pelanggan dari Hasil PDF`);
      return valid;
    } catch {
      if (showMsg) showToast("Gagal muat data dari Hasil PDF", "error");
      return [];
    }
  };

  // Upload Excel
  const handleUpload = async (file) => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/upload-excel", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setCustomers(data?.data || []);
      setSourceMode("manual");
      setFileInfo({ fileName: data?.fileName, message: data?.message });
      addLog("success", data?.message || "Upload berhasil");
      showToast(data?.message || "Upload berhasil", "success");
    } catch (err) {
      const m = err?.response?.data?.message || "Upload gagal";
      addLog("error", m); showToast(m, "error");
    }
  };

  // WA handlers
  const handleInitWhatsapp = async () => {
    addLog("info", "Menghubungkan WhatsApp...");
    const ready = await syncWhatsappSession({ showToastMessage: true, sessionId: activeWaSessionId, createNew: !activeWaSessionId });
    addLog("info", ready ? "Session aktif" : "Menunggu scan QR");
  };

  const handleAddWhatsappAccount = async () => {
    addLog("info", "Menyiapkan akun WhatsApp baru...");
    const ready = await syncWhatsappSession({ showToastMessage: true, createNew: true });
    addLog("info", ready ? "Akun baru aktif" : "QR akun baru siap discan");
  };

  const handleSelectWhatsappSession = async (sessionId) => {
    setActiveWaSessionId(sessionId);
    const session = waSessions.find((item) => item.id === sessionId);
    setWaAccount({ name: session?.lastKnownName || "", number: session?.lastKnownNumber || "", wid: "", platform: session?.lastKnownPlatform || "" });
    addLog("info", `Memilih akun ${session?.label || sessionId}`);
    try {
      setWaInitializing(true);
      const { data } = await api.post("/select-whatsapp-session", { sessionId });
      applyWhatsappState(data);
      addLog(data?.whatsappReady ? "success" : "info", data?.message || "Akun WhatsApp dipilih");
    } catch (err) {
      const m = err?.response?.data?.message || "Gagal memilih akun WhatsApp";
      setWhatsappReady(false); setWaInitializing(false); setWaQr("");
      addLog("error", m); showToast(m, "error");
    }
  };

  const handleDeleteWhatsappSession = async () => {
    if (!activeWaSessionId) { showToast("Pilih akun WhatsApp dulu", "warning"); return; }
    const session  = waSessions.find((s) => s.id === activeWaSessionId) || null;
    const label    = session?.lastKnownName || session?.label || activeWaSessionId;
    if (!window.confirm(`Hapus sesi WhatsApp ${label}?`)) return;
    try {
      const { data } = await api.post("/delete-whatsapp-session", { sessionId: activeWaSessionId });
      applyWhatsappState(data);
      showToast(data.message || "Sesi berhasil dihapus", "success");
      addLog("success", data.message || `Sesi ${label} dihapus`);
    } catch (err) {
      const m = err?.response?.data?.message || "Gagal menghapus sesi WhatsApp";
      addLog("error", m); showToast(m, "error");
    }
  };

  const handleSend = async () => {
    if (sending)                return;
    if (!activeWaSessionId)     { showToast("Pilih akun WhatsApp dulu", "warning"); return; }
    if (!customers.length)      { showToast("Data pelanggan kosong", "error");       return; }
    if (Number(delay) < 3000)   { showToast("Delay minimal 3000 ms", "warning");    return; }
    try {
      setSending(true); setLastSendSummary(null); setLastSendResults([]);
      setProgress({ current: 0, total: customers.length });
      const ready = await checkWhatsappStatus(false);
      if (!ready) { setSending(false); showToast("WhatsApp belum siap. Hubungkan dan scan QR dulu.", "warning"); return; }
      addLog("info", `Mulai kirim ke ${customers.length} pelanggan...`);
      const { data } = await api.post("/send-messages", { customers, delay: Number(delay), sessionId: activeWaSessionId });
      if (data.background) {
        addLog("success", data.message || "Pengiriman berjalan di background");
        showToast(data.message || "Pengiriman berjalan di background", "success");
      } else {
        const s = data.summary || { success: 0, failed: 0 };
        setSending(false); setLastSendSummary(s);
        const msg = `Selesai — Berhasil: ${s.success}, Gagal: ${s.failed}`;
        addLog("success", msg); showToast(msg, "success");
      }
    } catch (err) {
      const m = err?.response?.data?.message || "Gagal kirim pesan";
      setSending(false); addLog("error", m); showToast(m, "error");
    }
  };

  const fetchSendResults = async (showFinishToast = false) => {
    try {
      const { data } = await api.get("/send-results");
      setSending(!!data.isSending);
      setLastSendSummary(data.summary || null);
      setLastSendResults(Array.isArray(data.results) ? data.results : []);
      setProgress(data.isSending ? normalizeProgress(data.progress) : { current: 0, total: 0 });
      if (!data.isSending && data.summary && showFinishToast) {
        showToast(`Selesai — Berhasil: ${data.summary.success || 0}, Gagal: ${data.summary.failed || 0}`, "success");
      }
      return data;
    } catch { return null; }
  };

  // Init + socket listeners
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [tplRes, gsRes, stRes] = await Promise.allSettled([
          api.get("/template"), api.get("/gsheet"), api.get("/status"),
        ]);

        if (tplRes.status === "fulfilled") setTemplate(tplRes.value?.data?.template || "");
        else addLog("error", tplRes.reason?.response?.data?.message || "Gagal load template");

        let gs = {};
        if (gsRes.status === "fulfilled") {
          gs = gsRes.value?.data || {};
          setGsheetUrl(gs?.url || ""); setSelectedSheet(gs?.selectedSheet || "");
          setAutoSync(!!gs?.autoSync); setLastSyncAt(gs?.lastSyncAt || null);
        } else addLog("error", gsRes.reason?.response?.data?.message || "Gagal load konfigurasi GSheet");

        if (stRes.status === "fulfilled") {
          const sd = stRes.value?.data || {};
          applyWhatsappState(sd);
          setSending(!!sd.isSending);
          setLastSendSummary(sd.lastSendSummary || null);
          setLastSendResults(Array.isArray(sd.lastSendResults) ? sd.lastSendResults : []);
          setProgress(sd.isSending ? normalizeProgress(sd.progress) : { current: 0, total: 0 });
          if (!sd.whatsappReady && sd.activeSessionId && !sd.qr && !sd.meta?.initializing) {
            await syncWhatsappSession({ sessionId: sd.activeSessionId || "", createNew: false });
          }
        } else addLog("error", stRes.reason?.response?.data?.message || "Gagal load status WhatsApp");

        await loadCustomersFromPdf(false);

        if (gs?.url) {
          const sheets = await fetchSheetNames(false);
          if (gs?.autoSync && sheets.length > 0) {
            setLoadingAutoCustomers(true);
            const target = gs?.selectedSheet || sheets[0] || "";
            await loadCustomersFromGSheet(target, false, true);
            addLog("success", `Auto sync — ${target || "sheet aktif"}`);
          }
        }
      } catch (err) {
        const m = err?.response?.data?.message || err?.message || "Gagal load data awal";
        addLog("error", m); showToast(m, "error");
      } finally { setLoadingAutoCustomers(false); }
    };

    fetchInitial();
    fetchSendResults(false);

    const onProgress        = (d) => { setSending(true); setProgress({ current: d.current || 0, total: d.total || 0 }); };
    const onLog             = (d) => setLogs((p) => [d, ...p]);
    const onFinished        = (d) => {
      const summary = d?.summary || null;
      setSending(false); setLastSendSummary(summary); setLastSendResults(Array.isArray(d?.results) ? d.results : []);
      if (summary) {
        setProgress({ current: summary.total || 0, total: summary.total || 0 });
        const msg = `Selesai — Berhasil: ${summary.success || 0}, Gagal: ${summary.failed || 0}`;
        addLog(d?.success === false ? "error" : "success", msg);
        showToast(msg, d?.success === false ? "error" : "success");
      } else { setProgress({ current: 0, total: 0 }); }
    };
    const onWaQr            = (d) => {
      if (d?.sessionId) setActiveWaSessionId(d.sessionId);
      setWaQr(d?.qr || ""); setWaQrAt(d?.time || null); setWhatsappReady(false); setWaInitializing(false);
      setQrOpen(true);
      if (!d?.isRefresh) { lastWhatsappLogRef.current = "wa-qr"; addLog("info", "QR diterima — silakan scan"); }
    };
    const onWaAuthenticated = (d) => {
      setWaQr(""); setWaInitializing(true); lastWhatsappLogRef.current = "wa-authenticated";
      addLog("info", "QR discan, menyinkronkan WhatsApp...");
      window.setTimeout(() => { checkWhatsappStatus(false, d?.sessionId || ""); }, 1200);
    };
    const onWaReady = async (d) => {
      if (d?.sessionId) setActiveWaSessionId(d.sessionId);
      setPendingWaSessionId(""); setWhatsappReady(true); setWaQr(""); setWaInitializing(false);
      lastWhatsappLogRef.current = "wa-ready";
      addLog("success", "WhatsApp siap digunakan");
      showToast("WhatsApp siap digunakan", "success");
      await checkWhatsappStatus(false, d?.sessionId || "");
    };

    if (socket?.on) {
      socket.on("send-progress",    onProgress);
      socket.on("send-log",         onLog);
      socket.on("send-finished",    onFinished);
      socket.on("wa-qr",            onWaQr);
      socket.on("wa-authenticated", onWaAuthenticated);
      socket.on("wa-ready",         onWaReady);
    }
    return () => {
      if (socket?.off) {
        socket.off("send-progress",    onProgress);
        socket.off("send-log",         onLog);
        socket.off("send-finished",    onFinished);
        socket.off("wa-qr",            onWaQr);
        socket.off("wa-authenticated", onWaAuthenticated);
        socket.off("wa-ready",         onWaReady);
      }
    };
  }, []);

  useEffect(() => {
    if (whatsappReady || (!waInitializing && !waQr)) return;
    const timer = window.setInterval(() => checkWhatsappStatus(false, pendingWaSessionId || activeWaSessionId), 5000);
    return () => window.clearInterval(timer);
  }, [whatsappReady, waInitializing, waQr, activeWaSessionId, pendingWaSessionId]);

  // Derived values
  const selectedWaSession = waSessions.find((s) => s.id === activeWaSessionId) || null;
  const percent           = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const waLabel           = whatsappReady ? "Terhubung" : waInitializing ? "Menyiapkan..." : "Belum login";
  const sendDisabled      = !whatsappReady || !customers.length || sending;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>

      {/* ── Stat Cards ─────────────────────────────────────────────────── */}
      <Grid container spacing={1.5} alignItems="stretch" sx={{ mb: 2 }}>

        <Grid item xs={6} sm={3} sx={{ display: "flex" }}>
          <CardBox
            style={{ height: "100%", width: "100%" }}
            eyebrow="Pelanggan Dimuat"
            value={customers.length.toLocaleString()}
            detail={
              sourceMode === "pdf"    ? `Hasil PDF — ${pdfLogRows.length} total` :
              sourceMode === "gsheet" ? `Google Sheet — ${selectedSheet || "-"}` :
              fileInfo?.fileName || "Belum ada data"
            }
          />
        </Grid>

        <Grid item xs={6} sm={3} sx={{ display: "flex" }}>
          <CardBox
            style={{ height: "100%", width: "100%" }}
            eyebrow="Status WhatsApp"
            value={waLabel}
            detail={waAccount.number || selectedWaSession?.lastKnownNumber || activeWaSessionId || "Belum terhubung"}
            state={waLabel}
            stateVariant={whatsappReady ? undefined : "disabled"}
          />
        </Grid>

        <Grid item xs={6} sm={3} sx={{ display: "flex" }}>
          <CardBox
            style={{ height: "100%", width: "100%" }}
            eyebrow="Template Pesan"
            value={template?.trim() ? "Siap Kirim" : "Belum Diatur"}
            detail={template?.trim() ? `${template.trim().split("\n").length} baris pesan` : "Buka menu Pengaturan"}
          />
        </Grid>

        <Grid item xs={6} sm={3} sx={{ display: "flex" }}>
          <CardBox
            style={{ height: "100%", width: "100%" }}
            eyebrow="Sesi WA Tersimpan"
            value={`${waSessions.length} Akun`}
            detail={activeWaSessionId ? (selectedWaSession?.lastKnownName || selectedWaSession?.label || activeWaSessionId) : "Belum ada sesi aktif"}
          />
        </Grid>

      </Grid>

      {/* ── Main Grid ──────────────────────────────────────────────────── */}
      <Grid container spacing={2} alignItems="stretch">

        {/* Col 1 — Pelanggan PDF */}
        <Grid item xs={12} md={4} sx={{ display: "flex" }}>
          <CardBigBox
            style={{ height: "100%", width: "100%" }}
            title="Pelanggan dari PDF"
            headerAction={
              <CreateButton variant="detail" onClick={() => loadCustomersFromPdf(true)}>
                <SyncRoundedIcon style={{ fontSize: 13, marginRight: 4 }} />Refresh
              </CreateButton>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, gap: 10 }}>
              <div style={S.rowBetween}>
                <span style={S.label(12)}>{customers.length} siap kirim</span>
                <span className="master-project-badge master-project-badge--active" style={{ fontFamily: F.mono, fontSize: 11 }}>
                  {pdfLogRows.length} total PDF
                </span>
              </div>
            <div style={S.listScroll}>
              {customers.length === 0 ? (
                <div style={{ padding: "20px 16px", textAlign: "center" }}>
                  <p style={{ fontFamily: F.sans, fontSize: 12, color: C.subtle, lineHeight: 1.7, margin: 0 }}>
                    Belum ada data.<br />Klik <strong>Refresh</strong> untuk muat dari Hasil PDF.
                  </p>
                </div>
              ) : customers.map((c, i) => (
                <div key={i} style={S.custRow(i % 2 === 0)}>
                  <span style={{ fontFamily: F.sans, fontSize: 11.5, fontWeight: 600, color: C.ink, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nama}</span>
                  <span style={S.mono(10)}>{c.nomor}</span>
                </div>
              ))}
            </div>
            </div>
          </CardBigBox>
        </Grid>

        {/* Col 2 — WhatsApp Control */}
        <Grid item xs={12} md={4} sx={{ display: "flex" }}>
          <CardBigBox
            style={{ height: "100%", width: "100%" }}
            eyebrow="Kontrol"
            title="Pengiriman WhatsApp"
            headerAction={<WaStatusBadge whatsappReady={whatsappReady} waInitializing={waInitializing} label={waLabel} />}
          >
            <div style={S.stack}>

              <FormControl fullWidth size="small" sx={S.fieldSx}>
                <InputLabel>Akun WhatsApp</InputLabel>
                <Select value={activeWaSessionId} label="Akun WhatsApp" onChange={(e) => handleSelectWhatsappSession(e.target.value)}>
                  {waSessions.length === 0
                    ? <MenuItem value="" disabled>Belum ada akun tersimpan</MenuItem>
                    : waSessions.map((s) => <MenuItem key={s.id} value={s.id} sx={{ fontFamily: F.sans, fontSize: 13.5 }}>{s.label}</MenuItem>)
                  }
                </Select>
              </FormControl>

              <div style={S.infoBox}>
                <DataRow label="Nama akun"  value={waAccount.name || selectedWaSession?.lastKnownName || selectedWaSession?.label} />
                <DataRow label="Nomor WA"   value={waAccount.number || selectedWaSession?.lastKnownNumber} mono />
                <DataRow label="Session ID" value={activeWaSessionId || "Belum dipilih"} mono last />
              </div>

              {!whatsappReady && !waQr && (
                <div style={S.warnBox}>
                  <p style={{ fontFamily: F.sans, fontSize: 12.5, color: C.amber, lineHeight: 1.7, margin: 0 }}>
                    {waInitializing ? "Menyiapkan koneksi WhatsApp..." : "Pilih akun lalu klik Hubungkan, atau tambah akun baru."}
                  </p>
                </div>
              )}

              {waQr && !whatsappReady && (
                <div style={{ padding: "8px 12px", borderRadius: 8, background: C.brandBg, border: `1.5px solid ${C.brandBorder}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <QrCode2RoundedIcon style={{ fontSize: 15, color: C.brand }} />
                    <span style={{ fontFamily: F.sans, fontSize: 12.5, fontWeight: 600, color: C.ink }}>QR Code siap discan</span>
                  </div>
                  <CreateButton variant="detail" onClick={() => setQrOpen(true)} style={{ paddingInline: 12, fontSize: 12, gap: 6 }}>
                    <QrCode2RoundedIcon style={{ fontSize: 13 }} /> Buka QR
                  </CreateButton>
                </div>
              )}

              <div style={S.delayRow}>
                <AccessTimeRoundedIcon style={{ fontSize: 16, color: C.muted, flexShrink: 0 }} />
                <span style={{ fontFamily: F.sans, fontSize: 13, color: C.text, flex: 1, fontWeight: 500 }}>Jeda antar pesan</span>
                <TextField
                  type="number" value={delay} size="small"
                  onChange={(e) => setDelay(e.target.value)}
                  InputProps={{ endAdornment: <InputAdornment position="end"><Typography sx={{ fontFamily: F.mono, fontSize: 12, color: C.subtle }}>ms</Typography></InputAdornment> }}
                  sx={S.delaySx}
                />
              </div>

              <div style={S.stack}>
                <button className="users-table-card__action" style={S.primaryBtn(true)} onClick={handleInitWhatsapp}>
                  <WhatsAppIcon style={{ fontSize: 16 }} />
                  {whatsappReady ? "WhatsApp Terhubung ✓" : waInitializing ? "Menyiapkan..." : "Hubungkan WhatsApp"}
                </button>
                <div style={S.col12}>
                  <CreateButton variant="accordion" onClick={handleAddWhatsappAccount} disabled={sending} style={{ justifyContent: "center", gap: 6 }}>
                    <AddRoundedIcon style={{ fontSize: 15 }} /> Tambah Akun
                  </CreateButton>
                  <CreateButton variant="accordion" tone="danger" onClick={handleDeleteWhatsappSession} disabled={!activeWaSessionId || sending || waInitializing} style={{ justifyContent: "center", gap: 6 }}>
                    <DeleteOutlineRoundedIcon style={{ fontSize: 15 }} /> Hapus Sesi
                  </CreateButton>
                </div>
                <div style={S.col12}>
                  <button className="users-table-card__action" onClick={handleSend} disabled={sendDisabled} style={S.primaryBtn(false, sendDisabled)}>
                    <SendRoundedIcon style={{ fontSize: 15 }} />{sending ? "Mengirim..." : "Kirim Pesan"}
                  </button>
                  <CreateButton variant="accordion" onClick={() => checkWhatsappStatus(true)} disabled={checkingWhatsapp || sending} style={{ justifyContent: "center", gap: 6 }}>
                    <WifiRoundedIcon style={{ fontSize: 15 }} />{checkingWhatsapp ? "Mengecek..." : "Cek Status"}
                  </CreateButton>
                </div>
              </div>

              <div style={S.counterBox(customers.length > 0)}>
                <span style={S.label(12.5)}>Data siap kirim</span>
                <span style={S.counterVal(customers.length > 0)}>{customers.length.toLocaleString()} pelanggan</span>
              </div>

              {(progress.total > 0 || loadingAutoCustomers || sending) && (
                <div style={S.progressBox}>
                  <div style={{ ...S.rowBetween, marginBottom: 10 }}>
                    <span style={{ fontFamily: F.sans, fontSize: 12.5, fontWeight: 500, color: C.brand }}>
                      {loadingAutoCustomers ? "Memuat auto sync..." : sending ? "Mengirim pesan..." : "Progress pengiriman"}
                    </span>
                    {!loadingAutoCustomers && (
                      <div style={S.row}>
                        <span style={S.mono(11.5)}>{progress.current}/{progress.total}</span>
                        <span style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 600, padding: "2px 6px", borderRadius: 5, background: C.white, color: C.brand, border: `1px solid ${C.brandBorder}` }}>
                          {percent}%
                        </span>
                      </div>
                    )}
                  </div>
                  <LinearProgress
                    variant={loadingAutoCustomers ? "indeterminate" : "determinate"}
                    value={loadingAutoCustomers ? undefined : percent}
                    sx={{ height: 4, borderRadius: 999, bgcolor: C.white, "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: C.brand } }}
                  />
                </div>
              )}

              {lastSendSummary && (
                <div style={S.summaryBox}>
                  <p style={S.eyebrow}>Hasil terakhir</p>
                  <SendSummaryBadges summary={lastSendSummary} />
                </div>
              )}

            </div>
          </CardBigBox>
        </Grid>

        {/* Col 3 — Activity Log */}
        <Grid item xs={12} md={4} sx={{ display: "flex" }}>
          <CardBigBox
            style={{ width: "100%" }}
            title="Activity Log"
            headerAction={
              <span className="users-table__status users-table__status--active users-table__status--inline" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <SignalCellularAltRoundedIcon style={{ fontSize: 11 }} /> Live
              </span>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {lastSendSummary && (
                <div style={S.summaryBox}>
                  <p style={S.eyebrow}>Hasil Terakhir</p>
                  <SendSummaryBadges summary={lastSendSummary} />
                </div>
              )}
              <div style={{ height: 380, overflowY: "auto", overflowX: "hidden", paddingRight: 2 }}>
                <LogsPanel logs={logs} />
              </div>
            </div>
          </CardBigBox>
        </Grid>

      </Grid>

      <QRDialog
        waQr={waQr} waQrAt={waQrAt} whatsappReady={whatsappReady}
        formatSyncTime={formatSyncTime} onClose={() => setQrOpen(false)}
      />

      <AlertModal
        open={alert.open}
        severity={alert.severity}
        message={alert.message}
        onClose={() => setAlert((p) => ({ ...p, open: false }))}
      />
    </div>
  );
}
