import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  CircularProgress,
  LinearProgress,
  Snackbar,
  Skeleton,
  Typography,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import api from "../services/api";
import CreateButton from "../piagam/button/CreateButton";

const FONT_SANS = "'Plus Jakarta Sans', 'Inter', sans-serif";
const FONT_MONO = "'JetBrains Mono', 'Fira Code', monospace";

const PDF_FIELD_LABELS = {
  noInvoice:      "No. Invoice",
  tanggalInvoice: "Tgl. Invoice",
  termin:         "Termin",
  customer:       "Customer",
  tagihan:        "Tagihan",
  tempo:          "Tempo",
  penagih:        "Penagih",
};

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

function formatDateDisplay(v) {
  if (v === null || v === undefined || v === "") return "";
  // already a formatted string (not a bare number) — show as-is
  if (typeof v === "string" && isNaN(Number(v.trim()))) return v;
  // Excel date serial number (range covers years ~2009–2064)
  const n = Number(v);
  if (!isNaN(n) && n >= 40000 && n <= 60000) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(epoch.getTime() + n * 86400000);
    return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
  }
  return String(v);
}

function parseAmount(v) {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return v;
  const s = String(v).trim();
  // English format: "2,950,000.00" — ends with dot then digits → remove commas, keep dot
  if (/\.\d+$/.test(s)) return parseFloat(s.replace(/,/g, "")) || 0;
  // Indonesian format: "2.950.000" or "2.950.000,00" — dots=thousands, comma=decimal
  return parseFloat(s.replace(/\./g, "").replace(",", ".")) || 0;
}

function formatCurrency(v) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(parseAmount(v));
}

const cellInputSx = {
  width: "100%", border: `1.5px solid ${T.brand}`, borderRadius: "6px",
  px: "8px", py: "4px", fontFamily: FONT_SANS, fontSize: 12, outline: "none",
  bgcolor: "rgba(255,255,255,0.95)", color: T.ink, minWidth: 80,
  boxShadow: `0 0 0 3px ${T.brandLight}`,
  "&:focus": { borderColor: T.brandDark },
};

