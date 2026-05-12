import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
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

function Panel({ children, sx = {} }) {
  return (
    <Box sx={{ bgcolor: T.white, borderRadius: "14px", border: `1px solid ${T.line}`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)", overflow: "hidden", ...sx }}>
      {children}
    </Box>
  );
}

const cellInputSx = {
  width: "100%", border: `1.5px solid ${T.brand}`, borderRadius: "5px",
  px: "6px", py: "3px", fontFamily: FONT_SANS, fontSize: 11.5, outline: "none",
  bgcolor: T.brandLight, color: T.ink, minWidth: 80,
  "&:focus": { borderColor: T.brandDark },
};

// Keys used for PDF generation
const PDF_FIELD_KEYS = ["noInvoice", "tanggalInvoice", "termin", "customer", "tagihan", "tempo", "penagih"];

export default function InputPage() {
  // Sheet data (from /api/gsheet/input — raw INPUT sheet columns)
  const [sheetHeaders, setSheetHeaders] = useState([]); // [{key, label}]
  const [sheetRows, setSheetRows] = useState([]);        // [{c0: val, c1: val, ...}]
  const [pdfMapping, setPdfMapping] = useState({});      // {noInvoice: 'c0', customer: 'c4', ...}

  const [gsheetUrl, setGsheetUrl] = useState("");
  const [gsheetUrlEdit, setGsheetUrlEdit] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [savingPdf, setSavingPdf] = useState(false);
  const [pdfSaved, setPdfSaved] = useState(false);

  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage] = useState(0);
  const [editingCell, setEditingCell] = useState(null); // { row, colKey, orig }
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const gsheetSavedUrlRef = useRef("");
  const rowsRef = useRef([]);
  const skipBlurRef = useRef(false);

  rowsRef.current = sheetRows;

  const showToast = (msg, sev = "success") => setToast({ open: true, message: msg, severity: sev });

  useEffect(() => {
    api.get("/gsheet").then((res) => {
      const url = res?.data?.url || "";
      setGsheetUrl(url);
      gsheetSavedUrlRef.current = url;
      setGsheetUrlEdit(!url);
    }).catch(() => {});
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
    setSyncing(true);
    setPdfSaved(false);
    try {
      const res = await api.get("/gsheet/input");
      const d = res?.data || {};
      setSheetHeaders(Array.isArray(d.headers) ? d.headers : []);
      setSheetRows(Array.isArray(d.rows) ? d.rows : []);
      setPdfMapping(d.pdfMapping || {});
      setPage(0);
      showToast(`${(d.rows || []).length} baris dimuat dari sheet INPUT`, "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Gagal sync dari GSheet", "error");
    } finally {
      setSyncing(false);
    }
  };

  // Map current sheet rows to PDF temporary format and save
  const handleSaveForPdf = async () => {
    if (!sheetRows.length) { showToast("Tidak ada data untuk disimpan", "warning"); return; }
    setSavingPdf(true);
    try {
      const mapped = sheetRows.map((row) => ({
        noInvoice:      String(row[pdfMapping.noInvoice]      ?? ""),
        tanggalInvoice: String(row[pdfMapping.tanggalInvoice] ?? ""),
        termin:         String(row[pdfMapping.termin]         ?? ""),
        customer:       String(row[pdfMapping.customer]       ?? ""),
        tagihan:        Number(row[pdfMapping.tagihan])        || 0,
        tempo:          String(row[pdfMapping.tempo]          ?? ""),
        penagih:        String(row[pdfMapping.penagih]        ?? ""),
      })).filter(r => r.noInvoice || r.customer || r.tagihan);
      await api.put("/pdf/temporary/rows", { rows: mapped });
      setPdfSaved(true);
      showToast(`${mapped.length} baris siap untuk Generate PDF`, "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Gagal simpan untuk PDF", "error");
    } finally {
      setSavingPdf(false);
    }
  };

  // Cell editing
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
      } else {
        setEditingCell(null);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const keys = sheetHeaders.map(h => h.key);
      const ci = keys.indexOf(editingCell?.colKey);
      skipBlurRef.current = true;
      if (!e.shiftKey) {
        if (ci < keys.length - 1) {
          setEditingCell({ row: rowIdx, colKey: keys[ci + 1], orig: rowsRef.current[rowIdx]?.[keys[ci + 1]] });
        } else if (rowIdx < rowsRef.current.length - 1) {
          setEditingCell({ row: rowIdx + 1, colKey: keys[0], orig: rowsRef.current[rowIdx + 1]?.[keys[0]] });
        } else {
          setEditingCell(null);
        }
      } else {
        if (ci > 0) {
          setEditingCell({ row: rowIdx, colKey: keys[ci - 1], orig: rowsRef.current[rowIdx]?.[keys[ci - 1]] });
        } else if (rowIdx > 0) {
          setEditingCell({ row: rowIdx - 1, colKey: keys[keys.length - 1], orig: rowsRef.current[rowIdx - 1]?.[keys[keys.length - 1]] });
        } else {
          setEditingCell(null);
        }
      }
      setTimeout(() => { skipBlurRef.current = false; }, 50);
    } else if (e.key === "Escape") {
      skipBlurRef.current = true;
      if (editingCell) {
        setSheetRows((prev) => prev.map((r, i) => i === rowIdx ? { ...r, [editingCell.colKey]: editingCell.orig } : r));
      }
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
    const lastPage = Math.floor(newRowIdx / rowsPerPage);
    setPage(lastPage);
    setEditingCell({ row: newRowIdx, colKey: sheetHeaders[0]?.key, orig: "" });
  };

  const deleteRow = (idx) => {
    const newRows = sheetRows.filter((_, i) => i !== idx);
    setSheetRows(newRows);
    setPdfSaved(false);
    if (editingCell?.row === idx) setEditingCell(null);
  };

  // Check if a column key is used for PDF mapping
  const isPdfCol = (key) => Object.values(pdfMapping).includes(key);
  const pdfFieldLabel = (key) => {
    const entry = Object.entries(pdfMapping).find(([, v]) => v === key);
    return entry ? entry[0] : null;
  };

  return (
    <Box sx={{ fontFamily: FONT_SANS, p: 2, display: "flex", flexDirection: "column", gap: 2 }}>

      {/* ── Kontrol GSheet ── */}
      <Panel>
        <Box sx={{ px: 2.5, py: 2, display: "flex", flexDirection: "column", gap: 1.25 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>

            {gsheetUrlEdit ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, minWidth: 260 }}>
                <TextField size="small" fullWidth autoFocus
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={gsheetUrl}
                  onChange={(e) => setGsheetUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGSheetSaveUrl()}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LinkRoundedIcon sx={{ fontSize: 15, color: T.muted }} /></InputAdornment>,
                    sx: { fontFamily: FONT_SANS, fontSize: 12, borderRadius: "9px" },
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: T.brandBorder }, "&:hover fieldset": { borderColor: T.brand }, "&.Mui-focused fieldset": { borderColor: T.brand } } }}
                />
                <Button onClick={handleGSheetSaveUrl} disabled={!gsheetUrl.trim()}
                  sx={{ height: 40, px: 2, borderRadius: "9px", fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: 600, textTransform: "none", border: `1.5px solid ${T.brandBorder}`, color: T.brand, bgcolor: T.brandLight, boxShadow: "none", whiteSpace: "nowrap", flexShrink: 0, "&:hover": { bgcolor: "#dce7f9", boxShadow: "none" }, "&:disabled": { opacity: 0.5 } }}>
                  Simpan
                </Button>
                {gsheetSavedUrlRef.current && (
                  <IconButton size="small" onClick={() => { setGsheetUrl(gsheetSavedUrlRef.current); setGsheetUrlEdit(false); }} sx={{ color: T.muted, "&:hover": { bgcolor: T.surface }, flexShrink: 0 }}>
                    <CloseRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.25, py: 0.75, borderRadius: "9px", bgcolor: T.brandLight, border: `1px solid ${T.brandBorder}`, flex: 1, minWidth: 200 }}>
                <TableChartRoundedIcon sx={{ fontSize: 14, color: T.brand, flexShrink: 0 }} />
                {gsheetSavedUrlRef.current ? (
                  <Box component="a" href={gsheetSavedUrlRef.current} target="_blank" rel="noopener noreferrer"
                    sx={{ flex: 1, display: "flex", alignItems: "center", gap: 0.5, fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: T.brand, textDecoration: "none", overflow: "hidden", "&:hover": { textDecoration: "underline" } }}>
                    Buka Google Sheet
                    <OpenInNewRoundedIcon sx={{ fontSize: 12, flexShrink: 0 }} />
                  </Box>
                ) : (
                  <Typography sx={{ flex: 1, fontFamily: FONT_SANS, fontSize: 12, color: T.muted, fontStyle: "italic" }}>
                    Belum dikonfigurasi
                  </Typography>
                )}
                <Tooltip title="Ubah URL">
                  <IconButton size="small" onClick={() => setGsheetUrlEdit(true)} sx={{ color: T.muted, p: "3px", "&:hover": { bgcolor: "#dce7f9" } }}>
                    <EditRoundedIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                </Tooltip>
                <Button onClick={handleSync} disabled={syncing || !gsheetSavedUrlRef.current}
                  startIcon={syncing ? <CircularProgress size={11} color="inherit" /> : <SyncRoundedIcon sx={{ fontSize: 14 }} />}
                  sx={{ height: 32, px: 1.5, borderRadius: "7px", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, textTransform: "none", border: `1.5px solid ${T.brandBorder}`, color: T.brand, bgcolor: T.white, boxShadow: "none", whiteSpace: "nowrap", flexShrink: 0, "&:hover": { bgcolor: "#dce7f9" }, "&:disabled": { opacity: 0.5 } }}>
                  {syncing ? "Sync..." : "Sync dari GSheet"}
                </Button>
              </Box>
            )}

            {/* Stats + Save for PDF */}
            {sheetRows.length > 0 && (
              <>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                  <CheckCircleOutlineRoundedIcon sx={{ fontSize: 15, color: T.brand }} />
                  <Typography sx={{ fontFamily: FONT_MONO, fontSize: 12, color: T.brand, fontWeight: 600 }}>
                    {sheetRows.length} baris &bull; {sheetHeaders.length} kolom
                  </Typography>
                </Box>
                <Button onClick={handleSaveForPdf} disabled={savingPdf || pdfSaved}
                  startIcon={savingPdf ? <CircularProgress size={13} color="inherit" /> : pdfSaved ? <CheckCircleOutlineRoundedIcon sx={{ fontSize: 15 }} /> : <PictureAsPdfRoundedIcon sx={{ fontSize: 15 }} />}
                  sx={{ height: 36, px: 2, borderRadius: "9px", fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: 600, textTransform: "none", bgcolor: pdfSaved ? T.green : T.brand, color: "#fff", boxShadow: "none", flexShrink: 0, "&:hover": { bgcolor: pdfSaved ? "#0a3228" : T.brandDark, boxShadow: "none" }, "&:disabled": { opacity: 0.7 } }}>
                  {pdfSaved ? "Tersimpan untuk PDF" : "Simpan untuk Generate PDF"}
                </Button>
              </>
            )}
          </Box>

          {gsheetUrlEdit && gsheetUrl && !gsheetUrl.includes("/spreadsheets/d/") && (
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11, color: T.red }}>
              URL tidak valid. Gunakan link Google Sheets yang benar.
            </Typography>
          )}
        </Box>
      </Panel>

      {/* ── Tabel Data INPUT Sheet ── */}
      <Panel>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, py: 1.75, borderBottom: `1px solid ${T.line}`, bgcolor: `${T.brand}06` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box sx={{ width: 4, height: 18, borderRadius: "3px", bgcolor: T.brand, flexShrink: 0 }} />
            <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: `${T.brand}14`, display: "grid", placeItems: "center", "& svg": { fontSize: 15, color: T.brand } }}>
              <TableChartRoundedIcon />
            </Box>
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 13.5, fontWeight: 600, color: T.ink }}>
              Sheet INPUT
              {sheetRows.length > 0 && (
                <Box component="span" sx={{ fontFamily: FONT_MONO, fontSize: 11.5, color: T.muted, ml: 0.75 }}>({sheetRows.length} baris)</Box>
              )}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.subtle, display: { xs: "none", md: "block" } }}>
              Klik sel · Enter ↓ · Tab → · Esc batal
            </Typography>
            {sheetHeaders.length > 0 && (
              <Button onClick={addRow} startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
                sx={{ height: 32, px: 1.75, borderRadius: "8px", fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: 600, textTransform: "none", border: `1.5px solid ${T.brandBorder}`, color: T.brand, bgcolor: T.brandLight, boxShadow: "none", "&:hover": { bgcolor: "#dce7f9", boxShadow: "none" } }}>
                Tambah Baris
              </Button>
            )}
          </Box>
        </Box>

        {sheetRows.length === 0 ? (
          <Box sx={{ p: 6, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
            <TableChartRoundedIcon sx={{ fontSize: 44, color: T.subtle }} />
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: T.muted }}>Belum ada data</Typography>
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12.5, color: T.subtle }}>
              Klik <strong>Sync dari GSheet</strong> untuk memuat sheet INPUT
            </Typography>
            {gsheetSavedUrlRef.current && (
              <Button onClick={handleSync} disabled={syncing}
                startIcon={syncing ? <CircularProgress size={13} color="inherit" /> : <SyncRoundedIcon sx={{ fontSize: 15 }} />}
                sx={{ mt: 0.5, height: 38, px: 2.5, borderRadius: "9px", fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, textTransform: "none", bgcolor: T.brand, color: "#fff", boxShadow: "none", "&:hover": { bgcolor: T.brandDark, boxShadow: "none" } }}>
                {syncing ? "Memuat..." : "Sync Sekarang"}
              </Button>
            )}
          </Box>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_SANS, fontSize: 12 }}>
              <Box component="thead">
                <Box component="tr" sx={{ bgcolor: T.brandDark }}>
                  <Box component="th" sx={{ color: "#fff", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", px: 1.5, py: 1.1, whiteSpace: "nowrap", width: 36, userSelect: "none" }}>No</Box>
                  {sheetHeaders.map((h) => {
                    const field = pdfFieldLabel(h.key);
                    return (
                      <Box component="th" key={h.key}
                        sx={{ color: "#fff", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", px: 1.5, py: 1.1, whiteSpace: "nowrap", textAlign: "left", position: "relative" }}>
                        {h.label}
                        {field && (
                          <Box component="span" sx={{ display: "block", fontSize: 9, fontWeight: 400, color: `${T.brandLight}aa`, textTransform: "none", letterSpacing: 0, mt: 0.2 }}>
                            → {field}
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                  <Box component="th" sx={{ width: 36 }} />
                </Box>
              </Box>
              <Box component="tbody">
                {sheetRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((row, pageIdx) => {
                  const i = page * rowsPerPage + pageIdx;
                  const isCell = (k) => editingCell?.row === i && editingCell?.colKey === k;
                  return (
                    <Box component="tr" key={i}
                      sx={{ borderBottom: `1px solid ${T.line}`, "&:last-child": { borderBottom: "none" }, "&:nth-of-type(even)": { bgcolor: editingCell?.row === i ? "unset" : T.surface } }}>
                      <Box component="td" sx={{ px: 1.5, py: 0.8, color: T.subtle, fontSize: 10.5, userSelect: "none" }}>{i + 1}</Box>
                      {sheetHeaders.map((h) => {
                        const active = isCell(h.key);
                        const isMapped = isPdfCol(h.key);
                        const raw = row[h.key];
                        // Format currency for tagihan column
                        const tagihanKey = pdfMapping.tagihan;
                        const displayText = (h.key === tagihanKey && raw && !active)
                          ? formatCurrency(raw)
                          : String(raw ?? "");
                        return (
                          <Box component="td" key={h.key}
                            onClick={() => handleCellClick(i, h.key)}
                            sx={{
                              px: 1.5, py: 0.8, minWidth: 90,
                              ...(active
                                ? { bgcolor: `${T.brand}08` }
                                : { "&:hover": { bgcolor: isMapped ? `${T.brand}06` : `${T.brand}03`, cursor: "text" } }),
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
                                  : h.key === pdfMapping.customer ? T.ink
                                  : T.text,
                              }}>
                                {displayText || <Box component="span" sx={{ color: T.subtle, fontStyle: "italic", fontWeight: 400, fontFamily: FONT_SANS }}>—</Box>}
                              </Typography>
                            )}
                          </Box>
                        );
                      })}
                      <Box component="td" sx={{ px: 0.5, py: 0.5, textAlign: "center", width: 36, userSelect: "none" }}>
                        <Tooltip title="Hapus baris">
                          <IconButton size="small" onClick={() => deleteRow(i)} sx={{ color: T.subtle, "&:hover": { color: T.red, bgcolor: T.redBg } }}>
                            <DeleteOutlineRoundedIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  );
                })}

                {/* Add row */}
                <Box component="tr" onClick={addRow}
                  sx={{ borderTop: `1px dashed ${T.line}`, cursor: "pointer", "&:hover": { bgcolor: T.brandLight } }}>
                  <Box component="td" colSpan={sheetHeaders.length + 2} sx={{ px: 2, py: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <AddRoundedIcon sx={{ fontSize: 14, color: T.muted }} />
                      <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.muted }}>Tambah baris</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* Pagination bar */}
        {sheetRows.length > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, py: 1.25, borderTop: `1px solid ${T.line}`, bgcolor: T.surface, flexWrap: "wrap", gap: 1 }}>
            {/* Info */}
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12, color: T.muted }}>
              {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, sheetRows.length)} dari {sheetRows.length} baris
            </Typography>

            {/* Rows per page */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.muted, mr: 0.5 }}>Tampilkan:</Typography>
              {[25, 50, 100].map((n) => (
                <Button key={n} onClick={() => { setRowsPerPage(n); setPage(0); }}
                  sx={{ minWidth: 38, height: 26, px: 0.75, borderRadius: "6px", fontFamily: FONT_MONO, fontSize: 12, fontWeight: rowsPerPage === n ? 700 : 400, textTransform: "none", color: rowsPerPage === n ? T.brand : T.muted, bgcolor: rowsPerPage === n ? T.brandLight : "transparent", border: `1px solid ${rowsPerPage === n ? T.brandBorder : "transparent"}`, boxShadow: "none", "&:hover": { bgcolor: T.brandLight, boxShadow: "none" } }}>
                  {n}
                </Button>
              ))}
            </Box>

            {/* Prev / Next */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton size="small" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                sx={{ color: T.brand, "&:disabled": { opacity: 0.3 } }}>
                <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <Typography sx={{ fontFamily: FONT_MONO, fontSize: 12, color: T.ink, minWidth: 52, textAlign: "center" }}>
                {page + 1} / {Math.max(1, Math.ceil(sheetRows.length / rowsPerPage))}
              </Typography>
              <IconButton size="small" onClick={() => setPage((p) => Math.min(Math.ceil(sheetRows.length / rowsPerPage) - 1, p + 1))}
                disabled={(page + 1) * rowsPerPage >= sheetRows.length}
                sx={{ color: T.brand, "&:disabled": { opacity: 0.3 } }}>
                <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>
        )}
      </Panel>

      {/* Legend */}
      {sheetHeaders.length > 0 && Object.keys(pdfMapping).length > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderLeft: `2px solid ${T.brandBorder}`, flexShrink: 0 }} />
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
