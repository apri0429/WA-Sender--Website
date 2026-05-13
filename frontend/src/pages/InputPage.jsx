import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  LinearProgress,
  Snackbar,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
  Select,
  MenuItem,
} from "@mui/material";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import api from "../services/api";

const FONT_SANS = "'Plus Jakarta Sans', 'Inter', sans-serif";
const FONT_MONO = "'JetBrains Mono', 'Fira Code', monospace";

const T = {
  brand: "#1a4ba8",
  brandDark: "#0f2460",
  brandLight: "#eef2fc",
  brandBorder: "#c5d0e8",
  green: "#0c4232",
  greenLight: "#e6f5ee",
  ink: "#111827",
  text: "#374151",
  muted: "#6b7280",
  subtle: "#9ca3af",
  line: "#e5e7eb",
  surface: "#f9fafb",
  white: "#ffffff",
  red: "#dc2626",
  redBg: "#fef2f2",
};

function formatCurrency(v) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(v) || 0);
}

const cellInputSx = {
  width: "100%", border: `1.5px solid ${T.brand}`, borderRadius: "5px",
  px: "6px", py: "3px", fontFamily: FONT_SANS, fontSize: 12, outline: "none",
  bgcolor: "rgba(255,255,255,0.9)", color: T.ink, minWidth: 80,
  "&:focus": { borderColor: T.brandDark },
};

