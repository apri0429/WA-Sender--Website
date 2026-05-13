import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import api from "../services/api";

const FONT_SANS = "'Plus Jakarta Sans', 'Inter', sans-serif";
const FONT_MONO = "'JetBrains Mono', 'Fira Code', monospace";

const T = {
  brand: "#1a4ba8",
  brandDark: "#0f2460",
  brandLight: "#eef2fc",
  brandBorder: "#c5d0e8",
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

const COLS = [
  { key: "nama",    label: "Nama / Customer", mono: false },
  { key: "phone",   label: "No HP",           mono: true  },
  { key: "wilayah", label: "Wilayah",         mono: false },
];

const cellInputSx = {
  width: "100%", border: `1.5px solid ${T.brand}`, borderRadius: "5px",
  px: "6px", py: "3px", fontFamily: FONT_SANS, fontSize: 12, outline: "none",
  bgcolor: "rgba(255,255,255,0.9)", color: T.ink, minWidth: 80,
  "&:focus": { borderColor: T.brandDark },
};

export default function MasterDataPage() {
  const [data, setData]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [syncing, setSyncing]         = useState(false);
  const [saveState, setSaveState]     = useState("idle"); // idle | saving | saved
  const [searchQuery, setSearchQuery] = useState("");
  const [wilayahFilter, setWilayahFilter] = useState("all");
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage]               = useState(0);
  const [editingCell, setEditingCell] = useState(null);
  const [toast, setToast]             = useState({ open: false, message: "", severity: "success" });
  const [headerSlot, setHeaderSlot]   = useState(null);

  const dataRef      = useRef([]);
  const skipBlurRef  = useRef(false);
  const gsheetUrlRef = useRef("");
  const saveTimerRef = useRef(null);

  dataRef.current = data;

  const showToast = (msg, sev = "success") => setToast({ open: true, message: msg, severity: sev });

  useEffect(() => {
    setTimeout(() => setHeaderSlot(document.getElementById("header-wa-slot")), 100);
  }, []);

  useEffect(() => {
    api.get("/gsheet").then((res) => {
      gsheetUrlRef.current = res?.data?.url || "";
    }).catch(() => {});

    setLoading(true);
    api.get("/masterdata").then((res) => {
      setData(Array.isArray(res?.data?.rows) ? res.data.rows : []);
    }).catch(() => {
      showToast("Gagal memuat master data", "error");
    }).finally(() => setLoading(false));
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.post("/masterdata/sync");
      setData(Array.isArray(res?.data?.rows) ? res.data.rows : []);
      setSaveState("idle"); setPage(0);
      showToast(res?.data?.message || "Sync berhasil", "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Sync gagal", "error");
    } finally { setSyncing(false); }
  };

  const autoSave = (rows) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveState("idle");
    saveTimerRef.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        await api.put("/masterdata", { rows });
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2500);
      } catch {
        setSaveState("idle");
        showToast("Gagal menyimpan otomatis", "error");
      }
    }, 800);
  };

  const handleCellClick = (rowIdx, key) => {
    if (editingCell?.row === rowIdx && editingCell?.key === key) return;
    setEditingCell({ row: rowIdx, key, orig: dataRef.current[rowIdx]?.[key] });
  };

  const handleCellChange = (rowIdx, key, value) => {
    setData((prev) => {
      const next = prev.map((r, i) => i === rowIdx ? { ...r, [key]: value } : r);
      dataRef.current = next;
      autoSave(next);
      return next;
    });
  };

  const handleCellBlur = () => {
    if (skipBlurRef.current) return;
    setEditingCell(null);
  };

  const handleCellKey = (e, rowIdx) => {
    if (e.key === "Enter") {
      e.preventDefault();
      skipBlurRef.current = true;
      const next = rowIdx + 1;
      if (next < dataRef.current.length) setEditingCell({ row: next, key: editingCell?.key, orig: dataRef.current[next]?.[editingCell?.key] });
      else setEditingCell(null);
      setTimeout(() => { skipBlurRef.current = false; }, 50);
    } else if (e.key === "Tab") {
      e.preventDefault();
      const ci = COLS.findIndex(c => c.key === editingCell?.key);
      skipBlurRef.current = true;
      if (!e.shiftKey) {
        if (ci < COLS.length - 1) setEditingCell({ row: rowIdx, key: COLS[ci + 1].key, orig: dataRef.current[rowIdx]?.[COLS[ci + 1].key] });
        else if (rowIdx < dataRef.current.length - 1) setEditingCell({ row: rowIdx + 1, key: COLS[0].key, orig: dataRef.current[rowIdx + 1]?.[COLS[0].key] });
        else setEditingCell(null);
      } else {
        if (ci > 0) setEditingCell({ row: rowIdx, key: COLS[ci - 1].key, orig: dataRef.current[rowIdx]?.[COLS[ci - 1].key] });
        else if (rowIdx > 0) setEditingCell({ row: rowIdx - 1, key: COLS[COLS.length - 1].key, orig: dataRef.current[rowIdx - 1]?.[COLS[COLS.length - 1].key] });
        else setEditingCell(null);
      }
      setTimeout(() => { skipBlurRef.current = false; }, 50);
    } else if (e.key === "Escape") {
      skipBlurRef.current = true;
      if (editingCell) setData((prev) => prev.map((r, i) => i === rowIdx ? { ...r, [editingCell.key]: editingCell.orig } : r));
      setEditingCell(null);
      setTimeout(() => { skipBlurRef.current = false; }, 50);
    }
  };

  const addRow = () => {
    const newRows = [...dataRef.current, { nama: "", phone: "", wilayah: "" }];
    dataRef.current = newRows;
    setData(newRows);
    autoSave(newRows);
    const newIdx = newRows.length - 1;
    setWilayahFilter("all"); setSearchQuery("");
    setPage(Math.floor(newIdx / rowsPerPage));
    setEditingCell({ row: newIdx, key: "nama", orig: "" });
  };

  const deleteRow = (idx) => {
    const newRows = dataRef.current.filter((_, i) => i !== idx);
    dataRef.current = newRows;
    setData(newRows);
    autoSave(newRows);
    if (editingCell?.row === idx) setEditingCell(null);
  };

  const wilayahOptions = Array.from(
    new Set(data.map((r) => String(r.wilayah || "").trim()).filter((v) => v && v !== "KOSONG"))
  ).sort((a, b) => a.localeCompare(b, "id"));

  // Bawa index asli dari data supaya edit ke row yang benar meski filter aktif
  const filteredWithIdx = data
    .map((r, i) => ({ row: r, idx: i }))
    .filter(({ row }) => {
      const matchWilayah = wilayahFilter === "all" || String(row.wilayah || "").trim() === wilayahFilter;
      if (!matchWilayah) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return COLS.some(c => String(row[c.key] || "").toLowerCase().includes(q));
    });
  const totalPages = Math.max(1, Math.ceil(filteredWithIdx.length / rowsPerPage));
  const paged = filteredWithIdx.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  return (
    <Box sx={{ fontFamily: FONT_SANS, p: 2, display: "flex", flexDirection: "column", gap: 1.5, height: "calc(100vh - 64px)", boxSizing: "border-box", overflow: "hidden" }}>

      {headerSlot && createPortal(
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          {gsheetUrlRef.current ? (
            <Box component="a" href={gsheetUrlRef.current} target="_blank" rel="noopener noreferrer"
              sx={{ display: "flex", alignItems: "center", gap: 0.5, height: 32, px: 1.25, borderRadius: "8px", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: "#fff", textDecoration: "none", border: "1.5px solid rgba(255,255,255,0.45)", bgcolor: "rgba(255,255,255,0.18)", transition: "all 0.2s", "&:hover": { bgcolor: "rgba(255,255,255,0.28)" } }}>
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
          <Button onClick={handleSync} disabled={syncing || loading}
            startIcon={syncing ? <CircularProgress size={12} sx={{ color: T.brand }} /> : <SyncRoundedIcon sx={{ fontSize: 15 }} />}
            sx={{ height: 32, px: 1.5, borderRadius: "8px", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 700, textTransform: "none", color: T.brand, bgcolor: "rgba(255,255,255,0.95)", border: "none", boxShadow: "0 1px 6px rgba(0,0,0,0.2)", "&:hover": { bgcolor: "#fff" }, "&:disabled": { bgcolor: "rgba(255,255,255,0.45)", color: "rgba(26,75,168,0.5)", boxShadow: "none" } }}>
            {syncing ? "Syncing..." : "Sync Sheet"}
          </Button>
        </Box>,
        headerSlot
      )}

      <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, minHeight: 0, borderRadius: "14px", border: `1px solid ${T.line}`, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", bgcolor: T.white, overflow: "hidden" }}>

        {/* Card header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.25, borderBottom: `1px solid ${T.line}`, bgcolor: T.white, gap: 1.5, flexWrap: "wrap", flexShrink: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <StorageRoundedIcon sx={{ fontSize: 17, color: T.brand }} />
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 700, color: T.ink }}>Master Data</Typography>
            {data.length > 0 && (
              <Box sx={{ px: 1, py: 0.25, borderRadius: "5px", bgcolor: T.brandLight, border: `1px solid ${T.brandBorder}` }}>
                <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11, color: T.brand, fontWeight: 600 }}>
                  {data.length} customer
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.muted }}>Wilayah:</Typography>
              <Select size="small" value={wilayahFilter} onChange={(e) => { setWilayahFilter(e.target.value); setPage(0); }}
                sx={{ minWidth: 120, height: 32, fontFamily: FONT_SANS, fontSize: 12, borderRadius: "8px", bgcolor: T.white, "& .MuiOutlinedInput-notchedOutline": { borderColor: T.line }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: T.brandBorder }, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: T.brand } }}>
                <MenuItem value="all" sx={{ fontFamily: FONT_SANS, fontSize: 12 }}>Semua</MenuItem>
                {wilayahOptions.map((w) => (
                  <MenuItem key={w} value={w} sx={{ fontFamily: FONT_SANS, fontSize: 12 }}>{w}</MenuItem>
                ))}
              </Select>
            </Box>
            <TextField size="small"
              placeholder="Cari nama, HP..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 14, color: T.muted }} /></InputAdornment> }}
              sx={{ width: 150, "& .MuiOutlinedInput-root": { fontFamily: FONT_SANS, fontSize: 12, borderRadius: "8px", height: 32, "& fieldset": { borderColor: T.line }, "&:hover fieldset": { borderColor: T.brandBorder }, "&.Mui-focused fieldset": { borderColor: T.brand } } }}
            />
            <Tooltip title="Tambah baris baru">
              <IconButton size="small" onClick={addRow} disabled={loading}
                sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: T.brandLight, color: T.brand, "&:hover": { bgcolor: T.brandBorder } }}>
                <AddRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Pagination bar */}
        {filteredWithIdx.length > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 0.75, borderBottom: `1px solid ${T.line}`, bgcolor: T.surface, flexWrap: "wrap", gap: 1, flexShrink: 0 }}>
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.muted }}>
              {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filteredWithIdx.length)} dari {filteredWithIdx.length} customer
              {(searchQuery || wilayahFilter !== "all") && <Box component="span" sx={{ ml: 0.75, color: T.brand, fontWeight: 600 }}>· filter aktif</Box>}
              {saveState === "saving" && <Box component="span" sx={{ ml: 0.75, color: T.muted, fontStyle: "italic" }}>· menyimpan…</Box>}
              {saveState === "saved" && <Box component="span" sx={{ ml: 0.75, color: "#16a34a", fontWeight: 600 }}>· tersimpan</Box>}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.subtle }}>Tampilkan:</Typography>
              <Select size="small" value={rowsPerPage} onChange={(e) => { setRowsPerPage(e.target.value); setPage(0); }}
                sx={{ height: 26, fontFamily: FONT_MONO, fontSize: 11.5, fontWeight: 600, color: T.brand, bgcolor: T.brandLight, "& .MuiOutlinedInput-notchedOutline": { border: `1px solid ${T.brandBorder}`, borderRadius: "6px" }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: T.brand }, "& .MuiSelect-select": { py: 0, pl: 1, pr: 3 } }}>
                <MenuItem value={25} sx={{ fontFamily: FONT_MONO, fontSize: 12 }}>25 baris</MenuItem>
                <MenuItem value={50} sx={{ fontFamily: FONT_MONO, fontSize: 12 }}>50 baris</MenuItem>
                <MenuItem value={100} sx={{ fontFamily: FONT_MONO, fontSize: 12 }}>100 baris</MenuItem>
              </Select>
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

        {/* Table */}
        {loading ? (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CircularProgress size={28} sx={{ color: T.brand }} />
          </Box>
        ) : data.length === 0 ? (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1.5, p: 6 }}>
            <StorageRoundedIcon sx={{ fontSize: 42, color: T.subtle }} />
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: T.muted }}>Belum ada data</Typography>
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12.5, color: T.subtle, textAlign: "center" }}>
              Klik <strong>Sync Sheet</strong> untuk memuat dari Google Sheet, atau klik <strong>+</strong> untuk tambah manual
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflow: "auto", flexGrow: 1, minHeight: 0 }}>
            <Box component="table" sx={{ width: "100%", minWidth: 600, borderCollapse: "collapse", fontFamily: FONT_SANS, fontSize: 12 }}>
              <Box component="thead" sx={{ position: "sticky", top: 0, zIndex: 10 }}>
                <Box component="tr" sx={{ bgcolor: T.brandLight, borderBottom: `2px solid ${T.brandBorder}` }}>
                  <Box component="th" sx={{ color: T.brandDark, fontSize: 11, fontWeight: 700, px: 2, py: 1.25, width: 40, textAlign: "center", userSelect: "none" }}>No</Box>
                  {COLS.map((c) => (
                    <Box component="th" key={c.key} sx={{ color: T.brandDark, fontSize: 11, fontWeight: 700, px: 2, py: 1.25, textAlign: "left", whiteSpace: "nowrap" }}>
                      {c.label}
                    </Box>
                  ))}
                  <Box component="th" sx={{ width: 40 }} />
                </Box>
              </Box>
              <Box component="tbody">
                {paged.map(({ row, idx: globalIdx }, pi) => {
                  const isCell = (k) => editingCell?.row === globalIdx && editingCell?.key === k;
                  return (
                    <Box component="tr" key={globalIdx}
                      sx={{ borderBottom: `1px solid ${T.line}`, "&:last-child": { borderBottom: "none" }, bgcolor: pi % 2 !== 0 ? T.surface : T.white, transition: "background-color 0.1s", "&:hover": { bgcolor: T.brandLight } }}>
                      <Box component="td" sx={{ px: 2, py: 1, color: T.subtle, fontSize: 11, fontWeight: 500, userSelect: "none", textAlign: "center" }}>{globalIdx + 1}</Box>
                      {COLS.map((c) => {
                        const active = isCell(c.key);
                        return (
                          <Box component="td" key={c.key}
                            onClick={() => handleCellClick(globalIdx, c.key)}
                            sx={{ px: 1.5, py: 0.875, minWidth: 90, cursor: "text", ...(active ? { bgcolor: T.brandLight } : {}) }}>
                            {active ? (
                              <Box component="input" autoFocus
                                value={String(row[c.key] ?? "")}
                                onChange={(e) => handleCellChange(globalIdx, c.key, e.target.value)}
                                onBlur={handleCellBlur}
                                onKeyDown={(e) => handleCellKey(e, globalIdx)}
                                sx={{ ...cellInputSx, fontFamily: c.mono ? FONT_MONO : FONT_SANS }}
                              />
                            ) : (
                              <Typography sx={{
                                fontFamily: c.mono ? FONT_MONO : FONT_SANS,
                                fontSize: 12,
                                fontWeight: c.key === "nama" ? 600 : c.key === "phone" ? 700 : 400,
                                color: c.key === "phone" ? T.brand : c.key === "nama" ? T.ink : T.text,
                                lineHeight: 1.4,
                              }}>
                                {String(row[c.key] ?? "") || <Box component="span" sx={{ color: T.subtle, fontStyle: "italic", fontWeight: 400, fontFamily: FONT_SANS }}>—</Box>}
                              </Typography>
                            )}
                          </Box>
                        );
                      })}
                      <Box component="td" sx={{ px: 0.5, textAlign: "center", width: 40, userSelect: "none" }}>
                        <Tooltip title="Hapus baris">
                          <IconButton size="small" onClick={() => deleteRow(globalIdx)}
                            sx={{ width: 28, height: 28, color: T.subtle, borderRadius: "8px", transition: "all 0.16s", "&:hover": { color: T.red, bgcolor: T.redBg, transform: "translateY(-1px)" } }}>
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

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={toast.severity} variant="filled" sx={{ borderRadius: "10px", fontFamily: FONT_SANS }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
