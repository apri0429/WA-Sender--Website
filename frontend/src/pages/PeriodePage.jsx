import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  Typography,
  Select,
  MenuItem,
} from "@mui/material";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
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
};

function LoadingTableState({ syncing }) {
  return (
    <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <Box sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${T.line}`, bgcolor: `${T.brand}05` }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 700, color: T.ink }}>
              {syncing ? "Menyinkronkan data sheet" : "Menyiapkan halaman periode"}
            </Typography>
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12, color: T.muted, mt: 0.35 }}>
              {syncing ? "Mengambil data dari sheet PERIODE..." : "Memeriksa konfigurasi dan memuat data terakhir..."}
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
          <Box sx={{ display: "grid", gridTemplateColumns: "60px repeat(5, 1fr)", gap: 0, borderBottom: `1px solid ${T.line}`, bgcolor: T.brandLight }}>
            {["No", "Col 1", "Col 2", "Col 3", "Col 4", "Col 5"].map((label) => (
              <Box key={label} sx={{ px: 2, py: 1.2 }}>
                <Skeleton variant="text" width="60%" sx={{ bgcolor: "rgba(26,75,168,0.12)", transform: "none" }} />
              </Box>
            ))}
          </Box>
          {Array.from({ length: 7 }).map((_, rowIdx) => (
            <Box key={rowIdx} sx={{ display: "grid", gridTemplateColumns: "60px repeat(5, 1fr)", borderBottom: rowIdx === 6 ? "none" : `1px solid ${T.line}`, bgcolor: rowIdx % 2 === 0 ? T.white : T.surface }}>
              {Array.from({ length: 6 }).map((__, ci) => (
                <Box key={ci} sx={{ px: 2, py: 1.1 }}>
                  <Skeleton variant="text" width={`${50 + (rowIdx * ci) % 35}%`} sx={{ bgcolor: "rgba(148,163,184,0.18)", transform: "none" }} />
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default function PeriodePage() {
  const [headers, setHeaders] = useState([]);
  const [rows, setRows]       = useState([]);
  const [gsheetUrl, setGsheetUrl] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage]       = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast]     = useState({ open: false, message: "", severity: "success" });
  const [headerSlot, setHeaderSlot] = useState(null);

  const gsheetUrlRef = useRef("");

  const showToast = (msg, sev = "success") => setToast({ open: true, message: msg, severity: sev });

  useEffect(() => {
    setTimeout(() => setHeaderSlot(document.getElementById("header-wa-slot")), 100);
  }, []);

  useEffect(() => {
    api.get("/gsheet").then((res) => {
      const url = res?.data?.url || "";
      setGsheetUrl(url);
      gsheetUrlRef.current = url;
      if (url) {
        setSyncing(true);
        api.get("/gsheet/periode").then((r) => {
          const d = r?.data || {};
          setHeaders(Array.isArray(d.headers) ? d.headers : []);
          setRows(Array.isArray(d.rows) ? d.rows : []);
          setPage(0);
          showToast(`${(d.rows || []).length} baris dimuat dari PERIODE`, "success");
        }).catch((err) => {
          showToast(err?.response?.data?.message || "Gagal auto-sync", "error");
        }).finally(() => setSyncing(false));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSync = async () => {
    if (!gsheetUrlRef.current) { showToast("Atur URL Google Sheet terlebih dahulu", "warning"); return; }
    setSyncing(true);
    try {
      const res = await api.get("/gsheet/periode");
      const d = res?.data || {};
      setHeaders(Array.isArray(d.headers) ? d.headers : []);
      setRows(Array.isArray(d.rows) ? d.rows : []);
      setPage(0);
      showToast(`${(d.rows || []).length} baris dimuat`, "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Gagal sync", "error");
    } finally { setSyncing(false); }
  };

  const filteredRows = rows.filter((row) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return headers.some(h => String(row[h.key] ?? "").toLowerCase().includes(q));
  });
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const showFullLoadingState = loading || (syncing && rows.length === 0);

  return (
    <Box sx={{ fontFamily: FONT_SANS, p: 2, display: "flex", flexDirection: "column", gap: 1.5, height: "calc(100vh - 64px)", boxSizing: "border-box", overflow: "hidden" }}>

      {headerSlot && createPortal(
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          {gsheetUrlRef.current ? (
            <Box component="a" href={gsheetUrlRef.current} target="_blank" rel="noopener noreferrer"
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
          <Button onClick={handleSync} disabled={syncing || !gsheetUrlRef.current}
            startIcon={syncing ? <CircularProgress size={12} sx={{ color: T.brand }} /> : <SyncRoundedIcon sx={{ fontSize: 15 }} />}
            sx={{ height: 32, px: 1.5, borderRadius: "8px", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 700, textTransform: "none", color: T.brand, bgcolor: "rgba(255,255,255,0.95)", border: "none", boxShadow: "0 1px 6px rgba(0,0,0,0.2)", transition: "all 0.2s", "&:hover": { bgcolor: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,0.25)" }, "&:disabled": { bgcolor: "rgba(255,255,255,0.45)", color: "rgba(26,75,168,0.5)", boxShadow: "none" } }}>
            {syncing ? "Menyinkron..." : "Sync"}
          </Button>
        </Box>,
        headerSlot
      )}

      <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, minHeight: 0, borderRadius: "14px", border: `1px solid ${T.line}`, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", bgcolor: T.white, overflow: "hidden" }}>

        {/* Card header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.25, borderBottom: `1px solid ${T.line}`, bgcolor: T.white, gap: 1.5, flexWrap: "wrap", flexShrink: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <CalendarMonthRoundedIcon sx={{ fontSize: 17, color: T.brand }} />
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 700, color: T.ink }}>
              Sheet PERIODE
            </Typography>
            {rows.length > 0 && (
              <Box sx={{ px: 1, py: 0.25, borderRadius: "5px", bgcolor: T.brandLight, border: `1px solid ${T.brandBorder}` }}>
                <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11, color: T.brand, fontWeight: 600 }}>
                  {rows.length} baris &bull; {headers.length} kolom
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <TextField size="small"
              placeholder="Cari..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 14, color: T.muted }} /></InputAdornment> }}
              sx={{ width: 145, "& .MuiOutlinedInput-root": { fontFamily: FONT_SANS, fontSize: 12, borderRadius: "8px", height: 32, "& fieldset": { borderColor: T.line }, "&:hover fieldset": { borderColor: T.brandBorder }, "&.Mui-focused fieldset": { borderColor: T.brand } } }}
            />
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

        {syncing && rows.length > 0 && (
          <Box sx={{ px: 2, py: 0.9, borderBottom: `1px solid ${T.line}`, bgcolor: `${T.brand}05`, flexShrink: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
              <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: T.brand }}>
                Menyinkronkan data terbaru dari sheet PERIODE...
              </Typography>
              <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11, color: T.muted }}>mohon tunggu</Typography>
            </Box>
            <LinearProgress sx={{ mt: 0.8, height: 4, borderRadius: 999, bgcolor: T.brandLight, "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: T.brand } }} />
          </Box>
        )}

        {showFullLoadingState ? (
          <LoadingTableState syncing={syncing} />
        ) : rows.length === 0 ? (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1.5, p: 6 }}>
            <CalendarMonthRoundedIcon sx={{ fontSize: 42, color: T.subtle }} />
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: T.muted }}>Belum ada data periode</Typography>
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12.5, color: T.subtle, textAlign: "center" }}>
              Klik <strong>Sync</strong> di header untuk memuat data dari sheet PERIODE
            </Typography>
            {gsheetUrlRef.current && (
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
                  {headers.map((h) => (
                    <Box component="th" key={h.key} sx={{ color: T.brandDark, fontSize: 11, fontWeight: 700, px: 2, py: 1.25, whiteSpace: "nowrap", textAlign: "left" }}>
                      {h.label}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {filteredRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((row, i) => (
                  <Box component="tr" key={i}
                    sx={{ borderBottom: `1px solid ${T.line}`, "&:last-child": { borderBottom: "none" }, bgcolor: i % 2 !== 0 ? T.surface : T.white, "&:hover": { bgcolor: T.brandLight } }}>
                    <Box component="td" sx={{ px: 2, py: 1, color: T.subtle, fontSize: 11, fontWeight: 500, userSelect: "none", textAlign: "center" }}>
                      {page * rowsPerPage + i + 1}
                    </Box>
                    {headers.map((h) => (
                      <Box component="td" key={h.key} sx={{ px: 1.5, py: 0.875, minWidth: 90 }}>
                        <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12, color: T.text, lineHeight: 1.4 }}>
                          {String(row[h.key] ?? "") || <Box component="span" sx={{ color: T.subtle, fontStyle: "italic", fontWeight: 400 }}>—</Box>}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ))}
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
