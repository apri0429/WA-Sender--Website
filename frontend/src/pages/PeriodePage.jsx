import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Alert,
  Box,
  CircularProgress,
  LinearProgress,
  Snackbar,
  Skeleton,
  Typography,
} from "@mui/material";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import api from "../services/api";
import CreateButton from "../components/button/CreateButton";

const FONT_SANS = "'Plus Jakarta Sans', 'Inter', sans-serif";
const FONT_MONO = "'JetBrains Mono', 'Fira Code', monospace";

const T = {
  brand:       "#233971",
  brandDark:   "#163a6b",
  brandLight:  "#eaeff7",
  brandBorder: "#b3c1d8",
  ink:         "#163a6b",
  text:        "#374151",
  muted:       "#6b7280",
  subtle:      "#9ca3af",
  line:        "#e5e7eb",
  surface:     "#f9fafb",
  white:       "#ffffff",
};

const PERIODE_SKELETON_ROWS = [
  [30, 62, 50, 44, 58],
  [26, 78, 42, 60, 36],
  [34, 54, 58, 38, 70],
  [28, 72, 46, 64, 42],
  [32, 60, 54, 48, 54],
  [26, 76, 40, 58, 40],
  [34, 58, 62, 44, 66],
];

function LoadingTableState({ syncing }) {
  return (
    <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      {/* Loading banner */}
      <Box sx={{ px: 2.5, py: 1.75, borderBottom: `1px solid ${T.line}`, bgcolor: T.brandLight }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <CircularProgress size={16} thickness={4} sx={{ color: T.brand, flexShrink: 0 }} />
            <Box>
              <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: 700, color: T.ink, lineHeight: 1.2 }}>
                {syncing ? "Menyinkronkan data dari Google Sheet" : "Memuat data sheet PERIODE"}
              </Typography>
              <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11, color: T.muted, mt: 0.25 }}>
                {syncing ? "Mengambil data dari sheet PERIODE..." : "Memeriksa konfigurasi dan memuat data terakhir..."}
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
        <Box sx={{ display: "grid", gridTemplateColumns: "52px repeat(5, 1fr)", borderBottom: `1.5px solid ${T.brandBorder}`, bgcolor: T.brandLight }}>
          {[28, 52, 44, 48, 36, 42].map((w, ci) => (
            <Box key={ci} sx={{ px: 2, py: 1.4 }}>
              <Skeleton variant="rounded" width={`${w}%`} height={10} sx={{ bgcolor: `${T.brand}18`, borderRadius: 2 }} />
            </Box>
          ))}
        </Box>
        {/* Skeleton rows */}
        {PERIODE_SKELETON_ROWS.map((cols, rowIdx) => (
          <Box key={rowIdx} sx={{ display: "grid", gridTemplateColumns: "52px repeat(5, 1fr)", borderBottom: rowIdx === PERIODE_SKELETON_ROWS.length - 1 ? "none" : `1px solid ${T.line}`, bgcolor: rowIdx % 2 === 0 ? T.white : T.surface, alignItems: "center" }}>
            <Box sx={{ px: 2, py: 1.25, display: "flex", justifyContent: "center" }}>
              <Skeleton variant="rounded" width={20} height={10} sx={{ bgcolor: "rgba(148,163,184,0.2)", borderRadius: 2 }} />
            </Box>
            {cols.map((w, ci) => (
              <Box key={ci} sx={{ px: 2, py: 1.25 }}>
                <Skeleton variant="rounded" width={`${w}%`} height={11}
                  sx={{ bgcolor: "rgba(148,163,184,0.18)", borderRadius: 2, animationDelay: `${(rowIdx * 5 + ci) * 0.05}s` }} />
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function PeriodePage() {
  const [headers, setHeaders]         = useState([]);
  const [rows, setRows]               = useState([]);
  const [gsheetUrl, setGsheetUrl]     = useState("");
  const [syncing, setSyncing]         = useState(false);
  const [loading, setLoading]         = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage]               = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast]             = useState({ open: false, message: "", severity: "success" });
  const [headerSlot, setHeaderSlot]   = useState(null);

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
  const totalPages         = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const showFullLoadingState = loading || (syncing && rows.length === 0);

  return (
    <Box sx={{ fontFamily: FONT_SANS, p: 2, display: "flex", flexDirection: "column", gap: 1.5, height: "calc(100vh - 64px)", boxSizing: "border-box", overflow: "hidden" }}>

      {/* ── Header portal ── */}
      {headerSlot && createPortal(
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          {gsheetUrlRef.current ? (
            <Box component="a" href={gsheetUrlRef.current} target="_blank" rel="noopener noreferrer"
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
          <CreateButton variant="detail" onClick={handleSync} disabled={syncing || !gsheetUrlRef.current}
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
              <CalendarMonthRoundedIcon style={{ fontSize: 16, color: T.brand }} />
            </div>
            {/* Title + badge */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: FONT_SANS, fontSize: 13.5, fontWeight: 700, color: T.ink, lineHeight: 1.1 }}>Sheet PERIODE</span>
                {rows.length > 0 && (
                  <span className="master-project-badge master-project-badge--active" style={{ fontFamily: FONT_MONO, fontSize: 10.5, minHeight: 20, padding: "0 8px" }}>
                    {rows.length} baris · {headers.length} kolom
                  </span>
                )}
              </div>
              <span style={{ fontFamily: FONT_SANS, fontSize: 11, color: T.muted, display: "block", marginTop: 2 }}>
                Data dari Google Sheet
              </span>
            </div>
          </div>

          {/* Right: search */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
        {syncing && rows.length > 0 && (
          <div style={{ padding: "8px 20px", borderBottom: `1px solid ${T.brandBorder}`, background: T.brandLight, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CircularProgress size={13} sx={{ color: T.brand, flexShrink: 0 }} />
              <span style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: T.brand, flex: 1 }}>
                Menyinkronkan data terbaru dari sheet PERIODE...
              </span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: T.muted, letterSpacing: "0.04em" }}>mohon tunggu</span>
            </div>
            <LinearProgress sx={{ mt: 0.75, height: 3, borderRadius: 999, bgcolor: "rgba(35,57,113,0.1)", "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: T.brand } }} />
          </div>
        )}

        {/* ── Body ── */}
        {showFullLoadingState ? (
          <LoadingTableState syncing={syncing} />
        ) : rows.length === 0 ? (

          /* Empty state */
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, padding: "40px 56px", border: `1.5px dashed ${T.brandBorder}`, borderRadius: 20, background: `${T.brandLight}60`, maxWidth: 380, textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: T.white, border: `1.5px solid ${T.brandBorder}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 14px rgba(35,57,113,0.08)` }}>
                <CalendarMonthRoundedIcon style={{ fontSize: 24, color: T.brand }} />
              </div>
              <div>
                <p style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 700, color: T.ink, margin: "0 0 8px" }}>
                  Belum ada data periode
                </p>
                <p style={{ fontFamily: FONT_SANS, fontSize: 12, color: T.muted, margin: 0, lineHeight: 1.65 }}>
                  Klik <strong style={{ color: T.brand }}>Sync</strong> di header untuk memuat data dari sheet PERIODE
                </p>
              </div>
              {gsheetUrlRef.current && (
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
                  {headers.map((h) => (
                    <th key={h.key} style={{ color: T.brandDark, fontSize: 10.5, fontWeight: 700, padding: "10px 16px", whiteSpace: "nowrap", textAlign: "left", background: T.brandLight, textTransform: "none", letterSpacing: 0 }}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((row, i) => (
                  <tr key={i} className="users-table__row" style={{ background: i % 2 !== 0 ? T.surface : T.white }}>
                    <td style={{ padding: "8px 16px", color: T.subtle, fontSize: 11, fontWeight: 600, userSelect: "none", textAlign: "center", width: 40 }}>
                      {page * rowsPerPage + i + 1}
                    </td>
                    {headers.map((h) => (
                      <td key={h.key} style={{ padding: "7px 12px", minWidth: 90 }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: T.text, lineHeight: 1.4 }}>
                          {String(row[h.key] ?? "") || <span style={{ color: T.subtle, fontStyle: "italic", fontWeight: 400 }}>—</span>}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Footer legend ── */}
        {rows.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 20px", borderTop: `1px solid ${T.line}`, background: T.surface, flexShrink: 0 }}>
            <InfoOutlinedIcon style={{ fontSize: 14, color: T.brandBorder, flexShrink: 0 }} />
            <span style={{ fontFamily: FONT_SANS, fontSize: 11, color: T.muted }}>
              Data bersifat <span style={{ color: T.brand, fontWeight: 600 }}>read-only</span> — klik <span style={{ color: T.brand, fontWeight: 600 }}>Sync</span> di header untuk memperbarui dari Google Sheet
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