function LoadingTableState({ syncing }) {
  const skeletonRows = [
    [32, 68, 52, 44, 60],
    [28, 82, 44, 58, 38],
    [35, 55, 60, 40, 72],
    [30, 74, 48, 66, 44],
    [32, 62, 56, 50, 56],
    [28, 78, 42, 62, 40],
    [35, 60, 64, 46, 68],
  ];

  return (
    <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>

      {/* Loading banner */}
      <Box sx={{ px: 2.5, py: 1.75, borderBottom: `1px solid ${T.line}`, bgcolor: T.brandLight }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <CircularProgress size={16} thickness={4} sx={{ color: T.brand, flexShrink: 0 }} />
            <Box>
              <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: 700, color: T.ink, lineHeight: 1.2 }}>
                {syncing ? "Menyinkronkan data dari Google Sheet" : "Memuat data sheet INPUT"}
              </Typography>
              <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11, color: T.muted, mt: 0.25 }}>
                {syncing ? "Mengambil header, baris, dan mapping PDF..." : "Memeriksa konfigurasi dan memuat data terakhir..."}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1.25, py: 0.5, borderRadius: "999px", bgcolor: T.white, border: `1.5px solid ${T.brandBorder}`, boxShadow: `0 2px 8px rgba(35,57,113,0.06)`, flexShrink: 0 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: T.brand, animation: "pulse 1.4s ease-in-out infinite", "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } } }} />
            <Typography sx={{ fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 700, color: T.brand, letterSpacing: "0.07em" }}>
              {syncing ? "SYNCING" : "LOADING"}
            </Typography>
          </Box>
        </Box>
        <LinearProgress sx={{ mt: 1.5, height: 3, borderRadius: 999, bgcolor: `${T.brand}18`, "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: T.brand } }} />
      </Box>

      {/* Skeleton table */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden", bgcolor: T.white }}>
        {/* Skeleton thead */}
        <Box sx={{ display: "grid", gridTemplateColumns: "52px 1.3fr 1fr 0.9fr 0.9fr", borderBottom: `1.5px solid ${T.brandBorder}`, bgcolor: T.brandLight, px: 0 }}>
          {[28, 55, 42, 48, 38].map((w, ci) => (
            <Box key={ci} sx={{ px: 2, py: 1.4 }}>
              <Skeleton variant="rounded" width={`${w}%`} height={10} sx={{ bgcolor: `${T.brand}18`, borderRadius: 2 }} />
            </Box>
          ))}
        </Box>

        {/* Skeleton rows */}
        {skeletonRows.map((cols, rowIdx) => (
          <Box key={rowIdx} sx={{ display: "grid", gridTemplateColumns: "52px 1.3fr 1fr 0.9fr 0.9fr", borderBottom: rowIdx === skeletonRows.length - 1 ? "none" : `1px solid ${T.line}`, bgcolor: rowIdx % 2 === 0 ? T.white : T.surface, alignItems: "center" }}>
            {/* No column */}
            <Box sx={{ px: 2, py: 1.25, display: "flex", justifyContent: "center" }}>
              <Skeleton variant="rounded" width={20} height={10} sx={{ bgcolor: "rgba(148,163,184,0.2)", borderRadius: 2 }} />
            </Box>
            {/* Data columns */}
            {cols.map((w, ci) => (
              <Box key={ci} sx={{ px: 2, py: 1.25 }}>
                <Skeleton variant="rounded" width={`${w}%`} height={11}
                  sx={{ bgcolor: ci === 3 ? "rgba(22,101,52,0.1)" : "rgba(148,163,184,0.18)", borderRadius: 2,
                    animationDelay: `${(rowIdx * 5 + ci) * 0.05}s` }} />
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function InputPage() {
  const navigate = useNavigate();
  const [sheetHeaders, setSheetHeaders] = useState([]);
  const [sheetRows, setSheetRows]       = useState([]);
  const [pdfMapping, setPdfMapping]     = useState({});

  const [gsheetUrl, setGsheetUrl]         = useState("");
  const [gsheetUrlEdit, setGsheetUrlEdit] = useState(false);
  const [syncing, setSyncing]             = useState(false);
  const [loading, setLoading]             = useState(true);
  const [savingPdf, setSavingPdf]         = useState(false);
  const [pdfSaved, setPdfSaved]           = useState(false);

  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage]               = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCell, setEditingCell] = useState(null);
  const [toast, setToast]             = useState({ open: false, message: "", severity: "success" });
  const [headerSlot, setHeaderSlot]   = useState(null);

  const gsheetSavedUrlRef = useRef("");
  const rowsRef           = useRef([]);
  const skipBlurRef       = useRef(false);

  rowsRef.current = sheetRows;

  useEffect(() => {
    setTimeout(() => setHeaderSlot(document.getElementById("header-wa-slot")), 100);
  }, []);

  const showToast = (msg, sev = "success") => setToast({ open: true, message: msg, severity: sev });

  useEffect(() => {
    api.get("/gsheet").then((res) => {
      const url = res?.data?.url || "";
      setGsheetUrl(url);
      gsheetSavedUrlRef.current = url;
      setGsheetUrlEdit(!url);
      if (url) {
        setSyncing(true);
        api.get("/gsheet/input").then((r) => {
          const d = r?.data || {};
          setSheetHeaders(Array.isArray(d.headers) ? d.headers : []);
          setSheetRows(Array.isArray(d.rows) ? d.rows : []);
          setPdfMapping(d.pdfMapping || {});
          setPage(0);
          showToast(`${(d.rows || []).length} baris dimuat dari GSheet`, "success");
        }).catch((err) => {
          showToast(err?.response?.data?.message || "Gagal auto-sync", "error");
        }).finally(() => setSyncing(false));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleGSheetSaveUrl = async () => {
    if (!gsheetUrl.trim()) { showToast("Masukkan URL Google Sheet", "warning"); return; }
    if (!gsheetUrl.includes("/spreadsheets/d/")) { showToast("URL tidak valid", "error"); return; }
    try {
      await api.post("/gsheet", { url: gsheetUrl.trim() });
      gsheetSavedUrlRef.current = gsheetUrl.trim();
      setGsheetUrlEdit(false);
      showToast("URL disimpan", "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Gagal simpan URL", "error");
    }
  };

  const handleSync = async () => {
    if (!gsheetSavedUrlRef.current) { showToast("Atur URL Google Sheet terlebih dahulu", "warning"); return; }
    setSyncing(true); setPdfSaved(false);
    try {
      const res = await api.get("/gsheet/input");
      const d = res?.data || {};
      setSheetHeaders(Array.isArray(d.headers) ? d.headers : []);
      setSheetRows(Array.isArray(d.rows) ? d.rows : []);
      setPdfMapping(d.pdfMapping || {});
      setPage(0);
      showToast(`${(d.rows || []).length} baris dimuat`, "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Gagal sync", "error");
    } finally { setSyncing(false); }
  };

  const handleSaveForPdf = async () => {
    setSavingPdf(true);
    try {
      const res = await api.post("/pdf/generate-temporary");
      const count = res?.data?.rows?.length ?? 0;
      showToast(`${count} baris siap untuk PDF`, "success");
      setPdfSaved(true);
      setTimeout(() => navigate("/pdf"), 800);
    } catch (err) {
      showToast(err?.response?.data?.message || "Gagal generate temporary", "error");
    } finally { setSavingPdf(false); }
  };

  const handleCellClick = (rowIdx, colKey) => {
    if (editingCell?.row === rowIdx && editingCell?.colKey === colKey) return;
    setEditingCell({ row: rowIdx, colKey, orig: sheetRows[rowIdx]?.[colKey] });
  };

  const handleCellChange = (rowIdx, colKey, value) => {
    setSheetRows((prev) => {
      const next = prev.map((r, i) => i === rowIdx ? { ...r, [colKey]: value } : r);
      rowsRef.current = next;
      return next;
    });
    setPdfSaved(false);
  };

  const handleCellBlur = () => {
    if (skipBlurRef.current) return;
    setEditingCell(null);
  };

  const handleCellKey = (e, rowIdx) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const next = rowIdx + 1;
      if (next < rowsRef.current.length) {
        skipBlurRef.current = true;
        setEditingCell({ row: next, colKey: editingCell?.colKey, orig: rowsRef.current[next]?.[editingCell?.colKey] });
        setTimeout(() => { skipBlurRef.current = false; }, 50);
      } else { setEditingCell(null); }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const keys = sheetHeaders.map(h => h.key);
      const ci = keys.indexOf(editingCell?.colKey);
      skipBlurRef.current = true;
      if (!e.shiftKey) {
        if (ci < keys.length - 1) setEditingCell({ row: rowIdx, colKey: keys[ci + 1], orig: rowsRef.current[rowIdx]?.[keys[ci + 1]] });
        else if (rowIdx < rowsRef.current.length - 1) setEditingCell({ row: rowIdx + 1, colKey: keys[0], orig: rowsRef.current[rowIdx + 1]?.[keys[0]] });
        else setEditingCell(null);
      } else {
        if (ci > 0) setEditingCell({ row: rowIdx, colKey: keys[ci - 1], orig: rowsRef.current[rowIdx]?.[keys[ci - 1]] });
        else if (rowIdx > 0) setEditingCell({ row: rowIdx - 1, colKey: keys[keys.length - 1], orig: rowsRef.current[rowIdx - 1]?.[keys[keys.length - 1]] });
        else setEditingCell(null);
      }
      setTimeout(() => { skipBlurRef.current = false; }, 50);
    } else if (e.key === "Escape") {
      skipBlurRef.current = true;
      if (editingCell) setSheetRows((prev) => prev.map((r, i) => i === rowIdx ? { ...r, [editingCell.colKey]: editingCell.orig } : r));
      setEditingCell(null);
      setTimeout(() => { skipBlurRef.current = false; }, 50);
    }
  };

  const addRow = () => {
    const empty = {};
    sheetHeaders.forEach(h => { empty[h.key] = ""; });
    const newRows = [...rowsRef.current, empty];
    setSheetRows(newRows);
    setPdfSaved(false);
    const newRowIdx = newRows.length - 1;
    setPage(Math.floor(newRowIdx / rowsPerPage));
    setEditingCell({ row: newRowIdx, colKey: sheetHeaders[0]?.key, orig: "" });
  };

  const deleteRow = (idx) => {
    setSheetRows(sheetRows.filter((_, i) => i !== idx));
    setPdfSaved(false);
    if (editingCell?.row === idx) setEditingCell(null);
  };

  const isPdfCol     = (key) => Object.values(pdfMapping).includes(key);
  const pdfFieldLabel = (key) => {
    const e = Object.entries(pdfMapping).find(([, v]) => v === key);
    return e ? e[0] : null;
  };

  const mappedRows   = sheetRows.map((row, index) => ({ row, index }));
  const filteredRows = mappedRows.filter(({ row }) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return sheetHeaders.some(h => String(row[h.key] ?? "").toLowerCase().includes(q));
  });
  const totalPages         = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const showFullLoadingState = loading || (syncing && sheetRows.length === 0);

  return (
    <Box sx={{ fontFamily: FONT_SANS, p: 2, display: "flex", flexDirection: "column", gap: 1.5, height: "calc(100vh - 64px)", boxSizing: "border-box", overflow: "hidden" }}>

      {/* ── Header portal ── */}
      {headerSlot && createPortal(
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          {gsheetSavedUrlRef.current ? (
            <Box component="a" href={gsheetSavedUrlRef.current} target="_blank" rel="noopener noreferrer"
              sx={{ display: "flex", alignItems: "center", gap: 0.6, height: 32, px: 1.5, borderRadius: "999px", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: "#fff", textDecoration: "none", border: "1.5px solid rgba(255,255,255,0.45)", bgcolor: "rgba(255,255,255,0.18)", transition: "transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease", "&:hover": { bgcolor: "rgba(255,255,255,0.28)", borderColor: "rgba(255,255,255,0.7)", transform: "translateY(-1px)", boxShadow: "0 10px 20px rgba(26,42,87,0.18)" } }}>
              <TableChartRoundedIcon sx={{ fontSize: 14 }} />
              Buka Google Sheet
              <OpenInNewRoundedIcon sx={{ fontSize: 11, opacity: 0.75 }} />
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, height: 32, px: 1.5, borderRadius: "999px", fontFamily: FONT_SANS, fontSize: 12, color: "rgba(255,255,255,0.5)", fontStyle: "italic", border: "1px solid rgba(255,255,255,0.15)", bgcolor: "rgba(255,255,255,0.07)" }}>
              <TableChartRoundedIcon sx={{ fontSize: 14 }} />
              Belum dikonfigurasi
            </Box>
          )}
          <CreateButton variant="detail" onClick={handleSync} disabled={syncing || !gsheetSavedUrlRef.current}
            style={{ height: 32, paddingInline: 14, fontSize: 12, gap: 6, color: "#fff", background: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.45)" }}>
            {syncing ? <CircularProgress size={12} sx={{ color: "#fff" }} /> : <SyncRoundedIcon style={{ fontSize: 14 }} />}
            {syncing ? "Menyinkron..." : "Sync"}
          </CreateButton>
        </Box>,
        headerSlot
      )}

      {/* ── Main Table Card ── */}
      <section className="dashboard-panel" style={{ flex: 1, minHeight: 0, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* ── Card Header ── */}
        <div className="dashboard-panel__header" style={{ padding: "16px 24px", borderBottom: `1px solid ${T.line}`, background: T.white, flexShrink: 0, margin: 0 }}>
          {/* Left */}
          <div>
            <p className="dashboard-panel__eyebrow" style={{ fontFamily: FONT_SANS, marginBottom: 2 }}>
              Google Sheet
            </p>
            <h2 className="dashboard-panel__title" style={{ margin: 0 }}>Sheet INPUT</h2>
            {sheetRows.length > 0 && (
              <p className="dashboard-panel__description" style={{ margin: "3px 0 0", fontFamily: FONT_MONO }}>
                {sheetRows.length} baris · {sheetHeaders.length} kolom
              </p>
            )}
          </div>
          {/* Right – Search + Generate PDF */}
          <div className="dashboard-panel__action" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <SearchRoundedIcon style={{ position: "absolute", left: 9, fontSize: 14, color: T.subtle, pointerEvents: "none" }} />
              <input
                type="text"
                placeholder="Cari data..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                style={{ height: 34, paddingLeft: 30, paddingRight: searchQuery ? 28 : 12, width: 170, fontFamily: FONT_SANS, fontSize: 12, color: T.ink, border: `1.5px solid ${searchQuery ? T.brand : T.line}`, borderRadius: 8, background: T.white, outline: "none", transition: "border-color 0.15s, box-shadow 0.15s", boxShadow: searchQuery ? `0 0 0 2px ${T.brandLight}` : "none" }}
                onFocus={e => { e.target.style.borderColor = T.brand; e.target.style.boxShadow = `0 0 0 2px ${T.brandLight}`; }}
                onBlur={e => { e.target.style.borderColor = searchQuery ? T.brand : T.line; e.target.style.boxShadow = searchQuery ? `0 0 0 2px ${T.brandLight}` : "none"; }}
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setPage(0); }}
                  style={{ position: "absolute", right: 7, width: 16, height: 16, borderRadius: "50%", background: T.subtle, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                  onMouseEnter={e => e.currentTarget.style.background = T.muted}
                  onMouseLeave={e => e.currentTarget.style.background = T.subtle}>
                  <CloseRoundedIcon style={{ fontSize: 10, color: "#fff" }} />
                </button>
              )}
            </div>
            {sheetRows.length > 0 && (
              <button className="users-table-card__action" onClick={handleSaveForPdf} disabled={savingPdf || pdfSaved}
                style={{ opacity: (savingPdf || pdfSaved) ? 0.72 : 1 }}>
                {savingPdf ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : pdfSaved ? <CheckCircleOutlineRoundedIcon style={{ fontSize: 16 }} /> : <PictureAsPdfRoundedIcon style={{ fontSize: 16 }} />}
                {pdfSaved ? "Tersimpan ✓" : "Generate PDF"}
              </button>
            )}
          </div>
        </div>


        {/* ── Syncing overlay banner ── */}
        {syncing && sheetRows.length > 0 && (
          <div style={{ padding: "8px 20px", borderBottom: `1px solid ${T.brandBorder}`, background: T.brandLight, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CircularProgress size={13} sx={{ color: T.brand, flexShrink: 0 }} />
              <span style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: T.brand, flex: 1 }}>
                Menyinkronkan data terbaru dari Google Sheet...
              </span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: T.muted, letterSpacing: "0.04em" }}>mohon tunggu</span>
            </div>
            <LinearProgress sx={{ mt: 0.75, height: 3, borderRadius: 999, bgcolor: "rgba(35,57,113,0.1)", "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: T.brand } }} />
          </div>
        )}

        {/* ── Body ── */}
        {showFullLoadingState ? (
          <LoadingTableState syncing={syncing} />
        ) : sheetRows.length === 0 ? (

          /* Empty state */
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, padding: "40px 56px", border: `1.5px dashed ${T.brandBorder}`, borderRadius: 20, background: `${T.brandLight}60`, maxWidth: 380, textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: T.white, border: `1.5px solid ${T.brandBorder}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 14px rgba(35,57,113,0.08)` }}>
                <TableChartRoundedIcon style={{ fontSize: 24, color: T.brand }} />
              </div>
              <div>
                <p style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 700, color: T.ink, margin: "0 0 8px" }}>
                  Belum ada data
                </p>
                <p style={{ fontFamily: FONT_SANS, fontSize: 12, color: T.muted, margin: 0, lineHeight: 1.65 }}>
                  Klik <strong style={{ color: T.brand }}>Sync</strong> di header untuk memuat data dari sheet INPUT
                </p>
              </div>
              {gsheetSavedUrlRef.current && (
                <CreateButton variant="detail" onClick={handleSync} disabled={syncing} style={{ gap: 6, paddingInline: 22 }}>
                  {syncing ? <CircularProgress size={13} sx={{ color: T.brand }} /> : <SyncRoundedIcon style={{ fontSize: 15 }} />}
                  {syncing ? "Memuat..." : "Sync Sekarang"}
                </CreateButton>
              )}
            </div>
          </div>

        ) : (

          /* Data table */
          <div className="users-table-wrapper" style={{ flex: 1, minHeight: 0, margin: "10px 16px 0 16px" }}>
            <table className="users-table" style={{ fontFamily: FONT_SANS }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                <tr>
                  <th style={{ width: 40, textAlign: "center", userSelect: "none", background: "rgba(24,43,88,0.04)" }}>No</th>
                  {sheetHeaders.map((h) => {
                    const field = pdfFieldLabel(h.key);
                    return (
                      <th key={h.key} style={{ whiteSpace: "nowrap", background: "rgba(24,43,88,0.04)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {h.label}
                          {field && (
                            <span className="users-table__status users-table__status--app users-table__status--inline"
                              style={{ fontSize: 9, textTransform: "none", display: "inline-flex", alignItems: "center", gap: 3 }}>
                              <PictureAsPdfRoundedIcon style={{ fontSize: 9 }} />
                              {PDF_FIELD_LABELS[field] || field}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                  <th style={{ width: 44, background: "rgba(24,43,88,0.04)" }} />
                </tr>
              </thead>
              <tbody>
                {filteredRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map(({ row, index: i }) => {
                  const isCell = (k) => editingCell?.row === i && editingCell?.colKey === k;
                  return (
                    <tr key={i} className="users-table__row" style={{ background: i % 2 !== 0 ? T.surface : T.white, cursor: "default" }}>
                      <td style={{ textAlign: "center", width: 40, userSelect: "none", color: T.subtle, fontWeight: 600 }}>
                        {i + 1}
                      </td>
                      {sheetHeaders.map((h) => {
                        const active   = isCell(h.key);
                        const isMapped = isPdfCol(h.key);
                        const raw      = row[h.key];
                        const hasValue = raw !== null && raw !== undefined && String(raw) !== "";
                        const isTagihan = h.key === pdfMapping.tagihan || h.label.toLowerCase().includes("tagihan");
                        const displayText = (isTagihan && hasValue && !active)
                          ? formatCurrency(raw)
                          : String(raw ?? "");
                        return (
                          <td key={h.key} onClick={() => handleCellClick(i, h.key)}
                            style={{ minWidth: 90, cursor: "text", background: active ? T.brandLight : undefined, borderLeft: isMapped ? `2.5px solid ${T.brandBorder}` : undefined }}>
                            {active ? (
                              <Box component="input" autoFocus value={String(row[h.key] ?? "")}
                                onChange={(e) => handleCellChange(i, h.key, e.target.value)}
                                onBlur={handleCellBlur} onKeyDown={(e) => handleCellKey(e, i)} sx={cellInputSx} />
                            ) : (
                              <span style={{
                                fontFamily:  h.key === pdfMapping.noInvoice ? FONT_MONO : FONT_SANS,
                                fontSize:    12,
                                fontWeight:  h.key === pdfMapping.customer ? 600 : h.key === pdfMapping.noInvoice ? 700 : 400,
                                color:       isTagihan ? T.green : h.key === pdfMapping.noInvoice ? T.brand : h.key === pdfMapping.customer ? T.ink : T.text,
                              }}>
                                {displayText || <span style={{ color: T.subtle, fontStyle: "italic", fontWeight: 400 }}>—</span>}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td style={{ textAlign: "center", width: 44 }}>
                        <button onClick={() => deleteRow(i)}
                          className="users-table__accordion-button users-table__accordion-button--danger"
                          style={{ width: 32, height: 32, minHeight: "unset", padding: 0 }}>
                          <DeleteOutlineRoundedIcon style={{ fontSize: 16 }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {filteredRows.length > 0 && (
          <div className="users-table-pagination" style={{ padding: "0 24px", borderTop: `1px solid ${T.line}`, marginTop: 0 }}>
            <div className="users-table-pagination__meta">
              <p className="users-table-pagination__summary">
                {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filteredRows.length)} dari{" "}
                <strong>{filteredRows.length}</strong> baris
                {searchQuery && <span style={{ marginLeft: 6, color: T.brand, fontWeight: 600 }}>· filter aktif</span>}
              </p>
              <label className="users-table-pagination__page-size">
                <span>Tampilkan</span>
                <select className="users-table-pagination__select" value={rowsPerPage}
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>baris</span>
              </label>
            </div>
            <div className="users-table-pagination__controls">
              <CreateButton variant="pagination" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                <ChevronLeftRoundedIcon style={{ fontSize: 16 }} /> Sebelumnya
              </CreateButton>
              {Array.from({ length: totalPages }, (_, i) => i)
                .filter(i => i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1)
                .reduce((acc, i, idx, arr) => {
                  if (idx > 0 && i - arr[idx - 1] > 1) acc.push("...");
                  acc.push(i);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "..." ? (
                    <span key={`dot-${idx}`} className="users-table-pagination__ellipsis">...</span>
                  ) : (
                    <CreateButton key={item} variant="pagination" active={item === page} onClick={() => setPage(item)}>
                      {item + 1}
                    </CreateButton>
                  )
                )}
              <CreateButton variant="pagination" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                Berikutnya <ChevronRightRoundedIcon style={{ fontSize: 16 }} />
              </CreateButton>
            </div>
          </div>
        )}
      </section>

      <Snackbar open={toast.open} autoHideDuration={3200} onClose={() => setToast((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={toast.severity} variant="filled" sx={{ borderRadius: "12px", fontFamily: FONT_SANS, boxShadow: "0 8px 24px rgba(0,0,0,0.14)" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
