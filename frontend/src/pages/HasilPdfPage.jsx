import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import DescriptionRoundedIcon   from "@mui/icons-material/DescriptionRounded";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import CloudDoneRoundedIcon     from "@mui/icons-material/CloudDoneRounded";
import SyncRoundedIcon          from "@mui/icons-material/SyncRounded";
import ChevronLeftRoundedIcon   from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon  from "@mui/icons-material/ChevronRightRounded";
import WhatsAppIcon             from "@mui/icons-material/WhatsApp";
import ErrorOutlineRoundedIcon  from "@mui/icons-material/ErrorOutlineRounded";
import CloseRoundedIcon         from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon        from "@mui/icons-material/SearchRounded";
import RoomRoundedIcon          from "@mui/icons-material/RoomRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
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

function getInitials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("");
}

function formatGeneratedAt(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── Rows-per-page pill dropdown ──────────────────────────────────────────────
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
      <button type="button" onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", height: 30, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, borderRadius: 999, border: `1.5px solid ${open ? "rgba(233,196,106,0.75)" : "#d4ddf0"}`, background: "linear-gradient(180deg, #f8fafc 0%, #eef1f6 100%)", padding: "0 8px 0 11px", cursor: "pointer", outline: "none", boxShadow: open ? "0 0 0 3px rgba(233,196,106,0.13)" : "0 2px 8px rgba(22,58,107,0.06)", transition: "border-color 0.18s, box-shadow 0.18s" }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 11.5, fontWeight: 700, color: T.ink, lineHeight: 1 }}>{value}</span>
        <KeyboardArrowDownRoundedIcon style={{ fontSize: 16, color: T.brand, flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, right: 0, zIndex: 1000, background: T.white, border: `1.5px solid ${T.brandBorder}`, borderRadius: 12, boxShadow: "0 10px 30px rgba(22,58,107,0.14), 0 2px 8px rgba(22,58,107,0.07)", overflow: "hidden" }}>
          {options.map((opt) => {
            const active = opt === value;
            return (
              <button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false); }}
                style={{ width: "100%", minHeight: 30, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "7px 9px 7px 11px", background: active ? T.brandLight : "transparent", border: "none", borderBottom: opt === options[options.length - 1] ? "none" : `1px solid ${T.line}`, cursor: "pointer", textAlign: "left", transition: "background 0.12s" }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#f4f6fa"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
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

// ── Wilayah filter pill dropdown ─────────────────────────────────────────────
function WilayahDropdown({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const activeLabel = value === "all" ? "Semua wilayah" : value;
  const items = [{ value: "all", label: "Semua wilayah" }, ...options.map((name) => ({ value: name, label: name }))];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", width: 176 }}>
      <button type="button" onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", height: 36, display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 999, border: `1.5px solid ${open ? T.brand : "#d4ddf0"}`, background: "linear-gradient(180deg, #f8fafc 0%, #eef1f6 100%)", padding: "0 11px 0 14px", cursor: "pointer", outline: "none", boxShadow: open ? `0 0 0 3px ${T.brandLight}` : "0 2px 8px rgba(22,58,107,0.07)", transition: "border-color 0.18s, box-shadow 0.18s" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ width: 24, height: 24, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: value === "all" ? T.white : T.brandLight, border: `1px solid ${value === "all" ? T.line : T.brandBorder}` }}>
            <RoomRoundedIcon style={{ fontSize: 14, color: value === "all" ? T.subtle : T.brand }} />
          </span>
          <span style={{ fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: 700, color: value === "all" ? T.text : T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {activeLabel}
          </span>
        </span>
        <KeyboardArrowDownRoundedIcon style={{ fontSize: 19, color: T.brand, flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, width: "100%", minWidth: 200, zIndex: 1000, background: T.white, border: `1.5px solid ${T.brandBorder}`, borderRadius: 14, boxShadow: "0 8px 32px rgba(22,58,107,0.13), 0 2px 8px rgba(22,58,107,0.07)", overflow: "hidden", maxHeight: 260, overflowY: "auto" }}>
          <div style={{ padding: "6px 10px 4px", borderBottom: `1px solid ${T.line}` }}>
            <span style={{ fontFamily: FONT_SANS, fontSize: 10, fontWeight: 800, color: T.subtle, textTransform: "uppercase", letterSpacing: "0.07em" }}>Wilayah</span>
          </div>
          {items.map((item) => {
            const active = item.value === value;
            return (
              <button key={item.value} type="button" onClick={() => { onChange(item.value); setOpen(false); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: active ? T.brandLight : "transparent", border: "none", borderBottom: `1px solid ${T.line}`, cursor: "pointer", transition: "background 0.12s", textAlign: "left" }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#f4f6fa"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: item.value === "all" ? T.subtle : "#16a34a" }} />
                <span style={{ flex: 1, minWidth: 0, fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: active ? 800 : 600, color: active ? T.brand : T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.label}
                </span>
                {active && <CheckCircleOutlineRoundedIcon style={{ fontSize: 15, color: T.brand, flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── WA session pill dropdown ─────────────────────────────────────────────────
function SessionDropdown({ sessions, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = sessions.find((s) => s.id === value);
  const activeLabel = active ? (active.label || active.id) : "Pilih akun WA";

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", width: 188 }}>
      <button type="button" onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", height: 36, display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 999, border: `1.5px solid ${open ? T.wa : "#d4ddf0"}`, background: "linear-gradient(180deg, #f8fafc 0%, #eef1f6 100%)", padding: "0 11px 0 14px", cursor: "pointer", outline: "none", boxShadow: open ? `0 0 0 3px ${T.waBg}` : "0 2px 8px rgba(22,58,107,0.07)", transition: "border-color 0.18s, box-shadow 0.18s" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: active?.runtimeReady ? T.wa : T.subtle }} />
          <span style={{ fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: 700, color: active ? T.ink : T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {activeLabel}
          </span>
        </span>
        <KeyboardArrowDownRoundedIcon style={{ fontSize: 19, color: T.brand, flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, width: "100%", zIndex: 1000, background: T.white, border: `1.5px solid ${T.brandBorder}`, borderRadius: 14, boxShadow: "0 8px 32px rgba(22,58,107,0.13), 0 2px 8px rgba(22,58,107,0.07)", overflow: "hidden" }}>
          <div style={{ padding: "6px 10px 4px", borderBottom: `1px solid ${T.line}` }}>
            <span style={{ fontFamily: FONT_SANS, fontSize: 10, fontWeight: 800, color: T.subtle, textTransform: "uppercase", letterSpacing: "0.07em" }}>Akun WhatsApp</span>
          </div>
          {sessions.map((s) => {
            const isActive = s.id === value;
            return (
              <button key={s.id} type="button" onClick={() => { onChange(s.id); setOpen(false); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: isActive ? T.waBg : "transparent", border: "none", borderBottom: `1px solid ${T.line}`, cursor: "pointer", transition: "background 0.12s", textAlign: "left" }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "#f4f6fa"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: s.runtimeReady ? T.wa : T.subtle }} />
                <span style={{ flex: 1, minWidth: 0, fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: isActive ? 800 : 600, color: isActive ? T.green : T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.label || s.id}
                </span>
                {isActive && <CheckCircleOutlineRoundedIcon style={{ fontSize: 15, color: T.wa, flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Skeleton loading state ───────────────────────────────────────────────────
const SKEL_COLS = [50, 140, 130, 100, 100, 100, 120];
const SKEL_ROWS = Array.from({ length: 12 });

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
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", margin: "0 16px", overflow: "hidden" }}>
      <div style={{ display: "flex", borderBottom: `1.5px solid rgba(26,42,87,0.1)`, background: T.surface, flexShrink: 0 }}>
        {SKEL_COLS.map((w, ci) => (
          <div key={ci} style={{ padding: "12px 16px", flex: ci === 1 ? 2 : 1, minWidth: w }}>
            <SkeletonBar w={`${[40,55,48,44,42,38,50][ci]}%`} delay={ci * 0.05} />
          </div>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {SKEL_ROWS.map((_, ri) => (
          <div key={ri} style={{ display: "flex", borderBottom: `1px solid rgba(26,42,87,0.05)`, background: ri % 2 === 0 ? T.white : T.surface, alignItems: "center" }}>
            {SKEL_COLS.map((w, ci) => (
              <div key={ci} style={{ padding: "11px 16px", flex: ci === 1 ? 2 : 1, minWidth: w }}>
                <SkeletonBar w={`${Math.round(50 + ((ri * 7 + ci * 13) % 35))}%`} delay={(ri * 0.04 + ci * 0.02)} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Pill action button (sama persis dengan tombol Generate PDF di halaman Input) ──
function Btn({ children, onClick, disabled, startIcon, style = {} }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: 6, height: 34, paddingInline: 16, borderRadius: 999,
    fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    border: "none", whiteSpace: "nowrap", color: "#fff",
    background: "linear-gradient(135deg, var(--accent-teal) 0%, var(--accent-teal-dark) 100%)",
    boxShadow: "0 12px 26px rgba(42,157,143,0.24)",
    opacity: disabled ? 0.6 : 1,
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...style }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 16px 32px rgba(42,157,143,0.3)"; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 12px 26px rgba(42,157,143,0.24)"; }}>
      {startIcon}
      {children}
    </button>
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

// ── PDF / Kirim segmented toggle (nempel, tema brand + accent-teal) ─────────
function PdfSendToggle({ pdfHref, onSend, sendDisabled, sendTooltip, sendActive }) {
  const segStyle = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
    height: 32, flex: 1, fontFamily: FONT_SANS, fontSize: 11, fontWeight: 700,
    border: "none", cursor: "pointer", textDecoration: "none",
    whiteSpace: "nowrap", position: "relative", zIndex: 1,
    filter: "brightness(1)", boxShadow: "none",
    transition: "filter 0.22s ease, box-shadow 0.22s ease, transform 0.22s ease",
  };
  return (
    <div style={{ display: "inline-flex", alignItems: "stretch", width: 132, height: 32, borderRadius: 999, overflow: "visible", border: `1.5px solid ${T.line}` }}>
      {pdfHref ? (
        <a href={pdfHref} target="_blank" rel="noopener noreferrer"
          style={{ ...segStyle, background: "linear-gradient(135deg, #a5790f 0%, #8a680f 100%)", color: "#fff", borderRadius: "999px 0 0 999px" }}
          onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.15)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(138,104,15,0.55)"; e.currentTarget.style.transform = "translateY(-1.5px)"; }}
          onMouseLeave={e => { e.currentTarget.style.filter = "brightness(1)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
          <InsertDriveFileOutlinedIcon style={{ fontSize: 14 }} /> Pdf
        </a>
      ) : (
        <span style={{ ...segStyle, background: T.surface, color: T.subtle, cursor: "not-allowed", borderRadius: "999px 0 0 999px" }}>
          <InsertDriveFileOutlinedIcon style={{ fontSize: 14 }} /> Pdf
        </span>
      )}
      <Tooltip title={sendTooltip || ""}>
        <button type="button" onClick={sendDisabled ? undefined : onSend} disabled={sendDisabled}
          style={{ ...segStyle, borderLeft: `1.5px solid ${T.line}`, borderRadius: "0 999px 999px 0", background: sendDisabled ? T.surface : "linear-gradient(135deg, var(--accent-teal) 0%, var(--accent-teal-dark) 100%)", color: sendDisabled ? T.subtle : "#fff", opacity: sendDisabled ? 0.6 : 1, cursor: sendDisabled ? "not-allowed" : "pointer" }}
          onMouseEnter={e => { if (sendDisabled) return; e.currentTarget.style.filter = "brightness(1.25)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(42,157,143,0.55)"; e.currentTarget.style.transform = "translateY(-1.5px)"; }}
          onMouseLeave={e => { e.currentTarget.style.filter = "brightness(1)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
          <WhatsAppIcon style={{ fontSize: 14 }} /> Kirim
        </button>
      </Tooltip>
    </div>
  );
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
  const [searchQuery,     setSearchQuery]     = useState("");
  const [sendConfirm,     setSendConfirm]     = useState({ open: false, rows: [], mode: "single" });
  const [toast,           setToast]           = useState({ open: false, message: "", severity: "success" });
  const [waSessions,      setWaSessions]      = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [headerSlot,      setHeaderSlot]      = useState(null);
  const logRefreshTimerRef = useRef(null);

  const showToast = (message, severity = "success") => setToast({ open: true, message, severity });

  useEffect(() => {
    setTimeout(() => setHeaderSlot(document.getElementById("header-wa-slot")), 100);
  }, []);

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
  const wilayahFilteredRows = logRows.filter((r) => wilayahFilter === "all" || String(r.wilayah || "").trim() === wilayahFilter);
  const filteredRows = wilayahFilteredRows.filter((r) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return Object.values(r).some((value) => String(value ?? "").toLowerCase().includes(q));
  });
  const totalPages      = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const pagedRows       = filteredRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const sendableRows    = filteredRows.filter((r) => r.nomor && r.nomor !== "TIDAK DITEMUKAN");
  const activeSession   = waSessions.find((s) => s.id === selectedSession);

  useEffect(() => { if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1)); }, [page, totalPages]);

  return (
    <Box sx={{ fontFamily: FONT_SANS, p: 2, display: "flex", flexDirection: "column", gap: 1.5, height: "calc(100vh - 64px)", boxSizing: "border-box", overflow: "hidden" }}>

      {/* Header portal */}
      {headerSlot && createPortal(
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <style>{`.hdr-search::placeholder { color: rgba(255,255,255,0.42); font-weight: 400; }`}</style>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <SearchRoundedIcon style={{ position: "absolute", left: 11, fontSize: 14, color: "rgba(255,255,255,0.55)", pointerEvents: "none" }} />
            <input type="text" className="hdr-search" placeholder="Search..." value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              style={{ height: 34, paddingLeft: 32, paddingRight: searchQuery ? 30 : 14, width: 200, fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: 500, color: "#fff", border: "1.5px solid rgba(255,255,255,0.22)", borderRadius: 10, background: "rgba(255,255,255,0.12)", outline: "none", transition: "border-color 0.18s, background 0.18s", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.12)" }}
              onFocus={e => { e.target.style.borderColor = "rgba(233,196,106,0.8)"; e.target.style.background = "rgba(233,196,106,0.12)"; }}
              onBlur={e  => { e.target.style.borderColor = searchQuery ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.22)"; e.target.style.background = "rgba(255,255,255,0.12)"; }}
            />
            {searchQuery && (
              <button type="button" onClick={() => { setSearchQuery(""); setPage(0); }} style={{ position: "absolute", right: 8, width: 16, height: 16, borderRadius: "50%", background: "rgba(255,255,255,0.28)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                <CloseRoundedIcon style={{ fontSize: 9, color: "#fff" }} />
              </button>
            )}
          </div>
          <button type="button" className="header-icon-button header-icon-button--compact" onClick={fetchLog} disabled={loading} title="Refresh" aria-label="Refresh">
            {loading ? <CircularProgress size={15} sx={{ color: "#fff" }} /> : <SyncRoundedIcon style={{ fontSize: 17 }} />}
          </button>
        </div>,
        headerSlot
      )}

      <section className="dashboard-panel" style={{ flex: 1, minHeight: 0, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", borderRadius: 28 }}>

        {/* Card Header */}
        <div className="dashboard-panel__header" style={{ padding: "18px 24px 12px", borderBottom: "none", background: T.white, flexShrink: 0, margin: 0 }}>
          <div>
            <p className="dashboard-panel__eyebrow" style={{ fontFamily: FONT_SANS, marginBottom: 2 }}>PDF</p>
            <h2 className="dashboard-panel__title" style={{ margin: 0 }}>Hasil PDF</h2>
            {logRows.length > 0 && (
              <p className="dashboard-panel__description" style={{ margin: "3px 0 0", fontFamily: FONT_MONO }}>
                {filteredRows.length} file
                {wilayahFilter !== "all" && <span style={{ color: T.brand }}> · {wilayahFilter}</span>}
                {searchQuery.trim() && <span style={{ color: T.brand }}> · search aktif</span>}
                {logGeneratedAt && <span> · {formatGeneratedAt(logGeneratedAt)}</span>}
              </p>
            )}
          </div>
          <div className="dashboard-panel__action" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
            <WilayahDropdown options={wilayahOptions} value={wilayahFilter} onChange={(next) => { setWilayahFilter(next); setPage(0); }} />
            {waSessions.length > 0 && (
              <SessionDropdown sessions={waSessions} value={selectedSession} onChange={setSelectedSession} />
            )}
            {logRows.length > 0 && !waSending && (
              <Btn onClick={() => openSendConfirm(sendableRows, "bulk")}
                disabled={!sendableRows.length || !selectedSession}
                startIcon={<WhatsAppIcon style={{ fontSize: 14 }} />}>
                {wilayahFilter === "all" ? "Kirim Semua" : "Kirim Filter"}
              </Btn>
            )}
          </div>
        </div>

        {!loading && logRows.length === 0 && (
          <div style={{ padding: "0 20px 10px", flexShrink: 0 }}>
            <Alert severity="info" sx={{ fontFamily: FONT_SANS, fontSize: 12, py: 0.25, borderRadius: "10px" }}>
              Belum ada data — generate dari halaman Generate PDF terlebih dahulu
            </Alert>
          </div>
        )}

        {/* WA Progress */}
        {waSending && (
          <div style={{ padding: "10px 24px 12px", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <WhatsAppIcon style={{ fontSize: 14, color: "var(--accent-teal)" }} />
                <span style={{ fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: 600, color: "var(--accent-teal-dark)" }}>
                  {waProgress.customer || "Mengirim..."}
                </span>
              </div>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: "var(--accent-teal)", fontWeight: 700 }}>
                {waProgress.current}/{waProgress.total}
              </span>
            </div>
            <LinearProgress variant="determinate" value={waPercent}
              sx={{ height: 5, borderRadius: 3, bgcolor: "rgba(42,157,143,0.22)", "& .MuiLinearProgress-bar": { background: "linear-gradient(135deg, var(--accent-teal) 0%, var(--accent-teal-dark) 100%)", borderRadius: 3 } }} />
          </div>
        )}

        {/* Body */}
        {loading ? (
          <LoadingTableState />
        ) : (
          <div className="users-table-wrapper" style={{ flex: 1, minHeight: 0, margin: "0 16px", overflowX: "hidden", overflowY: "auto" }}>
            <table className="users-table" style={{ fontFamily: FONT_SANS, width: "100%", minWidth: 0, tableLayout: "fixed" }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                <tr>
                  {["Customer", "No. WhatsApp", "Wilayah", "Jatuh Tempo", "Total Tagihan", "Aksi"].map((h, i) => (
                    <th key={i} style={{ color: T.brandDark, fontSize: 10.5, fontWeight: 700, padding: "10px 14px", whiteSpace: "nowrap", textAlign: h === "Total Tagihan" ? "right" : h === "Aksi" ? "center" : "left", background: T.surface, textTransform: "none", letterSpacing: 0, overflow: "hidden", textOverflow: "ellipsis", width: h === "Aksi" ? 180 : h === "No. WhatsApp" ? "16%" : undefined }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "48px 20px", textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                        {logRows.length === 0 ? (
                          <>
                            <DescriptionRoundedIcon style={{ fontSize: 32, color: T.subtle }} />
                            <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: T.muted, fontWeight: 600 }}>Belum ada PDF</span>
                            <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: T.subtle }}>Generate PDF terlebih dahulu dari halaman Generate PDF</span>
                          </>
                        ) : (
                          <>
                            <SearchRoundedIcon style={{ fontSize: 32, color: T.subtle }} />
                            <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: T.muted, fontWeight: 600 }}>Tidak ada data untuk filter ini</span>
                            <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: T.subtle }}>Coba ubah wilayah atau kata pencarian</span>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : pagedRows.map((row, i) => (
                  <tr key={i} className="users-table__row" style={{ background: i % 2 !== 0 ? T.surface : T.white }}>
                    <td style={{ padding: "8px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                        <span className="users-table__avatar" style={{ width: 30, height: 30, fontFamily: FONT_SANS, fontSize: 9.5, letterSpacing: "0.04em", flexShrink: 0 }}>{getInitials(row.nama)}</span>
                        <span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 700, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.nama || "—"}</span>
                      </div>
                    </td>
                    <td style={{ padding: "8px 14px" }}>
                      {row.nomor && row.nomor !== "TIDAK DITEMUKAN" ? (
                        <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: T.text, fontWeight: 400 }}>{row.nomor}</span>
                      ) : (
                        <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: T.subtle, fontStyle: "italic" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "8px 14px" }}>
                      {row.wilayah && row.wilayah !== "CEK" ? (
                        <span className={`users-table__status users-table__status--inline ${/dalam/i.test(row.wilayah) ? "users-table__status--active" : /luar/i.test(row.wilayah) ? "users-table__status--pending" : "users-table__status--app"}`}>{row.wilayah}</span>
                      ) : (
                        <span style={{ color: T.subtle, fontSize: 12, fontStyle: "italic" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "8px 14px" }}>
                      <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: T.text, fontWeight: 500 }}>{row.tempo || "—"}</span>
                    </td>
                    <td style={{ padding: "8px 14px", textAlign: "right" }}>
                      <span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 400, color: T.text }}>{row.total || "—"}</span>
                    </td>
                    <td style={{ padding: "6px 10px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center", alignItems: "center" }}>
                        <PdfSendToggle
                          pdfHref={row.pdf ? `${API_RAW}${row.pdf}` : null}
                          onSend={() => openSendConfirm([row], "single")}
                          sendDisabled={waSending || !row.nomor || row.nomor === "TIDAK DITEMUKAN" || !selectedSession}
                          sendTooltip={row.nomor && row.nomor !== "TIDAK DITEMUKAN" ? "Kirim via WA" : "Nomor tidak tersedia"}
                          sendActive={row.nomor && row.nomor !== "TIDAK DITEMUKAN"}
                        />
                        {row.driveUrl ? (
                          <ActionBtn href={row.driveUrl} tooltip="Google Drive" colorScheme="brand"
                            icon={<CloudDoneRoundedIcon style={{ fontSize: 14 }} />} />
                        ) : row.driveError ? (
                          <ActionBtn disabled tooltip={`Drive gagal: ${row.driveError}`} colorScheme="muted"
                            icon={<ErrorOutlineRoundedIcon style={{ fontSize: 14 }} />} />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredRows.length > 0 && (
          <div className="users-table-pagination" style={{ padding: "9px 22px 8px", borderTop: `1px solid ${T.line}`, marginTop: 0 }}>
            <div className="users-table-pagination__meta" style={{ gap: 10 }}>
              <p className="users-table-pagination__summary" style={{ fontSize: 11.5, lineHeight: 1.35 }}>
                {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filteredRows.length)} of{" "}
                <strong>{filteredRows.length}</strong> rows
                {wilayahFilter !== "all" && <span style={{ marginLeft: 6, color: T.brand, fontWeight: 600 }}>· {wilayahFilter}</span>}
                {searchQuery.trim() && <span style={{ marginLeft: 6, color: T.brand, fontWeight: 600 }}>· search aktif</span>}
              </p>
              <label className="users-table-pagination__page-size" style={{ gap: 6, fontSize: 11.5 }}>
                <span>Show</span>
                <RowsPerPageDropdown value={rowsPerPage} onChange={(nextRows) => { setRowsPerPage(nextRows); setPage(0); }} />
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
      </section>

      {/* Confirm Dialog */}
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
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(42,157,143,0.08)", border: "1px solid rgba(42,157,143,0.35)" }}>
              <WhatsAppIcon style={{ fontSize: 14, color: "var(--accent-teal)" }} />
              <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: "var(--accent-teal-dark)", fontWeight: 600 }}>
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
            style={{ paddingInline: 16, fontSize: 12, gap: 6, background: "linear-gradient(135deg, var(--accent-teal) 0%, var(--accent-teal-dark) 100%)", borderColor: "transparent", color: "#fff" }}>
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
