import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Alert,
  Box,
  CircularProgress,
  LinearProgress,
  Snackbar,
} from "@mui/material";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
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

function GoogleSheetsLogo({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false" style={{ display: "block" }}>
      <path d="M13 5.5h17.2L39 14.3V41c0 1.1-.9 2-2 2H13c-1.1 0-2-.9-2-2V7.5c0-1.1.9-2 2-2z" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round" />
      <path d="M30 6v8.5h8.5" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round" />
      <rect x="16.5" y="21.5" width="17" height="15" rx="1.4" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M16.5 26.5h17M16.5 31.5h17M22.2 21.5v15M27.8 21.5v15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function getInitials(name) {
  if (!name) return "?";
  return String(name).trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("") || "?";
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

function formatCellValue(value) {
  const str = String(value ?? "");
  if (!str) return str;
  if (ISO_DATE_RE.test(str)) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
    }
  }
  return str;
}

function isNameColumn(header) {
  const key = String(header?.key || "").toLowerCase();
  const label = String(header?.label || "").toLowerCase();
  return key.includes("nama") || key.includes("name") || label.includes("nama") || label.includes("name");
}

function isTerminColumn(header) {
  const key = String(header?.key || "").toLowerCase();
  const label = String(header?.label || "").toLowerCase();
  return key.includes("termin") || label.includes("termin") || key.includes("term") || label.includes("term");
}

function RowsPerPageDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const options = [25, 50, 100];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", width: 76 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", height: 30, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6,
          borderRadius: 999, border: `1.5px solid ${open ? "rgba(233,196,106,0.75)" : "#d4ddf0"}`,
          background: "linear-gradient(180deg, #f8fafc 0%, #eef1f6 100%)",
          padding: "0 8px 0 11px", cursor: "pointer", outline: "none",
          boxShadow: open ? "0 0 0 3px rgba(233,196,106,0.13)" : "0 2px 8px rgba(22,58,107,0.06)",
          transition: "border-color 0.18s, box-shadow 0.18s",
        }}
      >
        <span style={{ fontFamily: FONT_MONO, fontSize: 11.5, fontWeight: 700, color: T.ink, lineHeight: 1 }}>{value}</span>
        <KeyboardArrowDownRoundedIcon style={{ fontSize: 16, color: T.brand, flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, right: 0, zIndex: 1000, background: T.white, border: `1.5px solid ${T.brandBorder}`, borderRadius: 12, boxShadow: "0 10px 30px rgba(22,58,107,0.14), 0 2px 8px rgba(22,58,107,0.07)", overflow: "hidden" }}>
          {options.map((opt) => {
            const active = opt === value;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                style={{ width: "100%", minHeight: 30, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "7px 9px 7px 11px", background: active ? T.brandLight : "transparent", border: "none", borderBottom: opt === options[options.length - 1] ? "none" : `1px solid ${T.line}`, cursor: "pointer", textAlign: "left", transition: "background 0.12s" }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#f4f6fa"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontFamily: FONT_MONO, fontSize: 11.5, fontWeight: active ? 800 : 600, color: active ? T.brand : T.text }}>{opt}</span>
                {active && <CheckCircleOutlineRoundedIcon style={{ fontSize: 14, color: T.brand, flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CellDropdown({ rect, value, label, onClose, onChange, onKeyDown }) {
  if (!rect) return null;

  const viewportH = window.innerHeight;
  const spaceBelow = viewportH - rect.bottom;
  const spaceAbove = rect.top;
  const dropH = 118;

  let top, transformOrigin;
  if (spaceBelow >= dropH || spaceBelow >= spaceAbove) {
    top = rect.bottom + 6;
    transformOrigin = "top left";
  } else {
    top = rect.top - dropH - 6;
    transformOrigin = "bottom left";
  }

  const left = Math.max(8, Math.min(rect.left, window.innerWidth - Math.max(rect.width, 280) - 8));
  const width = Math.max(rect.width, 280);

  return createPortal(
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 8998 }} onMouseDown={(e) => { e.preventDefault(); onClose(); }} />
      <div
        style={{
          position: "fixed", top, left, width, zIndex: 8999,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 28px 80px rgba(10,18,40,0.28), 0 4px 16px rgba(10,18,40,0.14)",
          animation: "cellDrop 0.15s cubic-bezier(.22,.68,0,1.1) both",
          transformOrigin,
          border: "1px solid rgba(26,42,87,0.12)",
          background: T.white,
        }}
      >
        <style>{`@keyframes cellDrop { from{opacity:0;transform:scale(0.96) translateY(-4px)} to{opacity:1;transform:scale(1) translateY(0)} }`}</style>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "14px 16px 12px", background: "linear-gradient(180deg, rgba(24,43,88,1) 0%, rgba(27,55,112,0.96) 100%)", borderBottom: "1px solid rgba(26,42,87,0.10)" }}>
          <div>
            <p style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, color: "rgba(233,196,106,0.92)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 3px" }}>
              Edit Data
            </p>
            <h3 style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.2 }}>
              {label || "Edit"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, borderRadius: 8, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.75)", cursor: "pointer", transition: "background 0.15s, border-color 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; e.currentTarget.style.borderColor = "rgba(233,196,106,0.4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }}
          >
            <CloseRoundedIcon style={{ fontSize: 14 }} />
          </button>
        </div>
        <div style={{ padding: "12px 16px 14px", background: T.white }}>
          <input
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ width: "100%", boxSizing: "border-box", height: 38, padding: "0 12px", border: "1.5px solid rgba(26,42,87,0.18)", borderRadius: 10, fontFamily: FONT_SANS, fontSize: 13, fontWeight: 500, color: T.ink, outline: "none", background: T.brandLight, transition: "border-color 0.15s, box-shadow 0.15s" }}
            onFocus={(e) => { e.target.style.borderColor = T.brand; e.target.style.boxShadow = "0 0 0 3px rgba(35,57,113,0.10)"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(26,42,87,0.18)"; e.target.style.boxShadow = "none"; }}
          />
          <p style={{ margin: "7px 1px 0", fontFamily: FONT_SANS, fontSize: 10.5, color: T.subtle }}>
            <span style={{ color: T.brand, fontWeight: 700 }}>Enter</span> simpan &nbsp;·&nbsp; <span style={{ fontWeight: 600 }}>Esc</span> batal
          </p>
        </div>
      </div>
    </>,
    document.body
  );
}

