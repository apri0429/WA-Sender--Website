import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Snackbar,
  Tooltip,
  Typography,
} from "@mui/material";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import OpenInNewRoundedIcon     from "@mui/icons-material/OpenInNewRounded";
import CloudDoneRoundedIcon     from "@mui/icons-material/CloudDoneRounded";
import SendRoundedIcon          from "@mui/icons-material/SendRounded";
import SyncRoundedIcon          from "@mui/icons-material/SyncRounded";
import ChevronLeftRoundedIcon   from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon  from "@mui/icons-material/ChevronRightRounded";
import WhatsAppIcon             from "@mui/icons-material/WhatsApp";
import ErrorOutlineRoundedIcon  from "@mui/icons-material/ErrorOutlineRounded";
import api    from "../services/api";
import socket from "../services/socket";
import CreateButton from "../components/button/CreateButton";

const FONT_SANS = "'Plus Jakarta Sans', 'Inter', sans-serif";
const FONT_MONO = "'JetBrains Mono', 'Fira Code', monospace";

const T = {
  brand:       "#233971",
  brandDark:   "#163a6b",
  brandLight:  "#eaeff7",
  brandBorder: "#b3c1d8",
  green:       "#166534",
  greenLight:  "#dcfce7",
  greenBorder: "#86efac",
  ink:         "#163a6b",
  text:        "#374151",
  muted:       "#6b7280",
  subtle:      "#9ca3af",
  line:        "#e5e7eb",
  surface:     "#f9fafb",
  white:       "#ffffff",
  wa:          "#25d366",
  waBg:        "#f0fdf4",
  waBorder:    "#86efac",
};

const API_RAW = import.meta.env.DEV ? "http://192.168.1.254:8098" : "";

// ── Reusable native select ────────────────────────────────────────────────────
function NativeSelect({ value, onChange, children, style = {} }) {
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <select value={value} onChange={onChange}
        style={{ height: 32, paddingLeft: 10, paddingRight: 28, fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, color: T.ink, background: T.white, border: `1.5px solid ${T.brandBorder}`, borderRadius: 8, cursor: "pointer", outline: "none", appearance: "none", transition: "border-color 0.15s", ...style }}
        onFocus={e => e.target.style.borderColor = T.brand}
        onBlur={e => e.target.style.borderColor = T.brandBorder}>
        {children}
      </select>
      <span style={{ position: "absolute", right: 8, pointerEvents: "none", display: "flex", alignItems: "center" }}>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#233971" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </span>
    </div>
  );
}