function LoadingTableState({ syncing }) {
  return (
    <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <Box sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${T.line}`, bgcolor: `${T.brand}05` }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 700, color: T.ink }}>
              {syncing ? "Menyinkronkan data sheet" : "Menyiapkan halaman input"}
            </Typography>
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12, color: T.muted, mt: 0.35 }}>
              {syncing ? "Mengambil header, baris, dan mapping PDF dari Google Sheet..." : "Memeriksa konfigurasi dan memuat data terakhir..."}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.25, py: 0.75, borderRadius: "999px", bgcolor: T.white, border: `1px solid ${T.brandBorder}` }}>
            <CircularProgress size={16} sx={{ color: T.brand }} />
            <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11.5, fontWeight: 700, color: T.brand }}>
              {syncing ? "SYNCING" : "LOADING"}
            </Typography>
          </Box>
        </Box>
        <LinearProgress sx={{ mt: 1.25, height: 5, borderRadius: 999, bgcolor: T.brandLight, "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: T.brand } }} />
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden", p: 2, bgcolor: T.white }}>
        <Box sx={{ border: `1px solid ${T.line}`, borderRadius: "12px", overflow: "hidden" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "60px 1.3fr 1fr 0.9fr 0.9fr", gap: 0, borderBottom: `1px solid ${T.line}`, bgcolor: T.brandLight }}>
            {["No", "Customer", "Invoice", "Tagihan", "Tempo"].map((label) => (
              <Box key={label} sx={{ px: 2, py: 1.2 }}>
                <Skeleton variant="text" width={label === "Customer" ? "70%" : "55%"} sx={{ bgcolor: "rgba(26,75,168,0.12)", transform: "none" }} />
              </Box>
            ))}
          </Box>
          {Array.from({ length: 7 }).map((_, rowIdx) => (
            <Box
              key={rowIdx}
              sx={{
                display: "grid",
                gridTemplateColumns: "60px 1.3fr 1fr 0.9fr 0.9fr",
                borderBottom: rowIdx === 6 ? "none" : `1px solid ${T.line}`,
                bgcolor: rowIdx % 2 === 0 ? T.white : T.surface,
              }}
            >
              <Box sx={{ px: 2, py: 1.1 }}>
                <Skeleton variant="text" width="35%" sx={{ bgcolor: "rgba(148,163,184,0.18)", transform: "none" }} />
              </Box>
              <Box sx={{ px: 2, py: 1.1 }}>
                <Skeleton variant="text" width={`${72 - rowIdx * 4}%`} sx={{ bgcolor: "rgba(148,163,184,0.18)", transform: "none" }} />
              </Box>
              <Box sx={{ px: 2, py: 1.1 }}>
                <Skeleton variant="text" width={`${58 + (rowIdx % 3) * 8}%`} sx={{ bgcolor: "rgba(148,163,184,0.18)", transform: "none" }} />
              </Box>
              <Box sx={{ px: 2, py: 1.1 }}>
                <Skeleton variant="text" width={`${50 + (rowIdx % 2) * 14}%`} sx={{ bgcolor: "rgba(12,66,50,0.14)", transform: "none" }} />
              </Box>
              <Box sx={{ px: 2, py: 1.1 }}>
                <Skeleton variant="text" width={`${44 + (rowIdx % 4) * 9}%`} sx={{ bgcolor: "rgba(148,163,184,0.18)", transform: "none" }} />
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default function InputPage() {
  const navigate = useNavigate();
  const [sheetHeaders, setSheetHeaders] = useState([]);
  const [sheetRows, setSheetRows]       = useState([]);
  const [pdfMapping, setPdfMapping]     = useState({});

  const [gsheetUrl, setGsheetUrl]       = useState("");
  const [gsheetUrlEdit, setGsheetUrlEdit] = useState(false);
  const [syncing, setSyncing]           = useState(false);
  const [loading, setLoading]           = useState(true);
  const [savingPdf, setSavingPdf]       = useState(false);
  const [pdfSaved, setPdfSaved]         = useState(false);

  const [rowsPerPage, setRowsPerPage]   = useState(25);
  const [page, setPage]                 = useState(0);
  const [searchQuery, setSearchQuery]   = useState("");
  const [editingCell, setEditingCell]   = useState(null);
  const [toast, setToast]               = useState({ open: false, message: "", severity: "success" });
  const [headerSlot, setHeaderSlot]     = useState(null);

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

  const isPdfCol = (key) => Object.values(pdfMapping).includes(key);
  const pdfFieldLabel = (key) => {
    const e = Object.entries(pdfMapping).find(([, v]) => v === key);
    return e ? e[0] : null;
  };

  const mappedRows = sheetRows.map((row, index) => ({ row, index }));
  const filteredRows = mappedRows.filter(({ row }) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return sheetHeaders.some(h => String(row[h.key] ?? "").toLowerCase().includes(q));
  });
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const showFullLoadingState = loading || (syncing && sheetRows.length === 0);

  return (
    <Box sx={{ fontFamily: FONT_SANS, p: 2, display: "flex", flexDirection: "column", gap: 1.5, height: "calc(100vh - 64px)", boxSizing: "border-box", overflow: "hidden" }}>

      {/* ── Header portal (Sync + GSheet link) ── */}
      {headerSlot && createPortal(
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          {gsheetSavedUrlRef.current ? (
            <Box component="a" href={gsheetSavedUrlRef.current} target="_blank" rel="noopener noreferrer"
              sx={{ display: "flex", alignItems: "center", gap: 0.5, height: 32, px: 1.25, borderRadius: "8px", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: "#fff", textDecoration: "none", border: "1.5px solid rgba(255,255,255,0.45)", bgcolor: "rgba(255,255,255,0.18)", transition: "all 0.2s", "&:hover": { bgcolor: "rgba(255,255,255,0.28)", borderColor: "rgba(255,255,255,0.7)" } }}>
              <TableChartRoundedIcon sx={{ fontSize: 14 }} />
              Buka Google Sheet
              <OpenInNewRoundedIcon sx={{ fontSize: 11, opacity: 0.8 }} />
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, height: 32, px: 1.25, borderRadius: "8px", fontFamily: FONT_SANS, fontSize: 12, color: "rgba(255,255,255,0.55)", fontStyle: "italic", border: "1px solid rgba(255,255,255,0.15)", bgcolor: "rgba(255,255,255,0.08)" }}>
              <TableChartRoundedIcon sx={{ fontSize: 14 }} />
              Belum dikonfigurasi
            </Box>
          )}
          <Button onClick={handleSync} disabled={syncing || !gsheetSavedUrlRef.current}
            startIcon={syncing ? <CircularProgress size={12} sx={{ color: T.brand }} /> : <SyncRoundedIcon sx={{ fontSize: 15 }} />}
            sx={{ height: 32, px: 1.5, borderRadius: "8px", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 700, textTransform: "none", color: T.brand, bgcolor: "rgba(255,255,255,0.95)", border: "none", boxShadow: "0 1px 6px rgba(0,0,0,0.2)", transition: "all 0.2s", "&:hover": { bgcolor: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,0.25)" }, "&:disabled": { bgcolor: "rgba(255,255,255,0.45)", color: "rgba(26,75,168,0.5)", boxShadow: "none" } }}>
            {syncing ? "Menyinkron..." : "Sync"}
          </Button>
        </Box>,
        headerSlot
      )}

      {/* ── Main Table Card ── */}
      <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, minHeight: 0, borderRadius: "14px", border: `1px solid ${T.line}`, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", bgcolor: T.white, overflow: "hidden" }}>

        {/* Card header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.25, borderBottom: `1px solid ${T.line}`, bgcolor: T.white, gap: 1.5, flexWrap: "wrap", flexShrink: 0 }}>
          {/* Left: title + stats */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <TableChartRoundedIcon sx={{ fontSize: 17, color: T.brand }} />
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 700, color: T.ink }}>
              Sheet INPUT
            </Typography>
            {sheetRows.length > 0 && (
              <Box sx={{ px: 1, py: 0.25, borderRadius: "5px", bgcolor: T.brandLight, border: `1px solid ${T.brandBorder}` }}>
                <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11, color: T.brand, fontWeight: 600 }}>
                  {sheetRows.length} baris &bull; {sheetHeaders.length} kolom
                </Typography>
              </Box>
            )}
          </Box>

          {/* Right: search + save + add */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <TextField size="small"
              placeholder="Cari..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 14, color: T.muted }} /></InputAdornment> }}
              sx={{ width: 145, "& .MuiOutlinedInput-root": { fontFamily: FONT_SANS, fontSize: 12, borderRadius: "8px", height: 32, "& fieldset": { borderColor: T.line }, "&:hover fieldset": { borderColor: T.brandBorder }, "&.Mui-focused fieldset": { borderColor: T.brand } } }}
            />
            {sheetRows.length > 0 && (
              <Button onClick={handleSaveForPdf} disabled={savingPdf || pdfSaved}
                startIcon={savingPdf ? <CircularProgress size={12} color="inherit" /> : pdfSaved ? <CheckCircleOutlineRoundedIcon sx={{ fontSize: 14 }} /> : <PictureAsPdfRoundedIcon sx={{ fontSize: 14 }} />}
                sx={{ height: 32, px: 1.5, borderRadius: "8px", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, textTransform: "none", bgcolor: pdfSaved ? T.green : T.brand, color: "#fff", boxShadow: "none", flexShrink: 0, "&:hover": { bgcolor: pdfSaved ? "#0a3228" : T.brandDark, boxShadow: "none" }, "&:disabled": { opacity: 0.7 } }}>
                {pdfSaved ? "Tersimpan" : "Simpan ke PDF"}
              </Button>
            )}
          </Box>
        </Box>

        {/* Pagination bar */}
        {filteredRows.length > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 0.75, borderBottom: `1px solid ${T.line}`, bgcolor: T.surface, flexWrap: "wrap", gap: 1, flexShrink: 0 }}>
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.muted }}>
              {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filteredRows.length)} dari {filteredRows.length} baris
              {searchQuery && <Box component="span" sx={{ ml: 0.75, color: T.brand, fontWeight: 600 }}>· filter aktif</Box>}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.subtle }}>Tampilkan:</Typography>
              <Select size="small" value={rowsPerPage} onChange={(e) => { setRowsPerPage(e.target.value); setPage(0); }}
                sx={{ height: 26, fontFamily: FONT_MONO, fontSize: 11.5, fontWeight: 600, color: T.brand, bgcolor: T.brandLight, "& .MuiOutlinedInput-notchedOutline": { border: `1px solid ${T.brandBorder}`, borderRadius: "6px" }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: T.brand }, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: T.brand }, "& .MuiSelect-select": { py: 0, pl: 1, pr: 3 } }}>
                <MenuItem value={25} sx={{ fontFamily: FONT_MONO, fontSize: 12 }}>25 baris</MenuItem>
                <MenuItem value={50} sx={{ fontFamily: FONT_MONO, fontSize: 12 }}>50 baris</MenuItem>
                <MenuItem value={100} sx={{ fontFamily: FONT_MONO, fontSize: 12 }}>100 baris</MenuItem>
              </Select>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton size="small" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                sx={{ width: 26, height: 26, color: T.brand, "&:disabled": { opacity: 0.3 } }}>
                <ChevronLeftRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11.5, color: T.ink, minWidth: 44, textAlign: "center" }}>
                {page + 1} / {totalPages}
              </Typography>
              <IconButton size="small" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                sx={{ width: 26, height: 26, color: T.brand, "&:disabled": { opacity: 0.3 } }}>
                <ChevronRightRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Box>
        )}

        {syncing && sheetRows.length > 0 && (
          <Box sx={{ px: 2, py: 0.9, borderBottom: `1px solid ${T.line}`, bgcolor: `${T.brand}05`, flexShrink: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
              <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: T.brand }}>
                Menyinkronkan data terbaru dari Google Sheet...
              </Typography>
              <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11, color: T.muted }}>
                mohon tunggu
              </Typography>
            </Box>
            <LinearProgress sx={{ mt: 0.8, height: 4, borderRadius: 999, bgcolor: T.brandLight, "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: T.brand } }} />
          </Box>
        )}

        {/* Empty state */}
        {showFullLoadingState ? (
          <LoadingTableState syncing={syncing} />
        ) : sheetRows.length === 0 ? (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1.5, p: 6 }}>
            <TableChartRoundedIcon sx={{ fontSize: 42, color: T.subtle }} />
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: T.muted }}>Belum ada data</Typography>
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12.5, color: T.subtle, textAlign: "center" }}>
              Klik <strong>Sync</strong> di header untuk memuat data dari sheet INPUT
            </Typography>
            {gsheetSavedUrlRef.current && (
              <Button onClick={handleSync} disabled={syncing}
                startIcon={syncing ? <CircularProgress size={13} color="inherit" /> : <SyncRoundedIcon sx={{ fontSize: 15 }} />}
                sx={{ mt: 0.5, height: 36, px: 2.5, borderRadius: "8px", fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: 600, textTransform: "none", bgcolor: T.brand, color: "#fff", boxShadow: "none", "&:hover": { bgcolor: T.brandDark, boxShadow: "none" } }}>
                {syncing ? "Memuat..." : "Sync Sekarang"}
              </Button>
            )}
          </Box>
        ) : (
          <Box sx={{ overflow: "auto", flexGrow: 1, minHeight: 0 }}>
            <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_SANS, fontSize: 12 }}>
              <Box component="thead" sx={{ position: "sticky", top: 0, zIndex: 10 }}>
                <Box component="tr" sx={{ bgcolor: T.brandLight, borderBottom: `2px solid ${T.brandBorder}` }}>
                  <Box component="th" sx={{ color: T.brandDark, fontSize: 11, fontWeight: 700, px: 2, py: 1.25, width: 40, userSelect: "none", textAlign: "center" }}>No</Box>
                  {sheetHeaders.map((h) => {
                    const field = pdfFieldLabel(h.key);
                    return (
                      <Box component="th" key={h.key}
                        sx={{ color: T.brandDark, fontSize: 11, fontWeight: 700, px: 2, py: 1.25, whiteSpace: "nowrap", textAlign: "left" }}>
                        {h.label}
                        {field && (
                          <Box component="span" sx={{ display: "inline-block", fontSize: 9, fontWeight: 600, color: T.brand, bgcolor: T.white, px: 0.6, py: 0.2, borderRadius: "4px", ml: 1, border: `1px solid ${T.brandBorder}` }}>
                            {field}
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                  <Box component="th" sx={{ width: 40 }} />
                </Box>
              </Box>
              <Box component="tbody">
                {filteredRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map(({ row, index: i }) => {
                  const isCell = (k) => editingCell?.row === i && editingCell?.colKey === k;
                  return (
                    <Box component="tr" key={i}
                      sx={{ borderBottom: `1px solid ${T.line}`, transition: "background-color 0.1s", "&:last-child": { borderBottom: "none" }, bgcolor: i % 2 !== 0 ? T.surface : T.white, "&:hover": { bgcolor: T.brandLight } }}>
                      <Box component="td" sx={{ px: 2, py: 1, color: T.subtle, fontSize: 11, fontWeight: 500, userSelect: "none", textAlign: "center" }}>{i + 1}</Box>
                      {sheetHeaders.map((h) => {
                        const active = isCell(h.key);
                        const isMapped = isPdfCol(h.key);
                        const raw = row[h.key];
                        const displayText = (h.key === pdfMapping.tagihan && raw && !active)
                          ? formatCurrency(raw) : String(raw ?? "");
                        return (
                          <Box component="td" key={h.key}
                            onClick={() => handleCellClick(i, h.key)}
                            sx={{
                              px: 1.5, py: 0.875, minWidth: 90, cursor: "text",
                              ...(active ? { bgcolor: T.brandLight } : {}),
                              ...(isMapped ? { borderLeft: `2px solid ${T.brandBorder}` } : {}),
                            }}>
                            {active ? (
                              <Box component="input" autoFocus
                                value={String(row[h.key] ?? "")}
                                onChange={(e) => handleCellChange(i, h.key, e.target.value)}
                                onBlur={handleCellBlur}
                                onKeyDown={(e) => handleCellKey(e, i)}
                                sx={cellInputSx}
                              />
                            ) : (
                              <Typography sx={{
                                fontFamily: h.key === pdfMapping.noInvoice ? FONT_MONO : FONT_SANS,
                                fontSize: 12,
                                fontWeight: h.key === pdfMapping.customer ? 600 : h.key === pdfMapping.noInvoice ? 700 : 400,
                                color: h.key === pdfMapping.tagihan ? T.green
                                  : h.key === pdfMapping.noInvoice ? T.brand
                                  : h.key === pdfMapping.customer ? T.ink : T.text,
                                lineHeight: 1.4,
                              }}>
                                {displayText || <Box component="span" sx={{ color: T.subtle, fontStyle: "italic", fontWeight: 400, fontFamily: FONT_SANS }}>—</Box>}
                              </Typography>
                            )}
                          </Box>
                        );
                      })}
                      <Box component="td" sx={{ px: 0.5, textAlign: "center", width: 40, userSelect: "none" }}>
                        <Tooltip title="Hapus baris">
                          <IconButton
                            size="small"
                            onClick={() => deleteRow(i)}
                            sx={{
                              width: 28,
                              height: 28,
                              color: T.subtle,
                              borderRadius: "8px",
                              transition: "all 0.16s ease",
                              "&:hover": {
                                color: T.red,
                                bgcolor: T.redBg,
                                transform: "translateY(-1px)",
                              },
                            }}
                          >
                            <DeleteForeverRoundedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* Legend (Dipindah ke dalam card, tapi di footer agar tidak merusak scroll height) */}
      {sheetHeaders.length > 0 && Object.keys(pdfMapping).length > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1, bgcolor: T.white, borderTop: `1px solid ${T.line}`, borderBottomLeftRadius: "14px", borderBottomRightRadius: "14px" }}>
          <Box sx={{ width: 12, height: 12, borderLeft: `2.5px solid ${T.brandBorder}`, flexShrink: 0 }} />
          <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11, color: T.muted }}>
            Kolom dengan garis biru digunakan untuk Generate PDF
          </Typography>
        </Box>
      )}

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={toast.severity} variant="filled" sx={{ borderRadius: "10px", fontFamily: FONT_SANS }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