const PERIODE_SKELETON_ROWS = [
  [30, 62, 50, 44, 58],
  [26, 78, 42, 60, 36],
  [34, 54, 58, 38, 70],
  [28, 72, 46, 64, 42],
  [32, 60, 54, 48, 54],
  [26, 76, 40, 58, 40],
  [34, 58, 62, 44, 66],
];

function SkeletonBar({ w, delay = 0 }) {
  return (
    <div style={{
      height: 10, borderRadius: 6, width: w,
      background: "rgba(26,42,87,0.08)",
      animation: `shimmer 1.4s ease-in-out ${delay}s infinite`,
    }} />
  );
}

function LoadingTableState() {
  const skelCols = [110, 90, 160, 80, 70, 90];
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", margin: "0 16px", overflow: "hidden" }}>
      <div style={{ display: "flex", borderBottom: `1.5px solid rgba(26,42,87,0.1)`, background: T.surface, flexShrink: 0 }}>
        {skelCols.map((w, ci) => (
          <div key={ci} style={{ padding: "12px 16px", flex: ci === 2 ? 2 : 1, minWidth: w }}>
            <SkeletonBar w={`${[55,48,52,44,38,50][ci]}%`} delay={ci * 0.05} />
          </div>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {PERIODE_SKELETON_ROWS.map((cols, ri) => (
          <div key={ri} style={{ display: "flex", borderBottom: `1px solid rgba(26,42,87,0.05)`, background: ri % 2 === 0 ? T.white : T.surface, alignItems: "center" }}>
            {skelCols.map((w, ci) => (
              <div key={ci} style={{ padding: "11px 16px", flex: ci === 2 ? 2 : 1, minWidth: w }}>
                <SkeletonBar w={`${cols[ci % cols.length]}%`} delay={(ri * 0.04 + ci * 0.02)} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
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
  const [expandedRow, setExpandedRow] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [cellRect, setCellRect]       = useState(null);
  const [toast, setToast]             = useState({ open: false, message: "", severity: "success" });
  const [headerSlot, setHeaderSlot]   = useState(null);

  const gsheetUrlRef = useRef("");
  const activeCellRef = useRef(null);

  const showToast = (msg, sev = "success") => setToast({ open: true, message: msg, severity: sev });

  useEffect(() => {
    setTimeout(() => setHeaderSlot(document.getElementById("header-wa-slot")), 100);
  }, []);

  useEffect(() => {
    if (!editingCell) { setCellRect(null); return; }
    requestAnimationFrame(() => {
      if (activeCellRef.current) {
        const r = activeCellRef.current.getBoundingClientRect();
        setCellRect({ top: r.top, bottom: r.bottom, left: r.left, width: r.width });
      }
    });
  }, [editingCell]);

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

  const handleCellEdit = (rowIdx, colKey) => {
    setEditingCell({ row: rowIdx, colKey, orig: rows[rowIdx]?.[colKey] });
  };

  const handleDropdownChange = (value) => {
    if (!editingCell) return;
    setRows((prev) => prev.map((r, i) => i === editingCell.row ? { ...r, [editingCell.colKey]: value } : r));
  };

  const closeDropdown = () => { setEditingCell(null); setCellRect(null); };

  const handleDropdownKey = (e) => {
    if (e.key === "Enter") { e.preventDefault(); closeDropdown(); }
    else if (e.key === "Escape") {
      if (editingCell) setRows((prev) => prev.map((r, i) => i === editingCell.row ? { ...r, [editingCell.colKey]: editingCell.orig } : r));
      closeDropdown();
    }
  };

  const mappedRows = rows.map((row, index) => ({ row, index }));
  const filteredRows = mappedRows.filter(({ row }) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return headers.some(h => String(row[h.key] ?? "").toLowerCase().includes(q));
  });
  const totalPages         = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const showFullLoadingState = loading || (syncing && rows.length === 0);
  const tableCols = headers.slice(0, 5);
  const accordionCols = headers.slice(5);
  const colSpan = tableCols.length + 1;
  const editingValue = editingCell ? String(rows[editingCell.row]?.[editingCell.colKey] ?? "") : "";
  const editingHeaderLabel = editingCell ? headers.find(h => h.key === editingCell.colKey)?.label || editingCell.colKey : "";

  return (
    <Box sx={{ fontFamily: FONT_SANS, p: 2, display: "flex", flexDirection: "column", gap: 1.5, height: "calc(100vh - 64px)", boxSizing: "border-box", overflow: "hidden" }}>

      {/* ── Header portal ── */}
      {headerSlot && createPortal(
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <style>{`.hdr-search::placeholder { color: rgba(255,255,255,0.42); font-weight: 400; }`}</style>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}
            onMouseEnter={e => { const inp = e.currentTarget.querySelector("input"); if (inp !== document.activeElement) { inp.style.borderColor = "rgba(233,196,106,0.55)"; inp.style.background = "rgba(233,196,106,0.1)"; } }}
            onMouseLeave={e => { const inp = e.currentTarget.querySelector("input"); if (inp !== document.activeElement) { inp.style.borderColor = searchQuery ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.22)"; inp.style.background = "rgba(255,255,255,0.12)"; } }}
          >
            <SearchRoundedIcon style={{ position: "absolute", left: 11, fontSize: 14, color: "rgba(255,255,255,0.55)", pointerEvents: "none" }} />
            <input type="text" className="hdr-search" placeholder="Search..." value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              style={{ height: 34, paddingLeft: 32, paddingRight: searchQuery ? 30 : 14, width: 200, fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: 500, color: "#fff", border: "1.5px solid rgba(255,255,255,0.22)", borderRadius: 10, background: "rgba(255,255,255,0.12)", outline: "none", transition: "border-color 0.18s, background 0.18s", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.12)" }}
              onFocus={e => { e.target.style.borderColor = "rgba(233,196,106,0.8)"; e.target.style.background = "rgba(233,196,106,0.12)"; }}
              onBlur={e  => { e.target.style.borderColor = searchQuery ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.22)"; e.target.style.background = "rgba(255,255,255,0.12)"; }}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setPage(0); }} style={{ position: "absolute", right: 8, width: 16, height: 16, borderRadius: "50%", background: "rgba(255,255,255,0.28)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                <CloseRoundedIcon style={{ fontSize: 9, color: "#fff" }} />
              </button>
            )}
          </div>
          {gsheetUrlRef.current ? (
            <a href={gsheetUrlRef.current} target="_blank" rel="noopener noreferrer" className="header-icon-button header-icon-button--compact" title="Open Google Sheet" style={{ textDecoration: "none" }}>
              <GoogleSheetsLogo size={18} />
            </a>
          ) : (
            <span className="header-icon-button header-icon-button--compact" style={{ opacity: 0.35, cursor: "default" }}>
              <GoogleSheetsLogo size={18} />
            </span>
          )}
          <button className="header-icon-button header-icon-button--compact" onClick={handleSync} disabled={syncing || !gsheetUrlRef.current} style={{ opacity: !gsheetUrlRef.current ? 0.4 : 1 }}>
            {syncing ? <CircularProgress size={15} sx={{ color: "#fff" }} /> : <SyncRoundedIcon style={{ fontSize: 17 }} />}
          </button>
        </div>,
        headerSlot
      )}

      {/* ── Main Table Card ── */}
      <section className="dashboard-panel" style={{ flex: 1, minHeight: 0, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", borderRadius: 28 }}>

        <div className="dashboard-panel__header" style={{ padding: "18px 24px 12px", borderBottom: "none", background: T.white, flexShrink: 0, margin: 0 }}>
          <div>
            <p className="dashboard-panel__eyebrow" style={{ fontFamily: FONT_SANS, marginBottom: 2 }}>Google Sheet</p>
            <h2 className="dashboard-panel__title" style={{ margin: 0 }}>Sheet PERIODE</h2>
            {rows.length > 0 && (
              <p className="dashboard-panel__description" style={{ margin: "3px 0 0", fontFamily: FONT_MONO }}>
                {rows.length} rows · {headers.length} columns
              </p>
            )}
          </div>
        </div>

        {/* ── Card Header ── */}
        <div className="dashboard-panel__header" style={{ display: "none" }}>

          {/* Left: title group */}
          <div>
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

        </div>

        {/* ── Pagination bar ── */}
        {filteredRows.length > 0 && (
          <div style={{ display: "none" }}>
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
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.subtle }}>Tampilkan</span>
                <RowsPerPageDropdown
                  value={rowsPerPage}
                  onChange={(nextRows) => { setRowsPerPage(nextRows); setPage(0); }}
                />
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

        {!showFullLoadingState && rows.length === 0 && (
          <div style={{ padding: "0 20px 10px", flexShrink: 0 }}>
            <Alert severity="info" sx={{ fontFamily: FONT_SANS, fontSize: 12, py: 0.25, borderRadius: "10px" }}>
              Belum ada data — klik Sync di header untuk memuat data dari sheet PERIODE terlebih dahulu
            </Alert>
          </div>
        )}

        {/* ── Body ── */}
        {showFullLoadingState ? (
          <LoadingTableState syncing={syncing} />
        ) : (

          /* Data table */
          <>
          <div className="users-table-wrapper" style={{ flex: 1, minHeight: 0, margin: "0 16px", overflowX: "hidden", overflowY: "auto" }}>
            <table className="users-table" style={{ fontFamily: FONT_SANS, width: "100%", minWidth: 0, tableLayout: "fixed" }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                <tr>
                  {tableCols.map((h) => (
                    <th key={h.key} style={{ color: T.brandDark, fontSize: 10.5, fontWeight: 700, padding: "10px 16px", whiteSpace: "nowrap", textAlign: "left", background: T.surface, textTransform: "none", letterSpacing: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {h.label}
                    </th>
                  ))}
                  <th className="users-table__detail-header" style={{ background: T.surface, width: 96, minWidth: 96, paddingInline: 8, textAlign: "center" }}>
                    {accordionCols.length > 0 ? "Detail" : ""}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={colSpan} style={{ padding: "48px 20px", textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                        <CalendarMonthRoundedIcon style={{ fontSize: 32, color: T.subtle }} />
                        <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: T.muted, fontWeight: 600 }}>Belum ada data periode</span>
                        <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: T.subtle }}>Klik Sync di header untuk memuat data dari sheet PERIODE</span>
                        {gsheetUrlRef.current && (
                          <CreateButton variant="detail" onClick={handleSync} disabled={syncing} style={{ gap: 6, paddingInline: 22, marginTop: 8 }}>
                            {syncing ? <CircularProgress size={13} sx={{ color: T.brand }} /> : <SyncRoundedIcon style={{ fontSize: 15 }} />}
                            {syncing ? "Memuat..." : "Sync Sekarang"}
                          </CreateButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : filteredRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map(({ row, index: i }) => {
                  const isExpanded = expandedRow === i;
                  return (
                    <Fragment key={i}>
                      <tr
                        className={`users-table__row users-table__row--interactive${isExpanded ? " users-table__row--expanded" : ""}`}
                        style={{ background: i % 2 !== 0 ? T.surface : T.white }}
                        onClick={() => { closeDropdown(); setExpandedRow(isExpanded ? null : i); }}
                      >
                        {tableCols.map((h) => {
                          const displayText = formatCellValue(row[h.key]);
                          const isActive = editingCell?.row === i && editingCell?.colKey === h.key;
                          const hasAvatar = isNameColumn(h);
                          const isTermin = isTerminColumn(h);
                          return (
                            <td key={h.key} style={{ overflow: "hidden", padding: "4px 8px" }}>
                              <button
                                ref={isActive ? activeCellRef : null}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleCellEdit(i, h.key); }}
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: 5, width: "100%",
                                  border: `1px solid ${isActive ? "rgba(233,196,106,0.9)" : "transparent"}`,
                                  borderRadius: 5, padding: "3px 6px",
                                  background: isActive ? "rgba(233,196,106,0.14)" : "transparent",
                                  cursor: "text", textAlign: "left",
                                  boxShadow: isActive ? "0 0 0 3px rgba(233,196,106,0.12)" : "none",
                                  transition: "border-color 0.12s, background 0.12s, box-shadow 0.12s",
                                }}
                                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.borderColor = "rgba(233,196,106,0.65)"; e.currentTarget.style.background = "rgba(233,196,106,0.08)"; } }}
                                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "transparent"; } }}
                              >
                                {hasAvatar ? (
                                  <div style={{ display: "flex", alignItems: "center", gap: 7, overflow: "hidden", width: "100%" }}>
                                    <span className="users-table__avatar" style={{ width: 30, height: 30, fontFamily: FONT_SANS, fontSize: 9.5, letterSpacing: "0.04em", flexShrink: 0 }}>{getInitials(displayText)}</span>
                                    <span style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: isActive ? T.brandDark : T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {displayText || <span style={{ color: T.subtle, fontStyle: "italic", fontWeight: 400 }}>—</span>}
                                    </span>
                                  </div>
                                ) : isTermin && displayText ? (
                                  <span className={`users-table__status users-table__status--inline ${/3\s*bulan/i.test(displayText) ? "users-table__status--app" : "users-table__status--pending"}`}>{displayText}</span>
                                ) : (
                                  <span style={{ display: "block", width: "100%", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 400, color: isActive ? T.brandDark : T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {displayText || <span style={{ color: T.subtle, fontStyle: "italic", fontWeight: 400 }}>—</span>}
                                  </span>
                                )}
                              </button>
                            </td>
                          );
                        })}
                        <td className="users-table__detail-cell" style={{ width: 96, minWidth: 96, padding: "4px 8px", textAlign: "center", overflow: "visible" }}>
                          <CreateButton
                            variant="detail"
                            type="button"
                            onClick={(e) => { e.stopPropagation(); closeDropdown(); setExpandedRow(isExpanded ? null : i); }}
                            aria-expanded={isExpanded}
                            style={{ width: "100%", minHeight: 32, padding: "6px 10px", gap: 4, fontSize: 11.5, lineHeight: 1, borderRadius: 999, whiteSpace: "nowrap" }}
                          >
                            <span style={{ fontFamily: FONT_SANS, fontSize: 11.5, lineHeight: 1 }}>Detail</span>
                            <KeyboardArrowDownRoundedIcon
                              style={{ fontSize: 15, flexShrink: 0, transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                              className={`users-table__detail-icon${isExpanded ? " users-table__detail-icon--open" : ""}`}
                            />
                          </CreateButton>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="users-table__accordion-row">
                          <td colSpan={colSpan}>
                            <div className="users-table__accordion">
                              {accordionCols.length > 0 && (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "16px 20px 16px" }}>
                                  {accordionCols.map((h) => {
                                    const displayText = formatCellValue(row[h.key]);
                                    const isActive = editingCell?.row === i && editingCell?.colKey === h.key;
                                    const isTermin = isTerminColumn(h);
                                    return (
                                      <div key={h.key} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                        <span style={{ fontFamily: FONT_SANS, fontSize: 10, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                          {h.label}
                                        </span>
                                        <button
                                          ref={isActive ? activeCellRef : null}
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); handleCellEdit(i, h.key); }}
                                          style={{
                                            display: "flex", alignItems: "center", width: "100%",
                                            border: `1.5px solid ${isActive ? "rgba(233,196,106,0.9)" : T.line}`,
                                            borderRadius: 8, padding: "7px 11px",
                                            background: isActive ? "rgba(233,196,106,0.14)" : T.white,
                                            cursor: "text", textAlign: "left",
                                            boxShadow: isActive ? "0 0 0 3px rgba(233,196,106,0.12)" : "none",
                                            transition: "border-color 0.12s, background 0.12s, box-shadow 0.12s",
                                          }}
                                          onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.borderColor = "rgba(233,196,106,0.65)"; e.currentTarget.style.background = "rgba(233,196,106,0.08)"; } }}
                                          onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.borderColor = T.line; e.currentTarget.style.background = T.white; } }}
                                        >
                                          {isTermin && displayText ? (
                                            <span className={`users-table__status users-table__status--inline ${/3\s*bulan/i.test(displayText) ? "users-table__status--app" : "users-table__status--pending"}`}>{displayText}</span>
                                          ) : (
                                            <span style={{ fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: 500, color: isActive ? T.brandDark : displayText ? T.ink : T.subtle, fontStyle: displayText ? "normal" : "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                              {displayText || "—"}
                                            </span>
                                          )}
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="users-table-wrapper" style={{ display: "none" }}>
            <table className="users-table" style={{ fontFamily: FONT_SANS, width: "100%", minWidth: 0, tableLayout: "fixed" }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                <tr style={{ background: T.surface, borderBottom: `1.5px solid ${T.line}` }}>
                  <th style={{ color: T.brandDark, fontSize: 10.5, fontWeight: 700, padding: "10px 16px", width: 40, userSelect: "none", textAlign: "center", background: T.surface, textTransform: "none", letterSpacing: 0 }}>
                    No
                  </th>
                  {headers.map((h) => (
                    <th key={h.key} style={{ color: T.brandDark, fontSize: 10.5, fontWeight: 700, padding: "10px 16px", whiteSpace: "nowrap", textAlign: "left", background: T.surface, textTransform: "none", letterSpacing: 0 }}>
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
          </>
        )}

        {/* Pagination */}
        {filteredRows.length > 0 && (
          <div className="users-table-pagination" style={{ padding: "9px 22px 8px", borderTop: `1px solid ${T.line}`, marginTop: 0 }}>
            <div className="users-table-pagination__meta" style={{ gap: 10 }}>
              <p className="users-table-pagination__summary" style={{ fontSize: 11.5, lineHeight: 1.35 }}>
                {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filteredRows.length)} of{" "}
                <strong>{filteredRows.length}</strong> rows
                {searchQuery && <span style={{ marginLeft: 6, color: T.brand, fontWeight: 600 }}>· filter aktif</span>}
              </p>
              <label className="users-table-pagination__page-size" style={{ gap: 6, fontSize: 11.5 }}>
                <span>Show</span>
                <RowsPerPageDropdown
                  value={rowsPerPage}
                  onChange={(nextRows) => { setRowsPerPage(nextRows); setPage(0); }}
                />
                <span>rows</span>
              </label>
            </div>
            <div className="users-table-pagination__controls" style={{ gap: 5 }}>
              <CreateButton variant="pagination" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ minHeight: 30, padding: "6px 10px", fontSize: 11.5, gap: 4 }}>
                <ChevronLeftRoundedIcon style={{ fontSize: 14 }} /> Previous
              </CreateButton>
              {Array.from({ length: totalPages }, (_, i) => i)
                .filter(i => i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1)
                .reduce((acc, i, idx, arr) => { if (idx > 0 && i - arr[idx - 1] > 1) acc.push("..."); acc.push(i); return acc; }, [])
                .map((item, idx) =>
                  item === "..." ? (
                    <span key={`dot-${idx}`} className="users-table-pagination__ellipsis" style={{ fontSize: 11.5, paddingInline: 2 }}>...</span>
                  ) : (
                    <CreateButton key={item} variant="pagination" active={item === page} onClick={() => setPage(item)} style={{ minWidth: 30, minHeight: 30, padding: "6px 9px" }}>
                      <span style={{ fontSize: 11.5, lineHeight: 1 }}>{item + 1}</span>
                    </CreateButton>
                  )
                )}
              <CreateButton variant="pagination" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={{ minHeight: 30, padding: "6px 10px", fontSize: 11.5, gap: 4 }}>
                Next <ChevronRightRoundedIcon style={{ fontSize: 14 }} />
              </CreateButton>
            </div>
          </div>
        )}

        {/* ── Footer legend ── */}
        {false && rows.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 20px", borderTop: `1px solid ${T.line}`, background: T.surface, flexShrink: 0 }}>
            <InfoOutlinedIcon style={{ fontSize: 14, color: T.brandBorder, flexShrink: 0 }} />
            <span style={{ fontFamily: FONT_SANS, fontSize: 11, color: T.muted }}>
              Data bersifat <span style={{ color: T.brand, fontWeight: 600 }}>read-only</span> — klik <span style={{ color: T.brand, fontWeight: 600 }}>Sync</span> di header untuk memperbarui dari Google Sheet
            </span>
          </div>
        )}
      </section>

      {editingCell && (
        <CellDropdown
          rect={cellRect}
          value={editingValue}
          label={editingHeaderLabel}
          onClose={closeDropdown}
          onChange={handleDropdownChange}
          onKeyDown={handleDropdownKey}
        />
      )}

      <Snackbar open={toast.open} autoHideDuration={3200} onClose={() => setToast((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={toast.severity} variant="filled" sx={{ borderRadius: "12px", fontFamily: FONT_SANS, boxShadow: "0 8px 24px rgba(0,0,0,0.14)" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