// ── Action icon button ────────────────────────────────────────────────────────
function ActionBtn({ href, onClick, disabled, tooltip, icon, colorScheme = "brand" }) {
  const schemes = {
    brand: { base: { bg: T.white, color: T.brand, border: T.brandBorder }, hover: { bg: T.brandLight, border: T.brand } },
    wa:    { base: { bg: T.white, color: T.wa,    border: T.waBorder   }, hover: { bg: T.waBg,    border: T.wa    } },
    muted: { base: { bg: T.white, color: T.subtle, border: T.line      }, hover: { bg: T.surface,  border: T.subtle } },
  };
  const s = schemes[colorScheme] || schemes.brand;
  const btnStyle = {
    width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${s.base.border}`,
    background: s.base.bg, color: s.base.color, cursor: disabled ? "not-allowed" : "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.14s", opacity: disabled ? 0.4 : 1, flexShrink: 0,
  };
  const el = href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle, textDecoration: "none" }}
      onMouseEnter={e => { e.currentTarget.style.background = s.hover.bg; e.currentTarget.style.borderColor = s.hover.border; }}
      onMouseLeave={e => { e.currentTarget.style.background = s.base.bg; e.currentTarget.style.borderColor = s.base.border; }}>
      {icon}
    </a>
  ) : (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} style={btnStyle}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = s.hover.bg; e.currentTarget.style.borderColor = s.hover.border; }}}
      onMouseLeave={e => { e.currentTarget.style.background = s.base.bg; e.currentTarget.style.borderColor = s.base.border; }}>
      {icon}
    </button>
  );
  return tooltip ? <Tooltip title={tooltip}><span>{el}</span></Tooltip> : el;
}

export default function HasilPdfPage() {
  const [logRows,         setLogRows]         = useState([]);
  const [logGeneratedAt,  setLogGeneratedAt]  = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [waSending,       setWaSending]       = useState(false);
  const [waProgress,      setWaProgress]      = useState({ current: 0, total: 0, customer: "" });
  const [rowsPerPage,     setRowsPerPage]     = useState(25);
  const [page,            setPage]            = useState(0);
  const [wilayahFilter,   setWilayahFilter]   = useState("all");
  const [sendConfirm,     setSendConfirm]     = useState({ open: false, rows: [], mode: "single" });
  const [toast,           setToast]           = useState({ open: false, message: "", severity: "success" });
  const [waSessions,      setWaSessions]      = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const logRefreshTimerRef = useRef(null);

  const showToast = (message, severity = "success") => setToast({ open: true, message, severity });

  const fetchWaSessions = async () => {
    try {
      const res = await api.get("/status");
      const sessions = Array.isArray(res?.data?.sessions) ? res.data.sessions : [];
      setWaSessions(sessions);
      const active = res?.data?.activeSessionId || sessions.find((s) => s.runtimeReady)?.id || sessions[0]?.id || "";
      setSelectedSession((prev) => prev || active);
    } catch {}
  };

  const fetchLog = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get("/pdf/log");
      setLogRows(Array.isArray(res?.data?.rows) ? res.data.rows : []);
      setLogGeneratedAt(res?.data?.generatedAt || null);
    } catch {
      if (!silent) showToast("Gagal memuat log PDF", "error");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLog();
    fetchWaSessions();

    const scheduleLogRefresh = () => {
      if (logRefreshTimerRef.current) return;
      logRefreshTimerRef.current = setTimeout(async () => {
        logRefreshTimerRef.current = null;
        await fetchLog({ silent: true });
      }, 350);
    };

    const onWaProgress  = (d) => { setWaSending(true); setWaProgress({ current: d.current || 0, total: d.total || 0, customer: d.customer || "" }); };
    const onWaDone      = (d) => { setWaSending(false); const r = Array.isArray(d.results) ? d.results : []; const ok = r.filter(x => x.success).length; const fail = r.length - ok; showToast(`${ok} PDF terkirim${fail > 0 ? `, ${fail} gagal` : ""}`, fail > 0 ? "warning" : "success"); };
    const onWaError     = (d) => { setWaSending(false); showToast(d?.error || "Kirim PDF gagal", "error"); };
    const onWaReady     = (d) => { if (d?.sessionId) setSelectedSession((prev) => prev || d.sessionId); fetchWaSessions(); };

    if (socket?.on) {
      socket.on("pdf-wa-progress",  onWaProgress);
      socket.on("pdf-wa-done",      onWaDone);
      socket.on("pdf-wa-error",     onWaError);
      socket.on("pdf-progress",     scheduleLogRefresh);
      socket.on("pdf-log-updated",  scheduleLogRefresh);
      socket.on("pdf-done",         fetchLog);
      socket.on("wa-ready",         onWaReady);
    }
    return () => {
      if (logRefreshTimerRef.current) { clearTimeout(logRefreshTimerRef.current); logRefreshTimerRef.current = null; }
      if (socket?.off) {
        socket.off("pdf-wa-progress",  onWaProgress);
        socket.off("pdf-wa-done",      onWaDone);
        socket.off("pdf-wa-error",     onWaError);
        socket.off("pdf-progress",     scheduleLogRefresh);
        socket.off("pdf-log-updated",  scheduleLogRefresh);
        socket.off("pdf-done",         fetchLog);
        socket.off("wa-ready",         onWaReady);
      }
    };
  }, []);

  const handleSendViaWA = async (targetRows) => {
    if (!targetRows.length) return;
    if (!selectedSession) { showToast("Pilih akun WhatsApp terlebih dahulu", "warning"); return; }
    setWaSending(true);
    setWaProgress({ current: 0, total: targetRows.length, customer: "" });
    try {
      await api.post("/pdf/send-via-wa", { rows: targetRows, sessionId: selectedSession });
    } catch (err) {
      setWaSending(false);
      showToast(err?.response?.data?.message || "Gagal memulai pengiriman", "error");
    }
  };

  const openSendConfirm = (targetRows, mode = "single") => {
    const valid = targetRows.filter((r) => r.nomor && r.nomor !== "TIDAK DITEMUKAN");
    if (!valid.length) { showToast("Nomor WhatsApp tidak tersedia", "warning"); return; }
    setSendConfirm({ open: true, rows: valid, mode });
  };
  const closeSendConfirm = () => { if (waSending) return; setSendConfirm({ open: false, rows: [], mode: "single" }); };
  const confirmSend = async () => { const rows = sendConfirm.rows; closeSendConfirm(); await handleSendViaWA(rows); };

  const waPercent       = waProgress.total > 0 ? Math.round((waProgress.current / waProgress.total) * 100) : 0;
  const wilayahOptions  = Array.from(new Set(logRows.map((r) => String(r.wilayah || "").trim()).filter((v) => v && v !== "CEK"))).sort((a, b) => a.localeCompare(b, "id"));
  const filteredRows    = logRows.filter((r) => wilayahFilter === "all" || String(r.wilayah || "").trim() === wilayahFilter);
  const totalPages      = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const pagedRows       = filteredRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const sendableRows    = filteredRows.filter((r) => r.nomor && r.nomor !== "TIDAK DITEMUKAN");
  const activeSession   = waSessions.find((s) => s.id === selectedSession);

  useEffect(() => { if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1)); }, [page, totalPages]);

  return (
    <Box sx={{ fontFamily: FONT_SANS, p: 2, display: "flex", flexDirection: "column", gap: 1.5, height: "calc(100vh - 64px)", boxSizing: "border-box", overflow: "hidden" }}>

      <section className="dashboard-panel" style={{ flex: 1, minHeight: 0, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px", borderBottom: `1px solid ${T.line}`, gap: 12, flexWrap: "wrap", flexShrink: 0, background: T.white }}>
          {/* Left */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: T.brandLight, border: `1.5px solid ${T.brandBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <PictureAsPdfRoundedIcon style={{ fontSize: 16, color: T.brand }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: FONT_SANS, fontSize: 13.5, fontWeight: 700, color: T.ink, lineHeight: 1.1 }}>Hasil PDF</span>
                {logRows.length > 0 && (
                  <span className="master-project-badge master-project-badge--active" style={{ fontFamily: FONT_MONO, fontSize: 10.5, minHeight: 20, padding: "0 8px" }}>
                    {logRows.length} file
                  </span>
                )}
                {logGeneratedAt && (
                  <span style={{ fontFamily: FONT_SANS, fontSize: 11, color: T.subtle }}>· {logGeneratedAt}</span>
                )}
              </div>
              <span style={{ fontFamily: FONT_SANS, fontSize: 11, color: T.muted, display: "block", marginTop: 2 }}>
                Hasil generate PDF
              </span>
            </div>
          </div>
          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {/* Wilayah filter */}
            <NativeSelect value={wilayahFilter} onChange={(e) => { setWilayahFilter(e.target.value); setPage(0); }} style={{ minWidth: 150 }}>
              <option value="all">Semua wilayah</option>
              {wilayahOptions.map((w) => <option key={w} value={w}>{w}</option>)}
            </NativeSelect>

            {/* WA session select */}
            {waSessions.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: activeSession?.runtimeReady ? T.wa : T.subtle, flexShrink: 0 }} />
                <NativeSelect value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} style={{ minWidth: 148 }}>
                  <option value="">— Pilih akun WA —</option>
                  {waSessions.map((s) => <option key={s.id} value={s.id}>{s.label || s.id}</option>)}
                </NativeSelect>
              </div>
            )}

            {/* Kirim semua */}
            {logRows.length > 0 && !waSending && (
              <CreateButton variant="detail" onClick={() => openSendConfirm(sendableRows, "bulk")}
                disabled={!sendableRows.length || !selectedSession}
                style={{ gap: 6, paddingInline: 14, height: 32, fontSize: 12, background: T.wa, borderColor: T.wa, color: "#fff" }}>
                <WhatsAppIcon style={{ fontSize: 14 }} />
                {wilayahFilter === "all" ? "Kirim Semua via WA" : "Kirim Filter via WA"}
              </CreateButton>
            )}

            {/* Refresh */}
            <CreateButton variant="detail" onClick={fetchLog} disabled={loading} style={{ gap: 6, paddingInline: 10, height: 32, fontSize: 12 }}>
              {loading ? <CircularProgress size={13} sx={{ color: T.brand }} /> : <SyncRoundedIcon style={{ fontSize: 15 }} />}
              {loading ? "Memuat..." : "Refresh"}
            </CreateButton>
          </div>
        </div>

        {/* ── WA Progress ── */}
        {waSending && (
          <div style={{ padding: "10px 20px", borderBottom: `1px solid ${T.line}`, background: T.waBg, flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <WhatsAppIcon style={{ fontSize: 14, color: T.wa }} />
                <span style={{ fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: 600, color: T.green }}>
                  {waProgress.customer || "Mengirim..."}
                </span>
              </div>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: T.wa, fontWeight: 700 }}>
                {waProgress.current}/{waProgress.total}
              </span>
            </div>
            <LinearProgress variant="determinate" value={waPercent}
              sx={{ height: 5, borderRadius: 3, bgcolor: T.waBorder, "& .MuiLinearProgress-bar": { bgcolor: T.wa, borderRadius: 3 } }} />
          </div>
        )}

        {/* ── Pagination bar ── */}
        {logRows.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 20px", borderBottom: `1px solid ${T.line}`, background: T.surface, flexWrap: "wrap", gap: 8, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.muted }}>
                <span style={{ fontWeight: 600, color: T.ink }}>{filteredRows.length === 0 ? "0" : `${page * rowsPerPage + 1}–${Math.min((page + 1) * rowsPerPage, filteredRows.length)}`}</span>
                {" "}dari{" "}
                <span style={{ fontWeight: 600, color: T.ink }}>{filteredRows.length}</span>
                {" "}file
                {wilayahFilter !== "all" && <span style={{ marginLeft: 6, color: T.brand, fontWeight: 600 }}>· {wilayahFilter}</span>}
              </span>
              <span style={{ color: T.line }}>|</span>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.subtle }}>Tampilkan</span>
                <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                  <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
                    style={{ height: 26, paddingLeft: 10, paddingRight: 26, fontFamily: FONT_MONO, fontSize: 11.5, fontWeight: 700, color: T.brand, background: T.white, border: `1.5px solid ${T.brandBorder}`, borderRadius: 999, cursor: "pointer", outline: "none", appearance: "none", transition: "border-color 0.15s, box-shadow 0.15s" }}
                    onFocus={e => { e.target.style.borderColor = T.brand; e.target.style.boxShadow = `0 0 0 2px ${T.brandLight}`; }}
                    onBlur={e => { e.target.style.borderColor = T.brandBorder; e.target.style.boxShadow = "none"; }}>
                    {[25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <span style={{ position: "absolute", right: 8, pointerEvents: "none", display: "flex", alignItems: "center", color: T.brand }}>
                    <svg width="9" height="5" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#233971" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </div>
                <span style={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.subtle }}>baris</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <CreateButton variant="pagination" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                style={{ height: 28, minHeight: "unset", paddingInline: 10, gap: 3, fontSize: 11.5 }}>
                <ChevronLeftRoundedIcon style={{ fontSize: 14 }} />
                Sebelumnya
              </CreateButton>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11.5, fontWeight: 700, color: T.brand, minWidth: 52, textAlign: "center", background: T.brandLight, border: `1.5px solid ${T.brandBorder}`, borderRadius: 999, padding: "2px 10px" }}>
                {page + 1} / {totalPages}
              </span>
              <CreateButton variant="pagination" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                style={{ height: 28, minHeight: "unset", paddingInline: 10, gap: 3, fontSize: 11.5 }}>
                Berikutnya
                <ChevronRightRoundedIcon style={{ fontSize: 14 }} />
              </CreateButton>
            </div>
          </div>
        )}

        {/* ── Body ── */}
        {logRows.length === 0 && !loading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, padding: "40px 56px", border: `1.5px dashed ${T.brandBorder}`, borderRadius: 20, background: `${T.brandLight}60`, maxWidth: 380, textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: T.white, border: `1.5px solid ${T.brandBorder}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 14px rgba(35,57,113,0.08)` }}>
                <PictureAsPdfRoundedIcon style={{ fontSize: 24, color: T.brand }} />
              </div>
              <div>
                <p style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 700, color: T.ink, margin: "0 0 8px" }}>Belum ada PDF</p>
                <p style={{ fontFamily: FONT_SANS, fontSize: 12, color: T.muted, margin: 0, lineHeight: 1.65 }}>Generate PDF terlebih dahulu dari halaman <strong style={{ color: T.brand }}>Generate PDF</strong></p>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CircularProgress size={28} sx={{ color: T.green }} />
          </div>
        ) : (
          <div style={{ overflow: "auto", flex: 1, minHeight: 0 }}>
            <table className="users-table" style={{ fontFamily: FONT_SANS, fontSize: 12 }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                <tr style={{ background: T.brandLight, borderBottom: `1.5px solid ${T.brandBorder}` }}>
                  {["No", "Customer", "No. WhatsApp", "Wilayah", "Jatuh Tempo", "Total Tagihan", "Aksi"].map((h, i) => (
                    <th key={i} style={{ color: T.brandDark, fontSize: 11, fontWeight: 700, padding: "10px 14px", whiteSpace: "nowrap", textAlign: h === "Total Tagihan" ? "right" : h === "Aksi" ? "center" : "left", background: T.brandLight, textTransform: "none", letterSpacing: 0, width: h === "Aksi" ? 120 : h === "No" ? 50 : h === "No. WhatsApp" ? 160 : undefined }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "48px 0", textAlign: "center" }}>
                      <p style={{ fontFamily: FONT_SANS, fontSize: 13, color: T.muted, fontWeight: 600, margin: 0 }}>Tidak ada data untuk wilayah ini</p>
                      <p style={{ fontFamily: FONT_SANS, fontSize: 12, color: T.subtle, margin: "6px 0 0" }}>Coba pilih wilayah lain atau kembali ke "Semua wilayah"</p>
                    </td>
                  </tr>
                ) : pagedRows.map((row, i) => (
                  <tr key={i} className="users-table__row" style={{ background: i % 2 !== 0 ? T.surface : T.white }}>
                    <td style={{ padding: "8px 14px", color: T.subtle, fontSize: 11, fontWeight: 500, textAlign: "center", userSelect: "none" }}>
                      {page * rowsPerPage + i + 1}
                    </td>
                    <td style={{ padding: "8px 14px" }}>
                      <span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 700, color: T.ink }}>{row.nama || "—"}</span>
                    </td>
                    <td style={{ padding: "8px 14px" }}>
                      {row.nomor && row.nomor !== "TIDAK DITEMUKAN" ? (
                        <span style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: T.brand, fontWeight: 600 }}>{row.nomor}</span>
                      ) : (
                        <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: T.subtle, fontStyle: "italic" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "8px 14px" }}>
                      {row.wilayah && row.wilayah !== "CEK" ? (
                        <span className="users-table__status users-table__status--app users-table__status--inline">{row.wilayah}</span>
                      ) : (
                        <span style={{ color: T.subtle, fontSize: 12, fontStyle: "italic" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "8px 14px" }}>
                      <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: T.text, fontWeight: 500 }}>{row.tempo || "—"}</span>
                    </td>
                    <td style={{ padding: "8px 14px", textAlign: "right" }}>
                      <span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 700, color: T.green }}>{row.total || "—"}</span>
                    </td>
                    <td style={{ padding: "6px 10px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
                        {row.pdf && (
                          <ActionBtn href={`${API_RAW}${row.pdf}`} tooltip="Buka PDF" colorScheme="brand"
                            icon={<OpenInNewRoundedIcon style={{ fontSize: 14 }} />} />
                        )}
                        {row.driveUrl ? (
                          <ActionBtn href={row.driveUrl} tooltip="Google Drive" colorScheme="brand"
                            icon={<CloudDoneRoundedIcon style={{ fontSize: 14 }} />} />
                        ) : row.driveError ? (
                          <ActionBtn disabled tooltip={`Drive gagal: ${row.driveError}`} colorScheme="muted"
                            icon={<ErrorOutlineRoundedIcon style={{ fontSize: 14 }} />} />
                        ) : null}
                        <ActionBtn
                          onClick={() => openSendConfirm([row], "single")}
                          disabled={waSending || !row.nomor || row.nomor === "TIDAK DITEMUKAN" || !selectedSession}
                          tooltip={row.nomor && row.nomor !== "TIDAK DITEMUKAN" ? "Kirim via WA" : "Nomor tidak tersedia"}
                          colorScheme={row.nomor && row.nomor !== "TIDAK DITEMUKAN" ? "wa" : "muted"}
                          icon={<SendRoundedIcon style={{ fontSize: 14 }} />}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Confirm Dialog ── */}
      <Dialog open={sendConfirm.open} onClose={closeSendConfirm} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: "16px", fontFamily: FONT_SANS } }}>
        <DialogTitle sx={{ fontFamily: FONT_SANS, fontWeight: 700, fontSize: 15, color: T.ink, pb: 1 }}>
          Konfirmasi Pengiriman
        </DialogTitle>
        <DialogContent sx={{ pb: 1, display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12.5, color: T.text }}>
            {sendConfirm.mode === "bulk"
              ? `Kirim ${sendConfirm.rows.length} PDF lewat WhatsApp?`
              : `Kirim PDF ke ${sendConfirm.rows[0]?.nama || "customer"} lewat WhatsApp?`}
          </Typography>
          {selectedSession && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: T.waBg, border: `1px solid ${T.waBorder}` }}>
              <WhatsAppIcon style={{ fontSize: 14, color: T.wa }} />
              <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: T.green, fontWeight: 600 }}>
                {activeSession?.label || selectedSession}
              </span>
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 0, gap: 1 }}>
          <CreateButton variant="accordion" onClick={closeSendConfirm} disabled={waSending} style={{ paddingInline: 16, fontSize: 12 }}>
            Batal
          </CreateButton>
          <CreateButton variant="detail" onClick={confirmSend} disabled={waSending}
            style={{ paddingInline: 16, fontSize: 12, gap: 6, background: T.wa, borderColor: T.wa, color: "#fff" }}>
            <WhatsAppIcon style={{ fontSize: 14 }} />
            Ya, kirim
          </CreateButton>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={3200} onClose={() => setToast((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={toast.severity} variant="filled" sx={{ borderRadius: "12px", fontFamily: FONT_SANS, boxShadow: "0 8px 24px rgba(0,0,0,0.14)" }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
