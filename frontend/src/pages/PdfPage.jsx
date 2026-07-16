import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import AddToDriveRoundedIcon from "@mui/icons-material/AddToDriveRounded";
import CloudDoneRoundedIcon from "@mui/icons-material/CloudDoneRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import AssignmentIndRoundedIcon from "@mui/icons-material/AssignmentIndRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
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

function getInitials(name) {
  if (!name) return "?";
  return String(name).trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("") || "?";
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

function PenagihDropdown({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const activeLabel = value === "all" ? "Semua penagih" : value;
  const items = [{ value: "all", label: "Semua penagih" }, ...options.map((name) => ({ value: name, label: name }))];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", width: 188 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", height: 36, display: "flex", alignItems: "center", justifyContent: "space-between",
          borderRadius: 999, border: "1.5px solid #d4ddf0",
          background: "linear-gradient(180deg, #f8fafc 0%, #eef1f6 100%)",
          padding: "0 11px 0 14px", cursor: "pointer", outline: "none", WebkitTapHighlightColor: "transparent",
          boxShadow: "0 2px 8px rgba(22,58,107,0.07)",
          transition: "border-color 0.18s",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ width: 24, height: 24, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: T.white, border: `1px solid ${T.line}` }}>
            <AssignmentIndRoundedIcon style={{ fontSize: 15, color: T.subtle }} />
          </span>
          <span style={{ fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: 700, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {activeLabel}
          </span>
        </span>
        <KeyboardArrowDownRoundedIcon style={{ fontSize: 19, color: T.brand, flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, width: "100%", zIndex: 1000, background: T.white, border: `1.5px solid ${T.brandBorder}`, borderRadius: 14, boxShadow: "0 8px 32px rgba(22,58,107,0.13), 0 2px 8px rgba(22,58,107,0.07)", overflow: "hidden" }}>
          <div style={{ padding: "6px 10px 4px", borderBottom: `1px solid ${T.line}` }}>
            <span style={{ fontFamily: FONT_SANS, fontSize: 10, fontWeight: 800, color: T.subtle, textTransform: "uppercase", letterSpacing: "0.07em" }}>Penagih</span>
          </div>
          {items.map((item) => {
            const active = item.value === value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => { onChange(item.value); setOpen(false); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px 9px 9px",
                  background: "transparent",
                  borderTop: "none", borderRight: "none",
                  borderBottom: `1px solid ${T.line}`,
                  borderLeft: `3px solid ${active ? "#16a34a" : "transparent"}`,
                  cursor: "pointer", textAlign: "left", outline: "none", WebkitTapHighlightColor: "transparent",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f4f6fa"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: item.value === "all" ? T.subtle : "#16a34a" }} />
                <span style={{ flex: 1, minWidth: 0, fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: active ? 800 : 600, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.label}
                </span>
                {active && <CheckCircleOutlineRoundedIcon style={{ fontSize: 15, color: "#16a34a", flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const SKEL_COLS = [48, 110, 90, 160, 80, 70, 90, 70, 60];
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
          <div key={ci} style={{ padding: "12px 16px", flex: ci === 3 ? 2 : 1, minWidth: w }}>
            <SkeletonBar w={`${[40,55,48,52,44,38,50,42,36][ci]}%`} delay={ci * 0.05} />
          </div>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {SKEL_ROWS.map((_, ri) => (
          <div key={ri} style={{ display: "flex", borderBottom: `1px solid rgba(26,42,87,0.05)`, background: ri % 2 === 0 ? T.white : T.surface, alignItems: "center" }}>
            {SKEL_COLS.map((w, ci) => (
              <div key={ci} style={{ padding: "11px 16px", flex: ci === 3 ? 2 : 1, minWidth: w }}>
                <SkeletonBar w={`${Math.round(50 + ((ri * 7 + ci * 13) % 35))}%`} delay={(ri * 0.04 + ci * 0.02)} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
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

  if (variant === "ghost") {
    return (
      <button onClick={onClick} disabled={disabled || loading}
        style={{ ...base, background: "rgba(220,38,38,0.10)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", color: T.red, border: `1.5px solid rgba(220,38,38,0.35)`, boxShadow: "none", ...style }}
        onMouseEnter={e => { if (!disabled && !loading) { e.currentTarget.style.background = "rgba(220,38,38,0.18)"; e.currentTarget.style.borderColor = "rgba(220,38,38,0.55)"; } }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(220,38,38,0.10)"; e.currentTarget.style.borderColor = "rgba(220,38,38,0.35)"; }}>
        {loading ? <CircularProgress size={13} sx={{ color: T.red }} /> : startIcon}
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

/* Modern pill toggle — replaces the plain MUI Switch */
function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position: "relative", width: 46, height: 26, padding: 0, flexShrink: 0,
        border: "none", borderRadius: 999, cursor: disabled ? "not-allowed" : "pointer",
        background: checked ? "linear-gradient(135deg, #22c55e 0%, #15803d 100%)" : "#d1d5db",
        boxShadow: checked ? "0 3px 10px rgba(21,128,61,0.35), inset 0 1px 1px rgba(255,255,255,0.25)" : "inset 0 1px 3px rgba(0,0,0,0.15)",
        transition: "background 0.28s ease, box-shadow 0.28s ease",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: checked ? 23 : 3, width: 20, height: 20, borderRadius: "50%",
        background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 5px rgba(0,0,0,0.28)",
        transition: "left 0.28s cubic-bezier(0.34,1.4,0.64,1)",
      }}>
        <CheckRoundedIcon style={{ fontSize: 13, color: checked ? "#16a34a" : "transparent", transition: "color 0.2s" }} />
      </span>
    </button>
  );
}

const CELL_FIELD_LABELS = {
  noInvoice: "No Invoice",
  customer: "Customer",
  tanggalInvoice: "Tgl Invoice",
  tempo: "Jatuh Tempo",
  termin: "Termin",
  tagihan: "Tagihan",
  penagih: "Penagih",
};

/* Floating cell editor — gaya sama persis dengan CellDropdown di InputPage */
function CellPopupEditor({ rect, value, label, type = "text", placeholder, onClose, onChange, onKeyDown }) {
  if (!rect) return null;

  const viewportH  = window.innerHeight;
  const spaceBelow = viewportH - rect.bottom;
  const spaceAbove = rect.top;
  const dropH      = 118;

  let top, transformOrigin;
  if (spaceBelow >= dropH || spaceBelow >= spaceAbove) {
    top = rect.bottom + 6;
    transformOrigin = "top left";
  } else {
    top = rect.top - dropH - 6;
    transformOrigin = "bottom left";
  }

  const left  = Math.max(8, Math.min(rect.left, window.innerWidth - Math.max(rect.width, 280) - 8));
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

        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
          padding: "14px 16px 12px",
          background: "linear-gradient(180deg, rgba(24,43,88,1) 0%, rgba(27,55,112,0.96) 100%)",
          borderBottom: "1px solid rgba(26,42,87,0.10)",
        }}>
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
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: "100%", boxSizing: "border-box",
              height: 38, padding: "0 12px",
              border: "1.5px solid rgba(26,42,87,0.18)",
              borderRadius: 10,
              fontFamily: FONT_SANS, fontSize: 13, fontWeight: 500,
              color: T.ink, outline: "none",
              background: T.brandLight,
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
            onFocus={(e) => { e.target.style.borderColor = T.brand; e.target.style.boxShadow = "0 0 0 3px rgba(35,57,113,0.10)"; }}
            onBlur={(e)  => { e.target.style.borderColor = "rgba(26,42,87,0.18)"; e.target.style.boxShadow = "none"; }}
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

function DeleteConfirmPopup({ open, label, onConfirm, onCancel }) {
  const [fading, setFading] = useState(false);

  useEffect(() => { if (!open) setFading(false); }, [open]);

  const handleCancel  = () => { setFading(true); setTimeout(() => { setFading(false); onCancel(); }, 320); };
  const handleConfirm = () => { onConfirm(); };

  if (!open) return null;
  return (
    <>
      <style>{`
        @keyframes _del-in  { 0% { opacity:0; transform:scale(0.88); } 65% { transform:scale(1.02); } 100% { opacity:1; transform:scale(1); } }
        @keyframes _del-out { from { opacity:1; transform:scale(1); } to { opacity:0; transform:scale(0.88); } }
      `}</style>
      <div style={{ position: "fixed", inset: 0, zIndex: 1300, background: "rgba(10,18,40,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={handleCancel}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: 300, borderRadius: 18, overflow: "hidden", border: "1px solid rgba(239,68,68,0.18)", boxShadow: "0 20px 56px rgba(10,18,40,0.30), 0 4px 14px rgba(10,18,40,0.12)", animation: fading ? "_del-out 0.32s cubic-bezier(.4,0,1,1) forwards" : "_del-in 0.42s cubic-bezier(.22,.68,0,1.1) both" }}>
          {/* Header */}
          <div style={{ padding: "16px 16px 14px", background: "linear-gradient(180deg, rgba(24,43,88,1) 0%, rgba(27,55,112,0.96) 100%)", borderBottom: "1px solid rgba(26,42,87,0.10)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.28)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <DeleteForeverRoundedIcon style={{ fontSize: 20, color: "#f87171" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, color: "rgba(233,196,106,0.92)", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 3px" }}>Generate PDF</p>
              <h3 style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.2 }}>Hapus Baris</h3>
            </div>
          </div>
          {/* Body */}
          <div style={{ padding: "14px 16px", background: "#fff" }}>
            <p style={{ fontFamily: FONT_SANS, fontSize: 12.5, color: T.text, margin: "0 0 4px", lineHeight: 1.6 }}>
              Hapus baris <strong style={{ color: T.ink }}>{label}</strong>?
            </p>
            <p style={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.muted, margin: 0, lineHeight: 1.5 }}>
              Data akan dihapus permanen dan tidak bisa dikembalikan.
            </p>
          </div>
          {/* Actions */}
          <div style={{ display: "flex", gap: 8, padding: "0 16px 16px", background: "#fff" }}>
            <button type="button" onClick={handleCancel}
              style={{ flex: 1, height: 36, borderRadius: 10, border: `1px solid ${T.line}`, background: "#f8fafc", color: T.text, fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: 600, cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#eef1f6"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#f8fafc"; }}>
              Batal
            </button>
            <button type="button" onClick={handleConfirm}
              style={{ flex: 1, height: 36, borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)", background: "linear-gradient(180deg, #ef4444 0%, #dc2626 100%)", color: "#fff", fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "opacity 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
              <DeleteForeverRoundedIcon style={{ fontSize: 14 }} />
              Hapus
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function PdfPage() {
  const [rows, setRows]                   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [customerCount, setCustomerCount] = useState(0);
  const [generating, setGenerating]       = useState(false);
  const [progress, setProgress]           = useState({ current: 0, total: 0, status: "", ptName: "" });
  const [toast, setToast]                 = useState({ open: false, message: "", severity: "success" });
  const [editingCell, setEditingCell]     = useState(null);
  const [cellRect, setCellRect]           = useState(null);
  const [driveConfig, setDriveConfig]     = useState({ folderId: "", enabled: false, scriptUrl: "" });
  const [driveLoading, setDriveLoading]   = useState(false);
  const [driveConfigOpen, setDriveConfigOpen] = useState(false);
  const [showScriptUrl, setShowScriptUrl] = useState(false);
  const [showFolderId, setShowFolderId]   = useState(false);
  const [cancelling, setCancelling]       = useState(false);
  const [resettingProgress, setResettingProgress] = useState(false);
  const [rowsPerPage, setRowsPerPage]     = useState(25);
  const [page, setPage]                   = useState(0);
  const [penagihFilter, setPenagihFilter] = useState("all");
  const [searchQuery, setSearchQuery]     = useState("");
  const [headerSlot, setHeaderSlot]       = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, idx: -1, label: "" });

  const rowsRef  = useRef([]);
  const activeCellRef = useRef(null);
  const driveReady      = !!driveConfig.enabled && !!driveConfig.scriptUrl && !!driveConfig.folderId;
  const hasProgressState = !!progress.status || progress.current > 0 || progress.total > 0;

  const penagihOptions = Array.from(
    new Set(rows.map((row) => String(row.penagih || "").trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "id"));

  const penagihFilteredRows = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => penagihFilter === "all" || String(row.penagih || "").trim() === penagihFilter);

  const filteredRows = penagihFilteredRows.filter(({ row }) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(q));
  });

  const activePenagihFilter     = penagihFilter !== "all";
  const filteredCustomerCount   = new Set(penagihFilteredRows.map(({ row }) => row.customer).filter(Boolean)).size;
  const generateCustomerCount   = activePenagihFilter ? filteredCustomerCount : customerCount;
  const generateRowCount        = activePenagihFilter ? penagihFilteredRows.length : rows.length;
  const totalPages              = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const pagedRows               = filteredRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const showToast = (message, severity = "success") => setToast({ open: true, message, severity });

  useEffect(() => {
    setTimeout(() => setHeaderSlot(document.getElementById("header-wa-slot")), 100);
  }, []);

  const loadInitial = async () => {
    setLoading(true);
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
    finally { setLoading(false); }
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
    const targetRows          = activePenagihFilter ? penagihFilteredRows.map(({ row }) => row) : rows;
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
  const handleCellChange = (value) => {
    if (!editingCell) return;
    setRows((prev) => prev.map((r, i) => (i === editingCell.row ? { ...r, [editingCell.field]: value } : r)));
  };
  const commitCellEdit = async () => {
    setEditingCell(null); setCellRect(null);
    setCustomerCount(new Set(rowsRef.current.map((r) => r.customer).filter(Boolean)).size);
    try { await api.put("/pdf/temporary/rows", { rows: rowsRef.current }); }
    catch { showToast("Gagal simpan ke server", "error"); }
  };
  const cancelCellEdit = () => {
    if (editingCell) setRows((prev) => prev.map((r, i) => (i === editingCell.row ? { ...r, [editingCell.field]: editingCell.orig } : r)));
    setEditingCell(null); setCellRect(null);
  };
  const handleCellPopupKey = (e) => {
    if (e.key === "Enter") { e.preventDefault(); commitCellEdit(); }
    else if (e.key === "Escape") { cancelCellEdit(); }
  };

  const deleteRow = async (idx) => {
    const newRows = rows.filter((_, i) => i !== idx);
    setRows(newRows);
    setCustomerCount(new Set(newRows.map((r) => r.customer).filter(Boolean)).size);
    try { await api.put("/pdf/temporary/rows", { rows: newRows }); showToast("Baris dihapus", "success"); }
    catch { showToast("Gagal hapus baris", "error"); }
  };

  const requestDeleteRow = (idx) => {
    const label = rows[idx]?.customer || rows[idx]?.noInvoice || `#${idx + 1}`;
    setDeleteConfirm({ open: true, idx, label });
  };

  const confirmDeleteRow = () => {
    const { idx } = deleteConfirm;
    setDeleteConfirm({ open: false, idx: -1, label: "" });
    if (idx >= 0) deleteRow(idx);
  };

  const handleSaveDriveConfig = async () => {
    setDriveLoading(true);
    try { await api.post("/pdf/drive-config", { folderId: driveConfig.folderId, enabled: driveConfig.enabled, scriptUrl: driveConfig.scriptUrl }); showToast("Konfigurasi Google Drive disimpan", "success"); }
    catch (err) { showToast(err?.response?.data?.message || "Gagal simpan konfigurasi", "error"); }
    finally { setDriveLoading(false); }
  };

  rowsRef.current = rows;
  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  useEffect(() => {
    if (!editingCell) { setCellRect(null); return; }
    requestAnimationFrame(() => {
      if (activeCellRef.current) {
        const r = activeCellRef.current.getBoundingClientRect();
        setCellRect({ top: r.top, bottom: r.bottom, left: r.left, width: r.width });
      }
    });
  }, [editingCell]);

  return (
    <Box sx={{ fontFamily: FONT_SANS, p: 2, display: "flex", flexDirection: "column", gap: 1.5, height: "calc(100vh - 64px)", boxSizing: "border-box", overflow: "hidden" }}>
      {headerSlot && createPortal(
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <style>{`.hdr-search::placeholder { color: rgba(255,255,255,0.42); font-weight: 400; }`}</style>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <SearchRoundedIcon style={{ position: "absolute", left: 11, fontSize: 14, color: "rgba(255,255,255,0.55)", pointerEvents: "none" }} />
            <input
              type="text"
              className="hdr-search"
              placeholder="Search..."
              value={searchQuery}
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
          <button type="button" className="header-icon-button header-icon-button--compact" onClick={() => setDriveConfigOpen(true)} title="Setting Drive" aria-label="Setting Drive">
            <SettingsRoundedIcon style={{ fontSize: 17 }} />
          </button>
        </div>,
        headerSlot
      )}

      {/* ── Action Panel ── */}
      <section className="dashboard-panel" style={{ display: "none", padding: 0, overflow: "hidden", flexShrink: 0 }}>

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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
            <TextField
              size="small"
              value={searchQuery}
              onChange={(event) => { setSearchQuery(event.target.value); setPage(0); }}
              placeholder="Search..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ fontSize: 16, color: T.brand }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: 190,
                "& .MuiOutlinedInput-root": {
                  height: 34,
                  borderRadius: "999px",
                  bgcolor: T.surface,
                  fontFamily: FONT_SANS,
                  fontSize: 12,
                  "& fieldset": { borderColor: T.line },
                  "&:hover fieldset": { borderColor: T.brandBorder },
                  "&.Mui-focused fieldset": { borderColor: T.brand },
                },
                "& input": { py: 0, fontSize: 12 },
              }}
            />
            <PenagihDropdown
              options={penagihOptions}
              value={penagihFilter}
              onChange={(next) => { setPenagihFilter(next); setPage(0); }}
            />
            <Btn variant="outline" onClick={() => setDriveConfigOpen(true)} startIcon={<SettingsRoundedIcon style={{ fontSize: 14 }} />}>
              Setting Drive
            </Btn>
            {!generating ? (
              <Btn color="teal" onClick={handleGenerate} disabled={!generateRowCount} startIcon={<ReceiptLongRoundedIcon style={{ fontSize: 14 }} />}>
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
            {!loading && !rows.length && <Alert severity="info" sx={{ fontFamily: FONT_SANS, fontSize: 12, py: 0.25, borderRadius: "10px" }}>Belum ada data — siapkan dari halaman Input Data terlebih dahulu</Alert>}
            {driveConfig.enabled && !driveReady && <Alert severity="warning" sx={{ fontFamily: FONT_SANS, fontSize: 12, py: 0.25, borderRadius: "10px" }}>Upload Drive aktif tapi belum lengkap — isi Apps Script URL dan Folder ID di Setting Drive.</Alert>}
            {hasProgressState && (
              <div style={{ paddingBottom: 4 }}>
                <Btn color="red" onClick={handleResetProgress} loading={resettingProgress} style={{ height: 30, fontSize: 11.5 }}>
                  Reset Status Proses
                </Btn>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Table Panel ── */}
      {(
        <section className="dashboard-panel" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>

          {/* Table card header */}
          <div className="dashboard-panel__header" style={{ padding: "18px 24px 12px", borderBottom: "none", background: T.white, flexShrink: 0, margin: 0 }}>
            <div>
              <p className="dashboard-panel__eyebrow" style={{ fontFamily: FONT_SANS, marginBottom: 2 }}>Google Sheet</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <h2 className="dashboard-panel__title" style={{ margin: 0 }}>Sheet PDF</h2>
                {driveReady && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, minHeight: 20, padding: "0 8px", borderRadius: 999, background: "#e8f0fe", border: "1.5px solid #c5d8fb", fontFamily: FONT_SANS, fontSize: 10.5, color: "#1a73e8", fontWeight: 700 }}>
                    <CloudDoneRoundedIcon style={{ fontSize: 12 }} />
                    Drive aktif
                  </span>
                )}
              </div>
              {rows.length > 0 && (
                <p className="dashboard-panel__description" style={{ margin: "3px 0 0", fontFamily: FONT_MONO }}>
                  {rows.length} rows · 9 columns
                  {penagihFilter !== "all" && <span style={{ color: T.muted }}> · {penagihFilter}</span>}
                  {searchQuery.trim() && <span style={{ color: T.brand }}> · search aktif</span>}
                </p>
              )}
            </div>
            <div className="dashboard-panel__action" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
              <PenagihDropdown
                options={penagihOptions}
                value={penagihFilter}
                onChange={(next) => { setPenagihFilter(next); setPage(0); }}
              />
              {!generating ? (
                <Btn color="teal" onClick={handleGenerate} disabled={!generateRowCount} startIcon={<ReceiptLongRoundedIcon style={{ fontSize: 14 }} />}>
                  Generate {generateCustomerCount > 0 ? `${generateCustomerCount} PDF` : "PDF"}
                </Btn>
              ) : (
                <Btn color="red" onClick={handleCancelGenerate} disabled={cancelling} loading={cancelling}>
                  {cancelling ? "Membatalkan..." : "Batalkan Generate"}
                </Btn>
              )}
            </div>
          </div>

          {generating && (
            <div style={{ padding: "12px 20px 14px", borderBottom: `1px solid ${T.line}`, background: T.white, flexShrink: 0 }}>
              <style>{`
                @keyframes pdfShineSweep { 0% { transform: translateX(-120%); } 100% { transform: translateX(340%); } }
                @keyframes pdfRingSpin   { to { transform: rotate(360deg); } }
              `}</style>
              <div style={{
                display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
                borderRadius: 16, background: T.surface, border: `1.5px solid ${T.line}`,
                boxShadow: "0 4px 14px rgba(22,42,87,0.06)",
              }}>
                {/* Percent ring */}
                <div style={{ position: "relative", width: 54, height: 54, flexShrink: 0 }}>
                  <svg width="54" height="54" viewBox="0 0 54 54" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="27" cy="27" r="23" fill="none" stroke={T.brandLight} strokeWidth="5" />
                    <circle
                      cx="27" cy="27" r="23" fill="none" stroke="url(#pdfAvatarGrad)" strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 23}
                      strokeDashoffset={2 * Math.PI * 23 * (1 - percent / 100)}
                      style={{ transition: "stroke-dashoffset 0.5s cubic-bezier(.4,0,.2,1)" }}
                    />
                    <defs>
                      <linearGradient id="pdfAvatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1a2a57" />
                        <stop offset="100%" stopColor="#23857a" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_MONO, fontSize: 13, fontWeight: 800, color: "#1a2a57" }}>
                    {percent}%
                  </span>
                </div>

                {/* Text + bar */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 7 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                    <span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 700, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {progress.ptName || "Menyiapkan..."}
                    </span>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0,
                      fontFamily: FONT_MONO, fontSize: 11, fontWeight: 800, color: "#fff",
                      background: "linear-gradient(135deg, #1a2a57 0%, #23857a 100%)",
                      borderRadius: 999, padding: "3px 10px 3px 8px",
                      boxShadow: "0 3px 10px rgba(26,42,87,0.28)",
                    }}>
                      <ReceiptLongRoundedIcon style={{ fontSize: 12 }} />
                      {progress.current}<span style={{ opacity: 0.65, fontWeight: 600 }}>/{progress.total}</span>
                    </span>
                  </div>

                  <div style={{ position: "relative", height: 8, borderRadius: 999, background: T.brandLight, overflow: "hidden" }}>
                    <div style={{
                      position: "absolute", inset: "0 auto 0 0", height: "100%", width: `${percent}%`,
                      borderRadius: 999, background: "linear-gradient(135deg, #1a2a57 0%, #23857a 100%)",
                      boxShadow: "0 0 8px rgba(35,133,122,0.45)",
                      transition: "width 0.5s cubic-bezier(.4,0,.2,1)",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        position: "absolute", top: 0, bottom: 0, width: 40,
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.65), transparent)",
                        animation: "pdfShineSweep 1.4s ease-in-out infinite",
                      }} />
                    </div>
                  </div>

                  <span style={{ fontFamily: FONT_SANS, fontSize: 11, color: T.muted }}>
                    {progress.status || "Berjalan..."}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!generating && (
            <div style={{ display: (!loading && !rows.length) || (driveConfig.enabled && !driveReady) || hasProgressState ? "flex" : "none", padding: "0 20px 10px", flexDirection: "column", gap: 8, background: T.white, flexShrink: 0 }}>
              {!loading && !rows.length && <Alert severity="info" sx={{ fontFamily: FONT_SANS, fontSize: 12, py: 0.25, borderRadius: "10px" }}>Belum ada data — siapkan dari halaman Input Data terlebih dahulu</Alert>}
              {driveConfig.enabled && !driveReady && <Alert severity="warning" sx={{ fontFamily: FONT_SANS, fontSize: 12, py: 0.25, borderRadius: "10px" }}>Upload Drive aktif tapi belum lengkap — isi Apps Script URL dan Folder ID di Setting Drive.</Alert>}
              {hasProgressState && (
                <div style={{ paddingBottom: 2 }}>
                  <Btn color="red" onClick={handleResetProgress} loading={resettingProgress} style={{ height: 30, fontSize: 11.5 }}>
                    Reset Status Proses
                  </Btn>
                </div>
              )}
            </div>
          )}

          {/* Pagination bar */}
          <div style={{ display: "none", alignItems: "center", justifyContent: "space-between", padding: "7px 20px", borderBottom: `1px solid ${T.line}`, background: T.surface, flexWrap: "wrap", gap: 8, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.muted }}>
                <span style={{ fontWeight: 600, color: T.ink }}>
                  {filteredRows.length === 0 ? "0" : `${page * rowsPerPage + 1}–${Math.min((page + 1) * rowsPerPage, filteredRows.length)}`}
                </span>
                {" "}dari{" "}
                <span style={{ fontWeight: 600, color: T.ink }}>{filteredRows.length}</span>
                {" "}baris
                {penagihFilter !== "all" && <span style={{ marginLeft: 6, color: T.muted, fontWeight: 600 }}>· {penagihFilter}</span>}
              </span>
              <span style={{ color: T.line }}>|</span>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.subtle }}>Tampilkan</span>
                <RowsPerPageDropdown
                  value={rowsPerPage}
                  onChange={(nextRows) => { setRowsPerPage(nextRows); setPage(0); }}
                />
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
          {loading && <LoadingTableState />}
          <div className="users-table-wrapper" style={{ display: loading ? "none" : undefined, flex: 1, minHeight: 0, margin: "0 16px", overflowX: "hidden", overflowY: "auto" }}>
            <table className="users-table" style={{ fontFamily: FONT_SANS, width: "100%", minWidth: 0, tableLayout: "fixed" }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                <tr>
                  {["No Invoice", "Customer", "Tgl Invoice", "Jatuh Tempo", "Termin", "Tagihan", "Penagih", ""].map((h, i) => (
                    <th key={i} style={{ color: T.brandDark, fontSize: 10.5, fontWeight: 700, padding: h === "" ? "10px 8px" : "10px 14px", textAlign: h === "Tagihan" ? "right" : h === "" ? "center" : "left", whiteSpace: "nowrap", width: h === "" ? 48 : h === "Customer" ? "18%" : h === "Penagih" ? "15%" : undefined, userSelect: "none", background: T.surface, textTransform: "none", letterSpacing: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: "48px 20px", textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                        <AssignmentIndRoundedIcon style={{ fontSize: 32, color: T.subtle }} />
                        <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: T.muted, fontWeight: 600 }}>Tidak ada data untuk penagih ini</span>
                        <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: T.subtle }}>Coba pilih penagih lain atau kembali ke "Semua penagih"</span>
                      </div>
                    </td>
                  </tr>
                ) : pagedRows.map(({ row, index: absoluteIdx }, i) => {
                  const isCell = (f) => editingCell?.row === absoluteIdx && editingCell?.field === f;
                  const cellBtn = (f, displayNode) => {
                    const active = isCell(f);
                    return (
                      <button
                        ref={active ? activeCellRef : null}
                        type="button"
                        onClick={() => handleCellClick(absoluteIdx, f)}
                        style={{
                          display: "flex", alignItems: "center", width: "100%",
                          border: `1px solid ${active ? "rgba(233,196,106,0.9)" : "transparent"}`,
                          borderRadius: 6, padding: "5px 7px",
                          background: active ? "rgba(233,196,106,0.14)" : "transparent",
                          cursor: "text", textAlign: "left", overflow: "hidden",
                          boxShadow: active ? "0 0 0 3px rgba(233,196,106,0.12)" : "none",
                          transition: "border-color 0.12s, background 0.12s, box-shadow 0.12s",
                        }}
                        onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = "rgba(233,196,106,0.55)"; e.currentTarget.style.background = "rgba(233,196,106,0.08)"; } }}
                        onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "transparent"; } }}
                      >
                        {displayNode}
                      </button>
                    );
                  };

                  return (
                    <tr key={absoluteIdx} className="users-table__row users-table__row--interactive" style={{ background: i % 2 !== 0 ? T.surface : T.white }}>
                      <td style={{ padding: "4px 8px", minWidth: 0, overflow: "hidden" }}>
                        {cellBtn("noInvoice", <span style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: T.text, fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.noInvoice || <span style={{ color: T.subtle, fontStyle: "italic", fontFamily: FONT_SANS, fontWeight: 400 }}>—</span>}</span>)}
                      </td>
                      <td style={{ padding: "4px 8px", minWidth: 0, overflow: "hidden" }}>
                        {cellBtn("customer", (
                          <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                            <span className="users-table__avatar" style={{ width: 30, height: 30, fontFamily: FONT_SANS, fontSize: 9.5, letterSpacing: "0.04em", flexShrink: 0 }}>{getInitials(row.customer)}</span>
                            <span style={{ fontWeight: 600, color: T.ink, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.customer || <span style={{ color: T.subtle, fontStyle: "italic", fontWeight: 400 }}>—</span>}</span>
                          </div>
                        ))}
                      </td>
                      <td style={{ padding: "4px 8px", minWidth: 0, overflow: "hidden" }}>
                        {cellBtn("tanggalInvoice", <span style={{ color: T.muted, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.tanggalInvoice || "—"}</span>)}
                      </td>
                      <td style={{ padding: "4px 8px", minWidth: 0, overflow: "hidden" }}>
                        {cellBtn("tempo", <span style={{ color: T.text, fontWeight: 500, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.tempo || "—"}</span>)}
                      </td>
                      <td style={{ padding: "4px 8px", minWidth: 0, overflow: "hidden" }}>
                        {cellBtn("termin", row.termin ? (
                          <span className={`users-table__status users-table__status--inline ${/3\s*bulan/i.test(row.termin) ? "users-table__status--app" : "users-table__status--pending"}`} style={{ margin: "0 auto" }}>{row.termin}</span>
                        ) : (
                          <span style={{ color: T.subtle, fontSize: 12, width: "100%", textAlign: "center" }}>—</span>
                        ))}
                      </td>
                      <td style={{ padding: "4px 8px", minWidth: 0, overflow: "hidden" }}>
                        {cellBtn("tagihan", <span style={{ fontWeight: 400, color: T.text, fontSize: 12, width: "100%", textAlign: "right" }}>{formatCurrency(row.tagihan)}</span>)}
                      </td>
                      <td style={{ padding: "4px 8px", minWidth: 0, overflow: "hidden" }}>
                        {cellBtn("penagih", (
                          <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                            <span className="users-table__avatar" style={{ width: 30, height: 30, fontFamily: FONT_SANS, fontSize: 9.5, letterSpacing: "0.04em", flexShrink: 0 }}>{getInitials(row.penagih)}</span>
                            <span style={{ color: T.ink, fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.penagih || "—"}</span>
                          </div>
                        ))}
                      </td>
                      <td style={{ padding: "4px 8px", textAlign: "center", width: 44 }}>
                        <button onClick={() => requestDeleteRow(absoluteIdx)}
                          style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #fca5a5", background: T.redBg, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: T.red, transition: "all 0.15s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.borderColor = T.red; e.currentTarget.style.transform = "scale(1.05)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = T.redBg; e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.transform = "none"; }}>
                          <DeleteForeverRoundedIcon style={{ fontSize: 16 }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredRows.length > 0 && (
            <div className="users-table-pagination" style={{ padding: "9px 22px 8px", borderTop: `1px solid ${T.line}`, marginTop: 0 }}>
              <div className="users-table-pagination__meta" style={{ gap: 10 }}>
                <p className="users-table-pagination__summary" style={{ fontSize: 11.5, lineHeight: 1.35 }}>
                  {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filteredRows.length)} of{" "}
                  <strong>{filteredRows.length}</strong> rows
                  {penagihFilter !== "all" && <span style={{ marginLeft: 6, color: T.muted, fontWeight: 600 }}>· {penagihFilter}</span>}
                  {searchQuery.trim() && <span style={{ marginLeft: 6, color: T.brand, fontWeight: 600 }}>· search aktif</span>}
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

        </section>
      )}

      {/* ── Google Drive Config Dialog (gaya sama persis dengan popup QR Code WhatsApp) ── */}
      <Dialog
        open={driveConfigOpen}
        onClose={() => setDriveConfigOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ backdrop: { sx: { background: "rgba(10, 18, 40, 0.68)" } } }}
        PaperProps={{
          sx: {
            borderRadius: "24px",
            fontFamily: FONT_SANS,
            overflow: "hidden",
            boxShadow: "0 28px 80px rgba(10, 18, 40, 0.32)",
            border: "1px solid rgba(26, 42, 87, 0.12)",
            background: "#ffffff",
          },
        }}
      >
        {/* Header — dark blue gradient sesuai piagam */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, padding: "20px 20px 16px", background: "linear-gradient(180deg, rgba(24, 43, 88, 1) 0%, rgba(27, 55, 112, 0.96) 100%)", borderBottom: "1px solid rgba(26, 42, 87, 0.10)" }}>
          <div>
            <p style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, color: "rgba(233, 196, 106, 0.92)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 5px" }}>
              Google Drive
            </p>
            <h2 style={{ fontFamily: FONT_SANS, fontSize: 19, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.2 }}>
              Pengaturan Upload
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setDriveConfigOpen(false)}
            style={{ width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.75)", cursor: "pointer", transition: "background 0.2s, border-color 0.2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; e.currentTarget.style.borderColor = "rgba(233,196,106,0.4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }}
          >
            <CloseRoundedIcon sx={{ fontSize: 17 }} />
          </button>
        </div>

        <DialogContent sx={{ pt: "20px", pb: "24px", px: "20px", display: "flex", flexDirection: "column", gap: 1.75, background: "#ffffff" }}>
          <div style={{ padding: "9px 13px", borderRadius: 10, background: "rgba(235, 239, 247, 0.85)", border: "1px solid rgba(26, 42, 87, 0.10)", display: "flex", alignItems: "center", gap: 8 }}>
            <AddToDriveRoundedIcon style={{ fontSize: 15, color: T.brand, flexShrink: 0 }} />
            <p style={{ fontFamily: FONT_SANS, fontSize: 12, color: T.ink, margin: 0, lineHeight: 1.5 }}>
              Setiap PDF yang digenerate diunggah otomatis ke Google Drive yang ditentukan di bawah ini.
            </p>
          </div>
          <TextField size="small" fullWidth label="Apps Script URL" placeholder="https://script.google.com/macros/s/.../exec"
            type={showScriptUrl ? "text" : "password"}
            value={driveConfig.scriptUrl}
            onChange={(e) => setDriveConfig((p) => ({ ...p, scriptUrl: e.target.value }))}
            InputProps={{
              startAdornment: <InputAdornment position="start"><LinkRoundedIcon sx={{ fontSize: 15, color: driveConfig.scriptUrl ? T.brand : T.muted }} /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowScriptUrl((v) => !v)} sx={{ color: T.muted }}>
                    {showScriptUrl ? <VisibilityOffRoundedIcon sx={{ fontSize: 16 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 16 }} />}
                  </IconButton>
                </InputAdornment>
              ),
              sx: { fontFamily: FONT_MONO, fontSize: 10.5, borderRadius: "10px" },
            }}
            sx={{ "& .MuiOutlinedInput-root": { background: "#f3f4f6", "& fieldset": { borderColor: driveConfig.scriptUrl ? T.brandBorder : T.line }, "&:hover fieldset": { borderColor: T.brand }, "&.Mui-focused fieldset": { borderColor: T.brand } }, "& label": { fontFamily: FONT_SANS, fontSize: 12 }, "& label.Mui-focused": { color: T.brand } }} />
          <TextField size="small" fullWidth label="Folder ID / Link Folder" placeholder="https://drive.google.com/drive/folders/... atau ID folder"
            type={showFolderId ? "text" : "password"}
            value={driveConfig.folderId}
            onChange={(e) => setDriveConfig((p) => ({ ...p, folderId: extractDriveFolderId(e.target.value) }))}
            InputProps={{
              startAdornment: <InputAdornment position="start"><FolderOpenRoundedIcon sx={{ fontSize: 15, color: T.muted }} /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowFolderId((v) => !v)} sx={{ color: T.muted }}>
                    {showFolderId ? <VisibilityOffRoundedIcon sx={{ fontSize: 16 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 16 }} />}
                  </IconButton>
                </InputAdornment>
              ),
              sx: { fontFamily: FONT_MONO, fontSize: 10.5, borderRadius: "10px" },
            }}
            sx={{ "& .MuiOutlinedInput-root": { background: "#f3f4f6", "& fieldset": { borderColor: T.line }, "&:hover fieldset": { borderColor: T.brand }, "&.Mui-focused fieldset": { borderColor: T.brand } }, "& label": { fontFamily: FONT_SANS, fontSize: 12 }, "& label.Mui-focused": { color: T.brand } }} />
          <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.muted }}>
            Link folder Google Drive boleh ditempel langsung. Sistem akan ambil folderId otomatis.
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.5, px: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <ToggleSwitch checked={driveConfig.enabled}
                onChange={(next) => setDriveConfig((p) => ({ ...p, enabled: next }))} />
              <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12, color: driveConfig.enabled ? "#15803d" : T.muted, fontWeight: driveConfig.enabled ? 600 : 400 }}>
                {driveConfig.enabled ? "Upload Drive Aktif" : "Upload Drive Nonaktif"}
              </Typography>
            </Box>
            <Btn color="teal" onClick={() => { handleSaveDriveConfig(); setDriveConfigOpen(false); }} loading={driveLoading} startIcon={<AddToDriveRoundedIcon style={{ fontSize: 14 }} />}>
              Simpan
            </Btn>
          </Box>
          {driveConfig.enabled && !driveConfig.scriptUrl && <Alert severity="warning" sx={{ fontFamily: FONT_SANS, fontSize: 11, py: 0.25, borderRadius: "10px" }}>Isi Apps Script URL dulu agar upload berhasil.</Alert>}
          {driveConfig.enabled && driveConfig.scriptUrl && !driveConfig.folderId && <Alert severity="warning" sx={{ fontFamily: FONT_SANS, fontSize: 11, py: 0.25, borderRadius: "10px" }}>Isi link atau ID folder Google Drive dulu.</Alert>}
        </DialogContent>
      </Dialog>

      {editingCell && (
        <CellPopupEditor
          rect={cellRect}
          value={String(rows[editingCell.row]?.[editingCell.field] ?? "")}
          label={CELL_FIELD_LABELS[editingCell.field] || editingCell.field}
          type={editingCell.field === "tagihan" ? "number" : "text"}
          placeholder={editingCell.field === "tanggalInvoice" || editingCell.field === "tempo" ? "dd/mm/yyyy" : undefined}
          onClose={commitCellEdit}
          onChange={handleCellChange}
          onKeyDown={handleCellPopupKey}
        />
      )}

      <DeleteConfirmPopup
        open={deleteConfirm.open}
        label={deleteConfirm.label}
        onConfirm={confirmDeleteRow}
        onCancel={() => setDeleteConfirm({ open: false, idx: -1, label: "" })}
      />

      <Snackbar open={toast.open} autoHideDuration={3200} onClose={() => setToast((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={toast.severity} variant="filled" sx={{ borderRadius: "12px", fontFamily: FONT_SANS, boxShadow: "0 8px 24px rgba(0,0,0,0.14)" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
