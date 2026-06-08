import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Select,
  Snackbar,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import CloudDoneRoundedIcon from "@mui/icons-material/CloudDoneRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import api from "../services/api";
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
  ink:         "#163a6b",
  text:        "#374151",
  muted:       "#6b7280",
  subtle:      "#9ca3af",
  line:        "#e5e7eb",
  surface:     "#f9fafb",
  white:       "#ffffff",
  red:         "#dc2626",
  redBg:       "#fef2f2",
};

function extractDriveFolderId(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const match = raw.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : raw;
}

function formatCurrency(v) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(v) || 0);
}

/* Reusable action button — pill shape, consistent with theme */
function Btn({ children, onClick, disabled, loading, color = "brand", variant = "solid", startIcon, style = {} }) {
  const colors = {
    brand: { bg: T.brand,     hover: T.brandDark, shadow: "rgba(35,57,113,0.25)"  },
    teal:  { bg: "#2a9d8f",   hover: "#1e7a6d",   shadow: "rgba(42,157,143,0.28)" },
    green: { bg: "#166534",   hover: "#0f4a24",   shadow: "rgba(22,101,52,0.25)"  },
    red:   { bg: T.red,       hover: "#b91c1c",   shadow: "rgba(220,38,38,0.25)"  },
  };
  const c = colors[color] || colors.brand;

  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: 6, height: 34, paddingInline: 16, borderRadius: 999,
    fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: 700,
    cursor: disabled || loading ? "not-allowed" : "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
    border: "none", whiteSpace: "nowrap",
    opacity: disabled || loading ? 0.6 : 1,
  };

  if (variant === "outline") {
    return (
      <button onClick={onClick} disabled={disabled || loading}
        style={{ ...base, background: T.white, color: T.text, border: `1.5px solid ${T.line}`, boxShadow: "none", ...style }}
        onMouseEnter={e => { if (!disabled && !loading) { e.currentTarget.style.background = T.surface; e.currentTarget.style.transform = "translateY(-1px)"; } }}
        onMouseLeave={e => { e.currentTarget.style.background = T.white; e.currentTarget.style.transform = "none"; }}>
        {loading ? <CircularProgress size={13} sx={{ color: T.muted }} /> : startIcon}
        {children}
      </button>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled || loading}
      style={{ ...base, background: c.bg, color: "#fff", boxShadow: `0 8px 20px ${c.shadow}`, ...style }}
      onMouseEnter={e => { if (!disabled && !loading) { e.currentTarget.style.background = c.hover; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 12px 24px ${c.shadow}`; } }}
      onMouseLeave={e => { e.currentTarget.style.background = c.bg; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `0 8px 20px ${c.shadow}`; }}>
      {loading ? <CircularProgress size={13} sx={{ color: "#fff" }} /> : startIcon}
      {children}
    </button>
  );
}

const editInputSx = {
  width: "100%", minHeight: 28, border: `1.5px solid ${T.brandBorder}`, borderRadius: "7px",
  px: "8px", py: "4px", fontFamily: FONT_SANS, fontSize: 12, outline: "none",
  bgcolor: T.white, color: T.ink, transition: "border-color 0.15s, box-shadow 0.15s",
  "&:focus": { borderColor: T.brand, boxShadow: `0 0 0 3px ${T.brandLight}` },
};

export default function PdfPage() {
  const [rows, setRows]                   = useState([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [generating, setGenerating]       = useState(false);
  const [progress, setProgress]           = useState({ current: 0, total: 0, status: "", ptName: "" });
  const [toast, setToast]                 = useState({ open: false, message: "", severity: "success" });
  const [editingCell, setEditingCell]     = useState(null);
  const [driveConfig, setDriveConfig]     = useState({ folderId: "", enabled: false, scriptUrl: "" });
  const [driveLoading, setDriveLoading]   = useState(false);
  const [driveConfigOpen, setDriveConfigOpen] = useState(false);
  const [cancelling, setCancelling]       = useState(false);
  const [resettingProgress, setResettingProgress] = useState(false);
  const [rowsPerPage, setRowsPerPage]     = useState(25);
  const [page, setPage]                   = useState(0);
  const [penagihFilter, setPenagihFilter] = useState("all");

  const rowsRef  = useRef([]);
  const driveReady      = !!driveConfig.enabled && !!driveConfig.scriptUrl && !!driveConfig.folderId;
  const hasProgressState = !!progress.status || progress.current > 0 || progress.total > 0;

  const penagihOptions = Array.from(
    new Set(rows.map((row) => String(row.penagih || "").trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "id"));

  const filteredRows = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => penagihFilter === "all" || String(row.penagih || "").trim() === penagihFilter);

  const activePenagihFilter     = penagihFilter !== "all";
  const filteredCustomerCount   = new Set(filteredRows.map(({ row }) => row.customer).filter(Boolean)).size;
  const generateCustomerCount   = activePenagihFilter ? filteredCustomerCount : customerCount;
  const generateRowCount        = activePenagihFilter ? filteredRows.length : rows.length;
  const totalPages              = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const pagedRows               = filteredRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const showToast = (message, severity = "success") => setToast({ open: true, message, severity });

  const loadInitial = async () => {
    try {
      const [statusRes, tmpRes, driveRes] = await Promise.allSettled([
        api.get("/pdf/status"),
        api.get("/pdf/temporary"),
        api.get("/pdf/drive-config"),
      ]);
      if (statusRes.status === "fulfilled") {
        const d = statusRes.value?.data || {};
        setGenerating(!!d.progress?.running);
        setProgress({ current: d.progress?.current || 0, total: d.progress?.total || 0, status: d.progress?.status || "", ptName: d.progress?.ptName || "" });
      }
      if (tmpRes.status === "fulfilled") {
        const d = tmpRes.value?.data || {};
        const nextRows = Array.isArray(d.rows) ? d.rows : [];
        setRows(nextRows);
        setCustomerCount(new Set(nextRows.map((r) => r.customer).filter(Boolean)).size);
      }
      if (driveRes.status === "fulfilled") {
        const d = driveRes.value?.data || {};
        setDriveConfig({ folderId: d.folderId || "", enabled: !!d.enabled, scriptUrl: d.scriptUrl || "" });
      }
    } catch { /* intentional */ }
  };

  useEffect(() => {
    loadInitial();
    const onPdfProgress = (d) => {
      setGenerating(!!d.running);
      setProgress({ current: d.current || 0, total: d.total || 0, status: d.status || "", ptName: d.ptName || "" });
      if (!d.running) setCancelling(false);
    };
    const onPdfDone      = () => { setGenerating(false); setCancelling(false); showToast("Semua PDF berhasil dibuat!", "success"); };
    const onPdfError     = (d) => { setGenerating(false); setCancelling(false); showToast(d?.error || "Generate PDF gagal", "error"); };
    const onPdfCancelled = (d) => { setGenerating(false); setCancelling(false); showToast(d?.message || "Generate PDF dibatalkan", "warning"); };

    if (socket?.on) {
      socket.on("pdf-progress", onPdfProgress);
      socket.on("pdf-done",      onPdfDone);
      socket.on("pdf-error",     onPdfError);
      socket.on("pdf-cancelled", onPdfCancelled);
    }
    return () => {
      if (socket?.off) {
        socket.off("pdf-progress", onPdfProgress);
        socket.off("pdf-done",      onPdfDone);
        socket.off("pdf-error",     onPdfError);
        socket.off("pdf-cancelled", onPdfCancelled);
      }
    };
  }, []);

  const handleGenerate = async () => {
    if (!rows.length) { showToast("Belum ada data PDF yang siap diproses", "warning"); return; }
    const targetRows          = activePenagihFilter ? filteredRows.map(({ row }) => row) : rows;
    const targetCustomerCount = new Set(targetRows.map((row) => row.customer).filter(Boolean)).size;
    if (!targetRows.length || !targetCustomerCount) {
      showToast(activePenagihFilter ? `Tidak ada data untuk penagih ${penagihFilter}` : "Belum ada customer yang siap diproses", "warning");
      return;
    }
    if (driveConfig.enabled && !driveReady) { showToast("Google Drive aktif tapi konfigurasi belum lengkap.", "warning"); return; }
    setGenerating(true);
    setProgress({ current: 0, total: targetCustomerCount, status: "Memulai...", ptName: "" });
    try {
      await api.post("/pdf/generate-per-pt", activePenagihFilter ? { filter: { penagih: penagihFilter } } : {});
    } catch (err) {
      setGenerating(false);
      showToast(err?.response?.data?.message || "Generate gagal", "error");
    }
  };

  const handleCancelGenerate = async () => {
    setCancelling(true);
    try {
      await api.post("/pdf/cancel-generate");
      showToast("Permintaan batal dikirim", "warning");
    } catch (err) { setCancelling(false); showToast(err?.response?.data?.message || "Gagal membatalkan generate PDF", "error"); }
  };

  const handleResetProgress = async () => {
    setResettingProgress(true);
    try {
      const res = await api.post("/pdf/reset-progress");
      const p   = res?.data?.progress || {};
      setGenerating(false); setCancelling(false);
      setProgress({ current: p.current || 0, total: p.total || 0, status: p.status || "", ptName: p.ptName || "" });
      showToast(res?.data?.message || "Status generate PDF berhasil direset", "success");
    } catch (err) { showToast(err?.response?.data?.message || "Gagal reset status generate PDF", "error"); }
    finally { setResettingProgress(false); }
  };

  const handleCellClick  = (rowIdx, field) => { if (editingCell?.row === rowIdx && editingCell?.field === field) return; setEditingCell({ row: rowIdx, field, orig: rows[rowIdx]?.[field] }); };
  const handleCellChange = (rowIdx, field, value) => setRows((prev) => prev.map((r, i) => (i === rowIdx ? { ...r, [field]: value } : r)));
  const handleCellBlur   = async () => {
    setEditingCell(null);
    setCustomerCount(new Set(rowsRef.current.map((r) => r.customer).filter(Boolean)).size);
    try { await api.put("/pdf/temporary/rows", { rows: rowsRef.current }); }
    catch { showToast("Gagal simpan ke server", "error"); }
  };
  const handleCellKey = (e, rowIdx) => {
    if (e.key === "Enter") { e.target.blur(); }
    else if (e.key === "Escape") {
      if (editingCell) setRows((prev) => prev.map((r, i) => (i === rowIdx ? { ...r, [editingCell.field]: editingCell.orig } : r)));
      setEditingCell(null);
    }
  };

  const deleteRow = async (idx) => {
    const newRows = rows.filter((_, i) => i !== idx);
    setRows(newRows);
    setCustomerCount(new Set(newRows.map((r) => r.customer).filter(Boolean)).size);
    try { await api.put("/pdf/temporary/rows", { rows: newRows }); showToast("Baris dihapus", "success"); }
    catch { showToast("Gagal hapus baris", "error"); }
  };

  const handleSaveDriveConfig = async () => {
    setDriveLoading(true);
    try { await api.post("/pdf/drive-config", { folderId: driveConfig.folderId, enabled: driveConfig.enabled, scriptUrl: driveConfig.scriptUrl }); showToast("Konfigurasi Google Drive disimpan", "success"); }
    catch (err) { showToast(err?.response?.data?.message || "Gagal simpan konfigurasi", "error"); }
    finally { setDriveLoading(false); }
  };

  rowsRef.current = rows;
  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <Box sx={{ fontFamily: FONT_SANS, p: 2, display: "flex", flexDirection: "column", gap: 1.5, height: "calc(100vh - 64px)", boxSizing: "border-box", overflow: "hidden" }}>

      {/* ── Action Panel ── */}
      <section className="dashboard-panel" style={{ padding: 0, overflow: "hidden", flexShrink: 0 }}>

        {/* Card Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px", borderBottom: `1px solid ${T.line}`, background: T.white, gap: 12, flexWrap: "wrap", flexShrink: 0 }}>
          {/* Left: title group */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: T.brandLight, border: `1.5px solid ${T.brandBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <PictureAsPdfRoundedIcon style={{ fontSize: 16, color: T.brand }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: FONT_SANS, fontSize: 13.5, fontWeight: 700, color: T.ink, lineHeight: 1.1 }}>Generate PDF</span>
                {rows.length > 0 && (
                  <span className="master-project-badge master-project-badge--active" style={{ fontFamily: FONT_MONO, fontSize: 10.5, minHeight: 20, padding: "0 8px" }}>
                    {customerCount} customer · {rows.length} baris
                  </span>
                )}
                {driveReady && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 999, background: "#e8f0fe", border: "1.5px solid #c5d8fb" }}>
                    <CloudDoneRoundedIcon style={{ fontSize: 12, color: "#1a73e8" }} />
                    <span style={{ fontFamily: FONT_SANS, fontSize: 10.5, color: "#1a73e8", fontWeight: 600 }}>Drive aktif</span>
                  </div>
                )}
              </div>
              <span style={{ fontFamily: FONT_SANS, fontSize: 11, color: T.muted, display: "block", marginTop: 2 }}>
                Generate &amp; Cetak Tagihan PDF
              </span>
            </div>
          </div>
          {/* Right: actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Btn variant="outline" onClick={() => setDriveConfigOpen(true)} startIcon={<SettingsRoundedIcon style={{ fontSize: 14 }} />}>
              Setting Drive
            </Btn>
            {!generating ? (
              <Btn color="teal" onClick={handleGenerate} disabled={!generateRowCount} startIcon={<PictureAsPdfRoundedIcon style={{ fontSize: 14 }} />}>
                Generate {generateCustomerCount > 0 ? `${generateCustomerCount} PDF` : "PDF"}
              </Btn>
            ) : (
              <Btn color="red" onClick={handleCancelGenerate} disabled={cancelling} loading={cancelling}>
                {cancelling ? "Membatalkan..." : "Batalkan Generate"}
              </Btn>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {generating && (
          <div style={{ padding: "0 20px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 700, color: T.ink }}>{progress.ptName || "Menyiapkan..."}</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: T.brand, fontWeight: 700 }}>{progress.current}/{progress.total}</span>
            </div>
            <LinearProgress variant="determinate" value={percent} sx={{ height: 6, borderRadius: 999, bgcolor: T.brandLight, "& .MuiLinearProgress-bar": { bgcolor: T.brand, borderRadius: 999 } }} />
            <span style={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.muted }}>{progress.status || "Berjalan..."}</span>
          </div>
        )}

        {/* Alerts */}
        {!generating && (
          <div style={{ padding: rows.length ? "0 20px 4px" : "0 20px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
            {!rows.length && <Alert severity="info" sx={{ fontFamily: FONT_SANS, fontSize: 12, py: 0.25, borderRadius: "10px" }}>Belum ada data — siapkan dari halaman Input Data terlebih dahulu</Alert>}
            {driveConfig.enabled && !driveReady && <Alert severity="warning" sx={{ fontFamily: FONT_SANS, fontSize: 12, py: 0.25, borderRadius: "10px" }}>Upload Drive aktif tapi belum lengkap — isi Apps Script URL dan Folder ID di Setting Drive.</Alert>}
            {hasProgressState && (
              <div style={{ paddingBottom: 4 }}>
                <Btn variant="outline" onClick={handleResetProgress} loading={resettingProgress} style={{ height: 30, fontSize: 11.5 }}>
                  Reset Status Proses
                </Btn>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Table Panel ── */}
      {rows.length > 0 && (
        <section className="dashboard-panel" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>

          {/* Table card header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px", borderBottom: `1px solid ${T.line}`, background: T.white, gap: 12, flexWrap: "wrap", flexShrink: 0 }}>
            {/* Left: title */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: T.brandLight, border: `1.5px solid ${T.brandBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <PictureAsPdfRoundedIcon style={{ fontSize: 16, color: T.brand }} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: FONT_SANS, fontSize: 13.5, fontWeight: 700, color: T.ink, lineHeight: 1.1 }}>Preview Data PDF</span>
                </div>
                <span style={{ fontFamily: FONT_SANS, fontSize: 11, color: T.muted, display: "block", marginTop: 2 }}>
                  Klik sel untuk edit langsung
                </span>
              </div>
            </div>
            {/* Right: filter penagih */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FilterAltRoundedIcon style={{ fontSize: 15, color: T.subtle }} />
              <span style={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.muted }}>Penagih:</span>
              <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                <select value={penagihFilter} onChange={(e) => { setPenagihFilter(e.target.value); setPage(0); }}
                  style={{ height: 32, paddingLeft: 12, paddingRight: 28, fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: penagihFilter !== "all" ? T.brand : T.text, background: penagihFilter !== "all" ? T.brandLight : T.white, border: `1.5px solid ${penagihFilter !== "all" ? T.brandBorder : T.line}`, borderRadius: 999, cursor: "pointer", outline: "none", appearance: "none", transition: "border-color 0.15s, box-shadow 0.15s", minWidth: 160 }}
                  onFocus={e => { e.target.style.borderColor = T.brand; e.target.style.boxShadow = `0 0 0 2px ${T.brandLight}`; }}
                  onBlur={e => { e.target.style.borderColor = penagihFilter !== "all" ? T.brandBorder : T.line; e.target.style.boxShadow = "none"; }}>
                  <option value="all">Semua penagih</option>
                  {penagihOptions.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
                <span style={{ position: "absolute", right: 9, pointerEvents: "none", display: "flex", alignItems: "center", color: T.brand }}>
                  <svg width="9" height="5" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#233971" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              </div>
            </div>
          </div>

          {/* Pagination bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 20px", borderBottom: `1px solid ${T.line}`, background: T.surface, flexWrap: "wrap", gap: 8, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.muted }}>
                <span style={{ fontWeight: 600, color: T.ink }}>
                  {filteredRows.length === 0 ? "0" : `${page * rowsPerPage + 1}–${Math.min((page + 1) * rowsPerPage, filteredRows.length)}`}
                </span>
                {" "}dari{" "}
                <span style={{ fontWeight: 600, color: T.ink }}>{filteredRows.length}</span>
                {" "}baris
                {penagihFilter !== "all" && <span style={{ marginLeft: 6, color: T.brand, fontWeight: 600 }}>· {penagihFilter}</span>}
              </span>
              <span style={{ color: T.line }}>|</span>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.subtle }}>Tampilkan</span>
                <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                  <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
                    style={{ height: 26, paddingLeft: 10, paddingRight: 26, fontFamily: FONT_MONO, fontSize: 11.5, fontWeight: 700, color: T.brand, background: T.white, border: `1.5px solid ${T.brandBorder}`, borderRadius: 999, cursor: "pointer", outline: "none", appearance: "none", transition: "border-color 0.15s" }}
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

          {/* Table */}
          <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            <table className="users-table" style={{ fontFamily: FONT_SANS, fontSize: 12, minWidth: 1020 }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 5 }}>
                <tr style={{ background: T.brandLight, borderBottom: `1.5px solid ${T.brandBorder}` }}>
                  {["No", "No Invoice", "Customer", "Tgl Invoice", "Jatuh Tempo", "Termin", "Tagihan", "Penagih", ""].map((h, i) => (
                    <th key={i} style={{ color: T.brandDark, fontSize: 10.5, fontWeight: 700, padding: h === "" ? "10px 8px" : "10px 14px", textAlign: h === "Tagihan" ? "right" : "left", whiteSpace: "nowrap", width: h === "" ? 44 : h === "No" ? 40 : undefined, userSelect: "none", background: T.brandLight, textTransform: "none", letterSpacing: 0 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: "48px 20px", textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                        <FilterAltRoundedIcon style={{ fontSize: 32, color: T.subtle }} />
                        <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: T.muted, fontWeight: 600 }}>Tidak ada data untuk penagih ini</span>
                        <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: T.subtle }}>Coba pilih penagih lain atau kembali ke "Semua penagih"</span>
                      </div>
                    </td>
                  </tr>
                ) : pagedRows.map(({ row, index: absoluteIdx }, i) => {
                  const isCell = (f) => editingCell?.row === absoluteIdx && editingCell?.field === f;
                  const cellStyle = (extra = {}) => ({ padding: "7px 14px", minWidth: 90, cursor: "text", ...extra });
                  const inp = (f, opts = {}) => (
                    <Box component="input" autoFocus type={opts.type || "text"}
                      value={opts.type === "number" ? row[f] ?? "" : row[f] || ""}
                      placeholder={opts.placeholder}
                      onChange={(e) => handleCellChange(absoluteIdx, f, e.target.value)}
                      onBlur={handleCellBlur} onKeyDown={(e) => handleCellKey(e, absoluteIdx)}
                      sx={{ ...editInputSx, ...(opts.align ? { textAlign: opts.align } : {}) }} />
                  );

                  return (
                    <tr key={absoluteIdx} className="users-table__row" style={{ background: i % 2 !== 0 ? T.surface : T.white }}>
                      <td style={{ padding: "8px 16px", color: T.subtle, fontSize: 11, fontWeight: 600, textAlign: "center", userSelect: "none", width: 40 }}>
                        {page * rowsPerPage + i + 1}
                      </td>
                      <td style={{ ...cellStyle(), background: isCell("noInvoice") ? T.brandLight : undefined }} onClick={() => handleCellClick(absoluteIdx, "noInvoice")}>
                        {isCell("noInvoice") ? inp("noInvoice") : <span style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: T.brand, fontWeight: 700 }}>{row.noInvoice || <span style={{ color: T.subtle, fontStyle: "italic", fontFamily: FONT_SANS, fontWeight: 400 }}>—</span>}</span>}
                      </td>
                      <td style={{ ...cellStyle(), background: isCell("customer") ? T.brandLight : undefined }} onClick={() => handleCellClick(absoluteIdx, "customer")}>
                        {isCell("customer") ? inp("customer") : <span style={{ fontWeight: 600, color: T.ink, fontSize: 12 }}>{row.customer || <span style={{ color: T.subtle, fontStyle: "italic", fontWeight: 400 }}>—</span>}</span>}
                      </td>
                      <td style={{ ...cellStyle(), background: isCell("tanggalInvoice") ? T.brandLight : undefined }} onClick={() => handleCellClick(absoluteIdx, "tanggalInvoice")}>
                        {isCell("tanggalInvoice") ? inp("tanggalInvoice", { placeholder: "dd/mm/yyyy" }) : <span style={{ color: T.muted, fontSize: 12 }}>{row.tanggalInvoice || "—"}</span>}
                      </td>
                      <td style={{ ...cellStyle(), background: isCell("tempo") ? T.brandLight : undefined }} onClick={() => handleCellClick(absoluteIdx, "tempo")}>
                        {isCell("tempo") ? inp("tempo", { placeholder: "dd/mm/yyyy" }) : <span style={{ color: T.text, fontWeight: 500, fontSize: 12 }}>{row.tempo || "—"}</span>}
                      </td>
                      <td style={{ ...cellStyle({ textAlign: "center", minWidth: 82 }), background: isCell("termin") ? T.brandLight : undefined }} onClick={() => handleCellClick(absoluteIdx, "termin")}>
                        {isCell("termin") ? inp("termin", { align: "center" }) : <span style={{ color: T.muted, fontSize: 12 }}>{row.termin || "—"}</span>}
                      </td>
                      <td style={{ ...cellStyle({ textAlign: "right" }), background: isCell("tagihan") ? T.brandLight : undefined }} onClick={() => handleCellClick(absoluteIdx, "tagihan")}>
                        {isCell("tagihan") ? inp("tagihan", { type: "number", align: "right" }) : <span style={{ fontWeight: 700, color: T.green, fontSize: 12 }}>{formatCurrency(row.tagihan)}</span>}
                      </td>
                      <td style={{ ...cellStyle(), background: isCell("penagih") ? T.brandLight : undefined }} onClick={() => handleCellClick(absoluteIdx, "penagih")}>
                        {isCell("penagih") ? inp("penagih") : <span style={{ color: T.muted, fontSize: 12 }}>{row.penagih || "—"}</span>}
                      </td>
                      <td style={{ padding: "4px 8px", textAlign: "center", width: 44 }}>
                        <button onClick={() => deleteRow(absoluteIdx)}
                          style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${T.line}`, background: T.surface, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: T.subtle, transition: "all 0.15s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = T.redBg; e.currentTarget.style.color = T.red; e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.transform = "scale(1.05)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = T.surface; e.currentTarget.style.color = T.subtle; e.currentTarget.style.borderColor = T.line; e.currentTarget.style.transform = "none"; }}>
                          <DeleteForeverRoundedIcon style={{ fontSize: 16 }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Footer legend ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 20px", borderTop: `1px solid ${T.line}`, background: T.surface, flexShrink: 0 }}>
            <InfoOutlinedIcon style={{ fontSize: 14, color: T.brandBorder, flexShrink: 0 }} />
            <span style={{ fontFamily: FONT_SANS, fontSize: 11, color: T.muted }}>
              Klik sel untuk <span style={{ color: T.brand, fontWeight: 600 }}>edit langsung</span> — perubahan tersimpan otomatis ke server. Filter <span style={{ color: T.brand, fontWeight: 600 }}>Penagih</span> hanya memfilter tampilan, generate tetap sesuai pilihan.
            </span>
          </div>
        </section>
      )}

      {/* ── Google Drive Config Dialog ── */}
      <Dialog open={driveConfigOpen} onClose={() => setDriveConfigOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "20px", m: 2 } }}>
        <DialogTitle sx={{ fontFamily: FONT_SANS, fontWeight: 700, fontSize: 15, color: T.ink, pb: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CloudUploadRoundedIcon sx={{ fontSize: 20, color: "#1a73e8" }} />
            Pengaturan Google Drive
          </Box>
          <IconButton size="small" onClick={() => setDriveConfigOpen(false)} sx={{ color: T.muted }}>
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 1.75 }}>
          <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12.5, color: T.muted }}>
            Setiap PDF yang digenerate akan diunggah secara otomatis ke Google Drive yang Anda tentukan di bawah ini.
          </Typography>
          <TextField size="small" fullWidth label="Apps Script URL" placeholder="https://script.google.com/macros/s/.../exec"
            value={driveConfig.scriptUrl}
            onChange={(e) => setDriveConfig((p) => ({ ...p, scriptUrl: e.target.value }))}
            InputProps={{ startAdornment: <InputAdornment position="start"><LinkRoundedIcon sx={{ fontSize: 15, color: driveConfig.scriptUrl ? "#1a73e8" : T.muted }} /></InputAdornment>, sx: { fontFamily: FONT_MONO, fontSize: 10.5, borderRadius: "10px" } }}
            sx={{ "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: driveConfig.scriptUrl ? "#c5d8fb" : T.line }, "&:hover fieldset": { borderColor: "#1a73e8" }, "&.Mui-focused fieldset": { borderColor: "#1a73e8" } }, "& label": { fontFamily: FONT_SANS, fontSize: 12 } }} />
          <TextField size="small" fullWidth label="Folder ID / Link Folder" placeholder="https://drive.google.com/drive/folders/... atau ID folder"
            value={driveConfig.folderId}
            onChange={(e) => setDriveConfig((p) => ({ ...p, folderId: extractDriveFolderId(e.target.value) }))}
            InputProps={{ startAdornment: <InputAdornment position="start"><FolderOpenRoundedIcon sx={{ fontSize: 15, color: T.muted }} /></InputAdornment>, sx: { fontFamily: FONT_MONO, fontSize: 10.5, borderRadius: "10px" } }}
            sx={{ "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: T.line }, "&:hover fieldset": { borderColor: "#1a73e8" }, "&.Mui-focused fieldset": { borderColor: "#1a73e8" } }, "& label": { fontFamily: FONT_SANS, fontSize: 12 } }} />
          <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.muted }}>
            Link folder Google Drive boleh ditempel langsung. Sistem akan ambil folderId otomatis.
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.5, px: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Switch size="small" checked={driveConfig.enabled}
                onChange={(e) => setDriveConfig((p) => ({ ...p, enabled: e.target.checked }))}
                sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#1a73e8" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#1a73e8" } }} />
              <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12, color: driveConfig.enabled ? "#1a73e8" : T.muted, fontWeight: driveConfig.enabled ? 600 : 400 }}>
                {driveConfig.enabled ? "Upload Drive Aktif" : "Upload Drive Nonaktif"}
              </Typography>
            </Box>
            <Btn color="brand" onClick={() => { handleSaveDriveConfig(); setDriveConfigOpen(false); }} loading={driveLoading} style={{ background: "#1a73e8", boxShadow: "0 8px 20px rgba(26,115,232,0.25)" }}>
              Simpan & Tutup
            </Btn>
          </Box>
          {driveConfig.enabled && !driveConfig.scriptUrl && <Alert severity="warning" sx={{ fontFamily: FONT_SANS, fontSize: 11, py: 0.25, borderRadius: "10px" }}>Isi Apps Script URL dulu agar upload berhasil.</Alert>}
          {driveConfig.enabled && driveConfig.scriptUrl && !driveConfig.folderId && <Alert severity="warning" sx={{ fontFamily: FONT_SANS, fontSize: 11, py: 0.25, borderRadius: "10px" }}>Isi link atau ID folder Google Drive dulu.</Alert>}
          {driveReady && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1, borderRadius: "10px", bgcolor: "#e8f0fe", border: "1px solid #c5d8fb" }}>
              <CloudDoneRoundedIcon sx={{ fontSize: 16, color: "#1a73e8" }} />
              <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12, color: "#1a73e8", fontWeight: 600 }}>Google Drive siap dipakai</Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={3200} onClose={() => setToast((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={toast.severity} variant="filled" sx={{ borderRadius: "12px", fontFamily: FONT_SANS, boxShadow: "0 8px 24px rgba(0,0,0,0.14)" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
