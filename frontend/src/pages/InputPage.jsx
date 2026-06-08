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
import InfoOutlinedRoundedIcon from "@mui/icons-material/InfoOutlined";
import api from "../services/api";
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

function formatCurrency(v) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(v) || 0);
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px", borderBottom: `1px solid ${T.line}`, gap: 12, flexWrap: "wrap", flexShrink: 0, background: T.white }}>

          {/* Left: title group */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Icon box */}
            <div style={{ width: 32, height: 32, borderRadius: 9, background: T.brandLight, border: `1.5px solid ${T.brandBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <TableChartRoundedIcon style={{ fontSize: 16, color: T.brand }} />
            </div>
            {/* Title + badge */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: FONT_SANS, fontSize: 13.5, fontWeight: 700, color: T.ink, lineHeight: 1.1 }}>Sheet INPUT</span>
                {sheetRows.length > 0 && (
                  <span className="master-project-badge master-project-badge--active" style={{ fontFamily: FONT_MONO, fontSize: 10.5, minHeight: 20, padding: "0 8px" }}>
                    {sheetRows.length} baris · {sheetHeaders.length} kolom
                  </span>
                )}
              </div>
              <span style={{ fontFamily: FONT_SANS, fontSize: 11, color: T.muted, display: "block", marginTop: 2 }}>
                Data dari Google Sheet
              </span>
            </div>
          </div>

          {/* Right: actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Search */}
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <SearchRoundedIcon style={{ position: "absolute", left: 11, fontSize: 15, color: T.subtle, pointerEvents: "none" }} />
              <input
                type="text"
                placeholder="Cari data..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                style={{
                  height: 34, paddingLeft: 33, paddingRight: searchQuery ? 30 : 14, width: 176,
                  fontFamily: FONT_SANS, fontSize: 12.5, color: T.ink,
                  border: `1.5px solid ${searchQuery ? T.brand : T.line}`,
                  borderRadius: 999, background: T.white, outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s, width 0.25s",
                  boxShadow: searchQuery ? `0 0 0 3px ${T.brandLight}` : "none",
                }}
                onFocus={e => { e.target.style.borderColor = T.brand; e.target.style.boxShadow = `0 0 0 3px ${T.brandLight}`; e.target.style.width = "210px"; }}
                onBlur={e => { e.target.style.borderColor = searchQuery ? T.brand : T.line; e.target.style.boxShadow = searchQuery ? `0 0 0 3px ${T.brandLight}` : "none"; e.target.style.width = "176px"; }}
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setPage(0); }}
                  style={{ position: "absolute", right: 9, width: 17, height: 17, borderRadius: "50%", background: T.subtle, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = T.muted}
                  onMouseLeave={e => e.currentTarget.style.background = T.subtle}>
                  <CloseRoundedIcon style={{ fontSize: 11, color: "#fff" }} />
                </button>
              )}
            </div>

            {/* Generate PDF */}
            {sheetRows.length > 0 && (
              <button className="users-table-card__action" onClick={handleSaveForPdf} disabled={savingPdf || pdfSaved}
                style={{ minHeight: "unset", height: 34, paddingInline: 16, fontSize: 12.5, gap: 6, opacity: (savingPdf || pdfSaved) ? 0.72 : 1, boxShadow: (savingPdf || pdfSaved) ? "none" : undefined }}>
                {savingPdf
                  ? <CircularProgress size={13} sx={{ color: "#fff" }} />
                  : pdfSaved
                    ? <CheckCircleOutlineRoundedIcon style={{ fontSize: 14 }} />
                    : <PictureAsPdfRoundedIcon style={{ fontSize: 14 }} />}
                {pdfSaved ? "Tersimpan ✓" : "Generate PDF"}
              </button>
            )}
          </div>
        </div>

        {/* ── Pagination bar ── */}
        {filteredRows.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 20px", borderBottom: `1px solid ${T.line}`, background: T.surface, flexWrap: "wrap", gap: 8, flexShrink: 0 }}>
            {/* Info + rows-per-page */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.muted }}>
                <span style={{ fontWeight: 600, color: T.ink }}>{page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filteredRows.length)}</span>
                {" "}dari{" "}
                <span style={{ fontWeight: 600, color: T.ink }}>{filteredRows.length}</span>
                {" "}baris
                {searchQuery && <span style={{ marginLeft: 6, color: T.brand, fontWeight: 600 }}>· filter aktif</span>}
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
            {/* Navigation */}
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
          <div style={{ overflow: "auto", flex: 1, minHeight: 0 }}>
            <table className="users-table" style={{ fontFamily: FONT_SANS, fontSize: 12 }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                <tr style={{ background: T.brandLight, borderBottom: `1.5px solid ${T.brandBorder}` }}>
                  <th style={{ color: T.brandDark, fontSize: 10.5, fontWeight: 700, padding: "10px 16px", width: 40, userSelect: "none", textAlign: "center", background: T.brandLight, textTransform: "none", letterSpacing: 0 }}>
                    No
                  </th>
                  {sheetHeaders.map((h) => {
                    const field = pdfFieldLabel(h.key);
                    return (
                      <th key={h.key} style={{ color: T.brandDark, fontSize: 10.5, fontWeight: 700, padding: "10px 16px", whiteSpace: "nowrap", textAlign: "left", background: T.brandLight, textTransform: "none", letterSpacing: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {h.label}
                          {field && (
                            <span className="users-table__status users-table__status--app users-table__status--inline" style={{ fontSize: 9, letterSpacing: "0.03em" }}>
                              {field}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                  <th style={{ width: 44, background: T.brandLight }} />
                </tr>
              </thead>
              <tbody>
                {filteredRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map(({ row, index: i }) => {
                  const isCell = (k) => editingCell?.row === i && editingCell?.colKey === k;
                  return (
                    <tr key={i} className="users-table__row" style={{ background: i % 2 !== 0 ? T.surface : T.white }}>
                      <td style={{ padding: "8px 16px", color: T.subtle, fontSize: 11, fontWeight: 600, userSelect: "none", textAlign: "center", width: 40 }}>
                        {i + 1}
                      </td>
                      {sheetHeaders.map((h) => {
                        const active   = isCell(h.key);
                        const isMapped = isPdfCol(h.key);
                        const raw      = row[h.key];
                        const displayText = (h.key === pdfMapping.tagihan && raw && !active)
                          ? formatCurrency(raw)
                          : String(raw ?? "");
                        return (
                          <td key={h.key} onClick={() => handleCellClick(i, h.key)}
                            style={{ padding: "7px 12px", minWidth: 90, cursor: "text", background: active ? T.brandLight : undefined, borderLeft: isMapped ? `2.5px solid ${T.brandBorder}` : undefined }}>
                            {active ? (
                              <Box component="input" autoFocus value={String(row[h.key] ?? "")}
                                onChange={(e) => handleCellChange(i, h.key, e.target.value)}
                                onBlur={handleCellBlur} onKeyDown={(e) => handleCellKey(e, i)} sx={cellInputSx} />
                            ) : (
                              <span style={{
                                fontFamily:  h.key === pdfMapping.noInvoice ? FONT_MONO : FONT_SANS,
                                fontSize:    12,
                                fontWeight:  h.key === pdfMapping.customer ? 600 : h.key === pdfMapping.noInvoice ? 700 : 400,
                                color:       h.key === pdfMapping.tagihan ? T.green : h.key === pdfMapping.noInvoice ? T.brand : h.key === pdfMapping.customer ? T.ink : T.text,
                                lineHeight:  1.4,
                              }}>
                                {displayText || <span style={{ color: T.subtle, fontStyle: "italic", fontWeight: 400, fontFamily: FONT_SANS }}>—</span>}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td style={{ padding: "4px 8px", textAlign: "center", width: 44 }}>
                        <button onClick={() => deleteRow(i)}
                          style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${T.line}`, background: T.surface, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: T.subtle, transition: "all 0.15s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = T.redBg; e.currentTarget.style.color = T.red; e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.transform = "scale(1.05)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = T.surface; e.currentTarget.style.color = T.subtle; e.currentTarget.style.borderColor = T.line; e.currentTarget.style.transform = "none"; }}>
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

        {/* ── Footer legend ── */}
        {sheetHeaders.length > 0 && Object.keys(pdfMapping).length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 20px", borderTop: `1px solid ${T.line}`, background: T.surface, flexShrink: 0 }}>
            <InfoOutlinedRoundedIcon style={{ fontSize: 14, color: T.brandBorder, flexShrink: 0 }} />
            <span style={{ fontFamily: FONT_SANS, fontSize: 11, color: T.muted }}>
              Kolom dengan garis biru digunakan untuk{" "}
              <span style={{ color: T.brand, fontWeight: 600 }}>Generate PDF</span>
            </span>
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
