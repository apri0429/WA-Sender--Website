import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog, DialogContent, DialogTitle,
  Grid, IconButton,
  LinearProgress, Typography, useMediaQuery,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import CardBox      from "../components/cardbox/CardBox";
import CardBigBox   from "../components/cardbox/CardBigBox";
import CreateButton from "../components/button/CreateButton";
import LogsPanel    from "../components/LogsPanel";
import api    from "../services/api";
import socket from "../services/socket";

import WhatsAppIcon                from "@mui/icons-material/WhatsApp";
import SendRoundedIcon             from "@mui/icons-material/SendRounded";
import DescriptionRoundedIcon      from "@mui/icons-material/DescriptionRounded";
import DescriptionOutlinedIcon     from "@mui/icons-material/DescriptionOutlined";
import AccessTimeRoundedIcon       from "@mui/icons-material/AccessTimeRounded";
import BadgeRoundedIcon            from "@mui/icons-material/BadgeRounded";
import QrCode2RoundedIcon          from "@mui/icons-material/QrCode2Rounded";
import DevicesRoundedIcon          from "@mui/icons-material/DevicesRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import DeleteSweepRoundedIcon      from "@mui/icons-material/DeleteSweepRounded";
import AddRoundedIcon              from "@mui/icons-material/AddRounded";
import CheckCircleRoundedIcon      from "@mui/icons-material/CheckCircleRounded";
import ChecklistRoundedIcon        from "@mui/icons-material/ChecklistRounded";
import TableChartRoundedIcon       from "@mui/icons-material/TableChartRounded";
import SearchRoundedIcon           from "@mui/icons-material/SearchRounded";
import TaskAltRoundedIcon          from "@mui/icons-material/TaskAltRounded";
import CancelRoundedIcon           from "@mui/icons-material/CancelRounded";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";
import OpenInNewRoundedIcon        from "@mui/icons-material/OpenInNewRounded";
import RefreshRoundedIcon          from "@mui/icons-material/RefreshRounded";

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Design tokens Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

const F = {
  sans: "'Manrope', 'Segoe UI', sans-serif",
  mono: "'IBM Plex Mono', monospace",
};

const C = {
  brand:        "#233971",
  brandBg:      "#eaeff7",
  brandBorder:  "#b3c1d8",
  ink:          "#163a6b",
  text:         "#374151",
  muted:        "#6b7280",
  subtle:       "#9ca3af",
  line:         "#e5e7eb",
  surface:      "#ffffff",
  white:        "#ffffff",
  amber:        "#92400e",
  amberBg:      "#fffbeb",
  amberBorder:  "#fde68a",
};

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Shared style objects (keeps JSX clean) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

const ICON_TONES = {
  teal: {
    bg: "#ecfdf5",
    color: "#0f766e",
    ring: "#bbf7d0",
  },
  green: {
    bg: "#f0fdf4",
    color: "#16a34a",
    ring: "#bbf7d0",
  },
  amber: {
    bg: "#fffbeb",
    color: "#d97706",
    ring: "#fde68a",
  },
  blue: {
    bg: "#eff6ff",
    color: "#1d4ed8",
    ring: "#bfdbfe",
  },
  slate: {
    bg: "#f8fafc",
    color: "#475569",
    ring: "#e2e8f0",
  },
};

const S = {
  page:         { fontFamily: F.sans, height: "100%", overflowY: "auto", overflowX: "hidden", boxSizing: "border-box", padding: 16, paddingBottom: 16, display: "flex", flexDirection: "column" },
  col:          { display: "flex", flexDirection: "column", gap: 16, height: "100%" },
  col12:        { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  row:          { display: "flex", alignItems: "center", gap: 8 },
  rowBetween:   { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  stack:        { display: "flex", flexDirection: "column", gap: 8 },

  // cards / panels
  infoBox:      { borderRadius: 8, border: `1px solid ${C.line}`, background: C.surface, padding: "0 12px" },
  warnBox:      { padding: "7px 12px", borderRadius: 8, background: C.white, border: `1px solid ${C.brandBorder}` },
  counterBox:   (active) => ({ padding: "8px 12px", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between", background: active ? C.brandBg : C.surface, border: `1px solid ${active ? C.brandBorder : C.line}` }),
  progressBox:  { padding: "10px 12px", borderRadius: 8, background: C.brandBg, border: `1px solid ${C.brandBorder}` },
  summaryBox:   { padding: "8px 12px", borderRadius: 8, background: C.surface, border: `1px solid ${C.line}` },
  delayRow:     { display: "flex", alignItems: "center", gap: 10, padding: "7px 12px", borderRadius: 8, background: C.surface, border: `1px solid ${C.line}` },
  listScroll:   { flex: 1, minHeight: 0, overflow: "auto", borderRadius: 16, border: "1px solid #d8dee8", background: C.white, boxShadow: "0 1px 4px rgba(22,58,107,0.06)" },
  emptyListScroll:{ background: C.white, borderColor: "#d8dee8", boxShadow: "none" },
  logScroll:    { overflow: "auto", paddingRight: 2 },

  // customer list row
  customerPanelBody: { display: "flex", flexDirection: "column", flex: 1, minHeight: 0, gap: 8 },
  customerTable:     { display: "flex", flexDirection: "column", minWidth: 0 },
  customerHead:      { position: "sticky", top: 0, zIndex: 2, display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(100px, 140px)", alignItems: "center", gap: 10, padding: "10px 14px", background: "#eef1f6", borderBottom: "1px solid #d4ddf0" },
  customerHeadText:  { fontFamily: F.sans, fontSize: 10, fontWeight: 700, color: "var(--primary-blue)", textTransform: "uppercase", letterSpacing: "0.09em" },
  customerRow:       (even, last = false) => ({ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(100px, 140px)", alignItems: "center", gap: 10, padding: "7px 14px", borderBottom: last ? "none" : `1px solid ${C.line}`, background: even ? "#f8fafc" : C.white, transition: "background 0.12s" }),
  customerAvatar:    { width: 30, height: 30, fontFamily: F.sans, fontSize: 9.5, letterSpacing: "0.04em" },
  customerName:      { fontFamily: F.sans, fontSize: 12.5, fontWeight: 600, color: C.ink, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  customerPhone:     { fontFamily: F.mono, fontSize: 11.5, color: "var(--neutral-gray)", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  customerEmpty:     { minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "24px 18px", gap: 10 },
  customerEmptyIcon: { width: 56, height: 56, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 18, background: "linear-gradient(135deg, var(--primary-blue) 0%, var(--accent-teal-dark) 100%)", color: C.white, border: "1px solid rgba(35, 57, 113, 0.22)" },
  customerEmptyTitle:{ fontFamily: F.sans, fontSize: 13, fontWeight: 700, color: C.ink, margin: 0 },
  customerEmptyText: { fontFamily: F.sans, fontSize: 12, color: C.subtle, lineHeight: 1.7, margin: 0, maxWidth: 240 },
  customerFooter:    { paddingTop: 4, marginTop: 0, flexShrink: 0 },
  customerFooterText:{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.sans, fontSize: 12, color: "#8a97ad", margin: 0, lineHeight: 1.5, fontWeight: 500 },
  customerFooterValue:{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: "#8a97ad" },

  // text styles
  label:        (sz = 12.5) => ({ fontFamily: F.sans, fontSize: sz, color: C.muted }),
  title:        (sz = 13) =>   ({ fontFamily: F.sans, fontSize: sz, fontWeight: 600, color: C.ink, margin: 0, lineHeight: 1.3 }),
  sub:          (sz = 11) =>   ({ fontFamily: F.sans, fontSize: sz, color: C.muted, margin: 0, lineHeight: 1.4 }),
  mono:         (sz = 10) =>   ({ fontFamily: F.mono, fontSize: sz, color: C.muted }),
  eyebrow:      { fontFamily: F.sans, fontSize: 10.5, fontWeight: 700, color: C.subtle, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" },
  counterVal:   (active) => ({ fontFamily: F.mono, fontSize: 14, fontWeight: 600, color: active ? C.brand : C.subtle }),

  // QR
  qrWrap:       { borderRadius: 10, border: `1px solid ${C.brandBorder}`, overflow: "hidden", background: C.white, marginBottom: 4 },
  qrHeader:     { display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.brandBg, borderBottom: `1px solid ${C.brandBorder}` },
  qrBody:       { display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 16px", gap: 10 },
  qrFrame:      { padding: 8, borderRadius: 10, background: C.white, border: `1px solid ${C.line}` },

  // compact native select
  sessionSelectWrap: { display: "flex", flexDirection: "column", gap: 4 },
  sessionSelectLabel:{ fontFamily: F.sans, fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: "0.02em" },
  sessionSelectBox:  { position: "relative" },
  sessionSelect:     { width: "100%", height: 36, appearance: "none", WebkitAppearance: "none", borderRadius: 10, border: `1px solid ${C.line}`, background: C.white, color: C.text, fontFamily: F.sans, fontSize: 13, fontWeight: 500, padding: "0 34px 0 11px", outline: "none", boxShadow: "0 3px 8px rgba(22, 58, 107, 0.04)", cursor: "pointer" },
  sessionSelectIcon: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.subtle, pointerEvents: "none", fontSize: 20 },

  // MUI overrides
  delaySx: {
    width: 108,
    "& .MuiOutlinedInput-root": {
      borderRadius: "7px", fontFamily: F.mono, fontSize: 12,
      "& .MuiOutlinedInput-input": { padding: "6px 10px" },
      "& fieldset": { borderColor: C.line },
      "&.Mui-focused fieldset": { borderColor: C.brand },
    },
  },

  // primary action button
  primaryBtn: (full = false, disabled = false) => ({
    ...(full ? { width: "100%" } : {}),
    justifyContent: "center", gap: 6, fontSize: 13,
    padding: "0 14px", minHeight: 36,
    opacity: disabled ? 0.5 : 1,
    cursor:  disabled ? "not-allowed" : "pointer",
  }),
};

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function normalizeProgress(p) {
  const current = Number(p?.current) || 0;
  const total   = Number(p?.total)   || 0;
  if (total <= 0) return { current: 0, total: 0 };
  return { current: Math.min(current, total), total };
}

function normalizeSessions(sessions) {
  if (!Array.isArray(sessions)) return [];
  return sessions.map((s) => ({
    id:                  s?.id || "",
    label:               s?.label || s?.id || "WhatsApp Account",
    isActive:            !!s?.isActive,
    runtimeReady:        !!s?.runtimeReady,
    runtimeInitializing: !!s?.runtimeInitializing,
    runtimeHasQr:        !!s?.runtimeHasQr,
    lastKnownNumber:     s?.lastKnownNumber  || "",
    lastKnownName:       s?.lastKnownName    || "",
    lastKnownPlatform:   s?.lastKnownPlatform || "",
  }));
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Sub-components Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function statIcon(icon, toneName = "slate") {
  const tone = ICON_TONES[toneName] || ICON_TONES.slate;
  return (
    <span
      className={`dashboard-stat-icon dashboard-stat-icon--${toneName}`}
      style={{
        "--icon-bg": tone.bg,
        "--icon-color": tone.color,
        "--icon-ring": tone.ring,
      }}
    >
      {icon}
    </span>
  );
}

function panelTitle(icon, label, toneName = "slate") {
  const tone = ICON_TONES[toneName] || ICON_TONES.slate;
  return (
    <span className="dashboard-panel-title">
      <span
        className={`dashboard-panel-title__icon dashboard-panel-title__icon--${toneName}`}
        style={{
          "--icon-bg": tone.bg,
          "--icon-color": tone.color,
          "--icon-ring": tone.ring,
        }}
      >
        {icon}
      </span>
      <span>{label}</span>
    </span>
  );
}

function SessionDropdown({ sessions, value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = sessions.find((s) => s.id === value) || null;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        onClick={() => { if (!disabled) setOpen((v) => !v); }}
        style={{
          width: "100%", height: 44, display: "flex", alignItems: "center", justifyContent: "space-between",
          borderRadius: 999, border: `1.5px solid ${open ? C.brand : "#d4ddf0"}`,
          background: "linear-gradient(180deg, #f8fafc 0%, #eef1f6 100%)",
          padding: "0 14px 0 18px", cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.65 : 1, outline: "none",
          boxShadow: open ? `0 0 0 3px ${C.brandBg}` : "0 2px 8px rgba(22,58,107,0.07)",
          transition: "border-color 0.18s, box-shadow 0.18s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: selected?.runtimeReady ? "#16a34a" : selected ? "#f59e0b" : C.subtle }} />
          <span style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 600, color: selected ? C.ink : C.subtle, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {sessions.length === 0 ? "No saved account yet" : selected?.label || "Select account"}
          </span>
        </div>
        <KeyboardArrowDownRoundedIcon style={{ fontSize: 20, color: C.brand, flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>

      {open && sessions.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 999,
          background: C.white, border: `1.5px solid ${C.brandBorder}`, borderRadius: 14,
          boxShadow: "0 8px 32px rgba(22,58,107,0.13), 0 2px 8px rgba(22,58,107,0.07)",
          overflow: "hidden",
        }}>
          <div style={{ padding: "6px 10px 4px", borderBottom: `1px solid ${C.line}` }}>
            <span style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 700, color: C.subtle, textTransform: "uppercase", letterSpacing: "0.07em" }}>WA Accounts</span>
          </div>
          {sessions.map((s) => {
            const isActive = s.id === value;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => { onChange(s.id); setOpen(false); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 14px",
                  background: isActive ? C.brandBg : "transparent", border: "none", cursor: "pointer",
                  borderBottom: `1px solid ${C.line}`, transition: "background 0.12s", textAlign: "left",
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "#f4f6fa"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: s.runtimeReady ? "#16a34a" : "#f59e0b" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: F.sans, fontSize: 12.5, fontWeight: isActive ? 700 : 500, color: isActive ? C.brand : C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.label || s.id}
                  </div>
                  {s.lastKnownNumber && (
                    <div style={{ fontFamily: F.mono, fontSize: 10.5, color: C.muted, marginTop: 1 }}>{s.lastKnownNumber}</div>
                  )}
                </div>
                {isActive && (
                  <CheckCircleRoundedIcon style={{ fontSize: 15, color: C.brand, flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QRDialog({ open, waQr, waQrAt, formatSyncTime, onClose }) {
  return (
    <Dialog
      open={!!open && !!waQr}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ backdrop: { sx: { background: "rgba(10, 18, 40, 0.68)" } } }}
      PaperProps={{
        sx: {
          borderRadius: "24px",
          fontFamily: F.sans,
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
          <p style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 600, color: "rgba(233, 196, 106, 0.92)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 5px" }}>
            WhatsApp
          </p>
          <h2 style={{ fontFamily: F.sans, fontSize: 19, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.2 }}>
            Scan QR Code
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{ width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.75)", cursor: "pointer", transition: "background 0.2s, border-color 0.2s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; e.currentTarget.style.borderColor = "rgba(233,196,106,0.4)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }}
        >
          <CloseRoundedIcon sx={{ fontSize: 17 }} />
        </button>
      </div>

      {/* Body */}
      <DialogContent sx={{ pt: "20px", pb: "24px", px: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", background: "#ffffff" }}>

        {/* Step hint */}
        <div style={{ width: "100%", padding: "9px 13px", borderRadius: 10, background: "rgba(235, 239, 247, 0.85)", border: "1px solid rgba(26, 42, 87, 0.10)", display: "flex", alignItems: "center", gap: 8 }}>
          <WhatsAppIcon style={{ fontSize: 15, color: "#16a34a", flexShrink: 0 }} />
          <p style={{ fontFamily: F.sans, fontSize: 12, color: C.ink, margin: 0, lineHeight: 1.5 }}>
            WhatsApp → <strong>Perangkat Tertaut</strong> → Tautkan Perangkat
          </p>
        </div>

        {/* QR frame */}
        <div style={{ padding: 12, borderRadius: 16, background: "#fff", border: "1.5px solid rgba(26, 42, 87, 0.12)", boxShadow: "0 6px 24px rgba(10, 18, 40, 0.10)" }}>
          {waQr ? (
            <QRCodeSVG value={waQr} size={210} bgColor="#ffffff" fgColor="#0c111b" level="M" />
          ) : (
            <div style={{ width: 210, height: 210, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontFamily: F.sans, fontSize: 12, color: C.muted, textAlign: "center" }}>Memuat QR...</p>
            </div>
          )}
        </div>

        {/* Timestamp */}
        {waQrAt && (
          <p style={{ fontFamily: F.mono, fontSize: 10.5, color: C.subtle, margin: 0 }}>
            Diperbarui: {formatSyncTime(waQrAt)}
          </p>
        )}

        {/* Info note */}
        <p style={{ fontFamily: F.sans, fontSize: 12, color: C.muted, textAlign: "center", maxWidth: 240, lineHeight: 1.7, margin: 0 }}>
          QR berlaku beberapa menit. Klik <strong style={{ color: C.brand }}>Hubungkan</strong> lagi jika sudah expired.
        </p>
      </DialogContent>
    </Dialog>
  );
}

function DataRow({ label, value, mono = false, last = false, even = false }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)", alignItems: "center", padding: "8px 14px", borderBottom: last ? "none" : `1px solid ${C.line}`, gap: 6, background: even ? "#f8fafc" : "#ffffff" }}>
      <span style={{ fontFamily: F.sans, fontSize: 11.5, color: C.subtle, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      <span style={{ fontFamily: mono ? F.mono : F.sans, fontSize: mono ? 11.5 : 12.5, fontWeight: 600, color: "#1c2433", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {value || "-"}
      </span>
    </div>
  );
}

function AnimatedCheck() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes _check-circle { from { stroke-dashoffset: 60; } to { stroke-dashoffset: 0; } }
        @keyframes _check-mark { from { stroke-dashoffset: 18; } to { stroke-dashoffset: 0; } }
      `}</style>
      <circle
        cx="12" cy="12" r="9"
        stroke="#16a34a" strokeWidth="2.1" fill="none"
        strokeLinecap="round"
        strokeDasharray="60" strokeDashoffset="60"
        style={{ animation: "_check-circle 0.42s cubic-bezier(.65,0,.35,1) 0.08s forwards" }}
        transform="rotate(-90 12 12)"
      />
      <path
        d="M7.8 12.4L10.6 15.1L16.5 8.9"
        stroke="#16a34a" strokeWidth="2.3" fill="none"
        strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="18" strokeDashoffset="18"
        style={{ animation: "_check-mark 0.28s cubic-bezier(.4,0,.2,1) 0.46s forwards" }}
      />
    </svg>
  );
}

function AnimatedSpinner() {
  return (
    <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes _spin-arc  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes _gold-dot  { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
      `}</style>
      <circle cx="27" cy="27" r="24" stroke="rgba(233,196,106,0.15)" strokeWidth="2.5" fill="none" />
      <circle
        cx="27" cy="27" r="24"
        stroke="rgba(233,196,106,0.92)" strokeWidth="2.5" fill="none"
        strokeLinecap="round" strokeDasharray="110 56"
        style={{ transformOrigin: "27px 27px", animation: "_spin-arc 0.9s linear infinite" }}
      />
      <circle cx="27" cy="27" r="5" fill="rgba(233,196,106,0.2)" style={{ animation: "_gold-dot 1.2s ease infinite" }} />
      <circle cx="27" cy="27" r="2.8" fill="rgba(233,196,106,0.9)" />
    </svg>
  );
}

function WaConnectedPopup({ open, name, number, onClose }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!open) { setFading(false); return; }
    const t1 = window.setTimeout(() => setFading(true),  3600);
    const t2 = window.setTimeout(() => { onClose(); setFading(false); }, 4050);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [open]);

  if (!open) return null;
  return (
    <>
      <style>{`
        @keyframes _wap-in  { 0% { opacity:0; transform:translateY(10px) scale(0.96); } 100% { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes _wap-out { from { opacity:1; transform:translateY(0) scale(1); } to { opacity:0; transform:translateY(8px) scale(0.96); } }
        @keyframes _success-card-pop { 0% { opacity:0; transform:scale(0.9); } 58% { opacity:1; transform:scale(1.025); } 100% { opacity:1; transform:scale(1); } }
        @keyframes _success-card-glow { 0% { box-shadow:0 0 0 0 rgba(34,197,94,0.18); } 100% { box-shadow:0 0 0 18px rgba(34,197,94,0); } }
        @keyframes _success-pop { 0% { opacity:0; transform:scale(0.72); } 60% { opacity:1; transform:scale(1.08); } 100% { opacity:1; transform:scale(1); } }
        @keyframes _success-ring { 0% { opacity:0.45; transform:scale(0.72); } 100% { opacity:0; transform:scale(1.55); } }
      `}</style>
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1400, width: 320, maxWidth: "calc(100vw - 32px)" }}>
        <div style={{
          borderRadius: 16, overflow: "hidden",
          background: "#fff",
          border: "1px solid rgba(22, 163, 74, 0.22)",
          boxShadow: "0 20px 48px rgba(15, 23, 42, 0.18), 0 2px 8px rgba(15, 23, 42, 0.08)",
          transformOrigin: "center",
          animation: fading
            ? "_wap-out 0.32s cubic-bezier(.4,0,1,1) forwards"
            : "_success-card-pop 0.5s cubic-bezier(.2,.85,.2,1) both, _success-card-glow 0.8s ease-out 0.12s both",
        }}>
          <div style={{ padding: "14px 14px 12px", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ position: "relative", width: 34, height: 34, borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, animation: "_success-pop 0.42s cubic-bezier(.2,.8,.2,1) 0.08s both" }}>
              <span style={{ position: "absolute", inset: -2, borderRadius: 12, border: "1px solid rgba(34,197,94,0.42)", animation: "_success-ring 0.7s ease-out 0.18s both" }} />
              <AnimatedCheck />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontFamily: F.sans, fontSize: 14.5, fontWeight: 700, color: C.ink, margin: 0, lineHeight: 1.25 }}>WhatsApp terhubung</h3>
              <p style={{ fontFamily: F.sans, fontSize: 12, color: C.muted, margin: "3px 0 0", lineHeight: 1.45 }}>Session siap digunakan untuk mengirim pesan.</p>
            </div>
          </div>
          {(name || number) && (
            <div style={{ margin: "0 14px 12px", padding: "9px 10px", borderRadius: 10, background: "#f8fafc", border: `1px solid ${C.line}`, display: "flex", flexDirection: "column", gap: 5 }}>
              {name && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: F.sans, fontSize: 10.5, color: C.subtle, flexShrink: 0, minWidth: 44 }}>Nama</span>
                  <span style={{ fontFamily: F.sans, fontSize: 12.5, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                </div>
              )}
              {number && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: F.sans, fontSize: 10.5, color: C.subtle, flexShrink: 0, minWidth: 44 }}>Nomor</span>
                  <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: C.ink }}>{number}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function WaPreparingPopup({ open }) {
  if (!open) return null;
  return (
    <>
      <style>{`
        @keyframes _prep-in  { 0% { opacity:0; transform:scale(0.86); } 65% { transform:scale(1.03); } 100% { opacity:1; transform:scale(1); } }
        @keyframes _prep-out { from { opacity:1; transform:scale(1); } to { opacity:0; transform:scale(0.86); } }
        @keyframes _scan-bar { 0% { left:-40%; } 100% { left:140%; } }
      `}</style>
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1400, width: 290 }}>
        <div style={{
          borderRadius: 18, overflow: "hidden",
          border: "1px solid rgba(26,42,87,0.14)",
          boxShadow: "0 20px 56px rgba(10,18,40,0.30), 0 4px 14px rgba(10,18,40,0.12)",
          animation: "_prep-in 0.46s cubic-bezier(.22,.68,0,1.1) both",
        }}>
          <div style={{ padding: "16px 14px 18px", background: "linear-gradient(180deg, rgba(24,43,88,1) 0%, rgba(27,55,112,0.96) 100%)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flexShrink: 0 }}><AnimatedSpinner /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 600, color: "rgba(233,196,106,0.92)", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 3px" }}>WhatsApp</p>
              <h3 style={{ fontFamily: F.sans, fontSize: 15, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.2 }}>Menyiapkan Koneksi...</h3>
              <p style={{ fontFamily: F.sans, fontSize: 11.5, color: "rgba(255,255,255,0.52)", margin: "4px 0 0", lineHeight: 1.4 }}>Sedang memuat QR Code</p>
            </div>
          </div>
          <div style={{ height: 3, background: "rgba(26,42,87,0.08)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, height: "100%", width: "38%", background: "linear-gradient(90deg, transparent, rgba(233,196,106,0.85), transparent)", animation: "_scan-bar 1.4s ease-in-out infinite" }} />
          </div>
        </div>
      </div>
    </>
  );
}

function AnimatedX() {
  return (
    <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes _err-circ { from { stroke-dashoffset: 166; } to { stroke-dashoffset: 0; } }
        @keyframes _err-x1   { from { stroke-dashoffset: 32; } to { stroke-dashoffset: 0; } }
        @keyframes _err-x2   { from { stroke-dashoffset: 32; } to { stroke-dashoffset: 0; } }
      `}</style>
      <circle cx="27" cy="27" r="24" stroke="rgba(239,68,68,0.15)" strokeWidth="2.5" fill="none" />
      <circle
        cx="27" cy="27" r="24"
        stroke="#ef4444" strokeWidth="2.5" fill="none"
        strokeLinecap="round"
        strokeDasharray="166" strokeDashoffset="166"
        style={{ animation: "_err-circ 0.55s cubic-bezier(.6,0,.4,1) 0.1s forwards", animationFillMode: "both" }}
        transform="rotate(-90 27 27)"
      />
      <line x1="18" y1="18" x2="36" y2="36" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"
        strokeDasharray="32" strokeDashoffset="32"
        style={{ animation: "_err-x1 0.22s cubic-bezier(.4,0,.2,1) 0.52s forwards", animationFillMode: "both" }}
      />
      <line x1="36" y1="18" x2="18" y2="36" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"
        strokeDasharray="32" strokeDashoffset="32"
        style={{ animation: "_err-x2 0.22s cubic-bezier(.4,0,.2,1) 0.66s forwards", animationFillMode: "both" }}
      />
    </svg>
  );
}

function WaErrorPopup({ open, message, onClose }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!open) { setFading(false); return; }
    const t1 = window.setTimeout(() => setFading(true), 4000);
    const t2 = window.setTimeout(() => { onClose(); setFading(false); }, 4450);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [open]);

  if (!open) return null;
  return (
    <>
      <style>{`
        @keyframes _err-in  { 0% { opacity:0; transform:scale(0.86); } 65% { transform:scale(1.03); } 100% { opacity:1; transform:scale(1); } }
        @keyframes _err-out { from { opacity:1; transform:scale(1); } to { opacity:0; transform:scale(0.86); } }
      `}</style>
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1400, width: 290 }}>
        <div style={{
          borderRadius: 18, overflow: "hidden",
          border: "1px solid rgba(239,68,68,0.18)",
          boxShadow: "0 20px 56px rgba(10,18,40,0.30), 0 4px 14px rgba(10,18,40,0.12)",
          animation: fading ? "_err-out 0.38s cubic-bezier(.4,0,1,1) forwards" : "_err-in 0.46s cubic-bezier(.22,.68,0,1.1) both",
        }}>
          <div style={{ padding: "16px 14px 14px", background: "linear-gradient(180deg, rgba(24,43,88,1) 0%, rgba(27,55,112,0.96) 100%)", borderBottom: "1px solid rgba(26,42,87,0.10)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flexShrink: 0 }}><AnimatedX /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 600, color: "rgba(233,196,106,0.92)", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 3px" }}>WhatsApp</p>
              <h3 style={{ fontFamily: F.sans, fontSize: 15, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.2 }}>Koneksi Gagal</h3>
            </div>
          </div>
          {message && (
            <div style={{ padding: "10px 14px 12px", background: "#fff" }}>
              <p style={{ fontFamily: F.sans, fontSize: 12.5, color: "#b42318", margin: 0, lineHeight: 1.5 }}>{message}</p>
            </div>
          )}
          <div style={{ height: 3, background: "rgba(26,42,87,0.08)" }}>
            <div
              style={{ height: "100%", background: "linear-gradient(90deg, #ef4444, #dc2626)", width: fading ? "100%" : "0%", transition: fading ? "none" : "width 4s linear" }}
              ref={(el) => { if (el && !fading) window.requestAnimationFrame(() => { el.style.width = "100%"; }); }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function SendResultCard({ summary, label = "Hasil Terakhir" }) {
  if (!summary) return null;
  const total   = summary.total   || 0;
  const success = summary.success || 0;
  const failed  = summary.failed  || 0;
  return (
    <div style={{ borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid rgba(26, 42, 87, 0.10)", boxShadow: "0 2px 10px rgba(15, 23, 42, 0.06)" }}>
      {/* Header */}
      <div style={{ padding: "11px 12px", borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div>
          <p style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: C.subtle, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 2px" }}>
            {label}
          </p>
          <h3 style={{ fontFamily: F.sans, fontSize: 13.5, fontWeight: 700, color: C.ink, margin: 0, lineHeight: 1.2 }}>
            Pengiriman Selesai
          </h3>
        </div>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <TaskAltRoundedIcon style={{ fontSize: 18, color: "#16a34a" }} />
        </div>
      </div>
      {/* Body — stat grid */}
      <div style={{ padding: "10px 12px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
        {/* Total */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 6px", borderRadius: 10, background: "#f8fafc", border: `1px solid ${C.line}` }}>
          <FormatListNumberedRoundedIcon style={{ fontSize: 15, color: C.brand }} />
          <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: C.ink, lineHeight: 1 }}>{total}</span>
          <span style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 600, color: C.subtle, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total</span>
        </div>
        {/* Berhasil */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 6px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <CheckCircleRoundedIcon style={{ fontSize: 15, color: "#16a34a" }} />
          <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: "#15803d", lineHeight: 1 }}>{success}</span>
          <span style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 600, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.05em" }}>Berhasil</span>
        </div>
        {/* Gagal */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 6px", borderRadius: 10, background: "#fff7f7", border: "1px solid #fecaca" }}>
          <CancelRoundedIcon style={{ fontSize: 15, color: "#dc2626" }} />
          <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: "#b91c1c", lineHeight: 1 }}>{failed}</span>
          <span style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 600, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.05em" }}>Gagal</span>
        </div>
      </div>
    </div>
  );
}


// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Main component Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

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
              <DeleteSweepRoundedIcon style={{ fontSize: 20, color: "#f87171" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 600, color: "rgba(233,196,106,0.92)", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 3px" }}>WhatsApp</p>
              <h3 style={{ fontFamily: F.sans, fontSize: 15, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.2 }}>Hapus Session</h3>
            </div>
          </div>
          {/* Body */}
          <div style={{ padding: "14px 16px", background: "#fff" }}>
            <p style={{ fontFamily: F.sans, fontSize: 12.5, color: C.text, margin: "0 0 4px", lineHeight: 1.6 }}>
              Hapus akun WhatsApp <strong style={{ color: C.ink }}>{label}</strong>?
            </p>
            <p style={{ fontFamily: F.sans, fontSize: 11.5, color: C.muted, margin: 0, lineHeight: 1.5 }}>
              Session akan dihapus permanen dan tidak bisa dikembalikan.
            </p>
          </div>
          {/* Actions */}
          <div style={{ display: "flex", gap: 8, padding: "0 16px 16px", background: "#fff" }}>
            <button type="button" onClick={handleCancel}
              style={{ flex: 1, height: 36, borderRadius: 10, border: `1px solid ${C.line}`, background: "#f8fafc", color: C.text, fontFamily: F.sans, fontSize: 12.5, fontWeight: 600, cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#eef1f6"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#f8fafc"; }}>
              Batal
            </button>
            <button type="button" onClick={handleConfirm}
              style={{ flex: 1, height: 36, borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)", background: "linear-gradient(180deg, #ef4444 0%, #dc2626 100%)", color: "#fff", fontFamily: F.sans, fontSize: 12.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "opacity 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
              <DeleteSweepRoundedIcon style={{ fontSize: 14 }} />
              Hapus
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:899px)");
  const isNarrow = useMediaQuery("(max-width:599px)");
  const isTablet = useMediaQuery("(min-width:900px) and (max-width:1199px)");
  const isDesktop = useMediaQuery("(min-width:1200px)");
  const [customers,            setCustomers]            = useState([]);
  const [logs,                 setLogs]                 = useState([]);
  const [delay,                setDelay]                = useState(4000);
  const [progress,             setProgress]             = useState({ current: 0, total: 0 });
  const [fileInfo,             setFileInfo]             = useState(null);
  const [template,             setTemplate]             = useState("");
  const [gsheetUrl,            setGsheetUrl]            = useState("");
  const [whatsappReady,        setWhatsappReady]        = useState(false);
  const [checkingWhatsapp,     setCheckingWhatsapp]     = useState(false);
  const [sending,              setSending]              = useState(false);
  const [sheetNames,           setSheetNames]           = useState([]);
  const [selectedSheet,        setSelectedSheet]        = useState("");
  const [autoSync,             setAutoSync]             = useState(false);
  const [lastSyncAt,           setLastSyncAt]           = useState(null);
  const [sourceMode,           setSourceMode]           = useState("manual");
  const [loadingSheets,        setLoadingSheets]        = useState(false);
  const [syncingSheet,         setSyncingSheet]         = useState(false);
  const [savingGsheet,         setSavingGsheet]         = useState(false);
  const [loadingAutoCustomers, setLoadingAutoCustomers] = useState(false);
  const [lastSendSummary,      setLastSendSummary]      = useState(null);
  const [lastSendResults,      setLastSendResults]      = useState([]);
  const [pdfLogRows,           setPdfLogRows]           = useState([]);
  const [waQr,                 setWaQr]                 = useState("");
  const [waQrAt,               setWaQrAt]               = useState(null);
  const [waInitializing,       setWaInitializing]       = useState(false);
  const [waSessions,           setWaSessions]           = useState([]);
  const [activeWaSessionId,    setActiveWaSessionId]    = useState("");
  const [pendingWaSessionId,   setPendingWaSessionId]   = useState("");
  const [waAccount,            setWaAccount]            = useState({ name: "", number: "", wid: "", platform: "" });
  const [qrOpen,               setQrOpen]               = useState(false);
  const [waPopup,              setWaPopup]              = useState(false);
  const [waError,              setWaError]              = useState({ open: false, message: "" });
  const [deleteConfirm,        setDeleteConfirm]        = useState({ open: false, label: "" });
  const [headerSlot,           setHeaderSlot]           = useState(null);
  const [customerSearch,       setCustomerSearch]       = useState("");
  const [openingWaBrowser,     setOpeningWaBrowser]     = useState(false);
  const lastWhatsappLogRef = useRef("");
  const logSeqRef          = useRef(0);

  useEffect(() => {
    setTimeout(() => setHeaderSlot(document.getElementById("header-wa-slot")), 100);
  }, []);

  // Utilities
  const addLog = (type, message) => {
    const seq = logSeqRef.current++;
    setLogs((prev) => [{ type, message, time: new Date().toISOString(), _seq: seq }, ...prev]);
  };

  const addWhatsappLogOnce = (key, type, message) => {
    if (lastWhatsappLogRef.current === key) return;
    lastWhatsappLogRef.current = key;
    addLog(type, message);
  };

  const formatSyncTime = (v) => {
    if (!v) return "-";
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? v : d.toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  // WA state helpers
  const applyWhatsappState = (data = {}, options = {}) => {
    const sessions            = normalizeSessions(data?.sessions);
    const nextActiveId        = data?.activeSessionId || sessions.find((s) => s.isActive)?.id || "";
    const nextActiveExists    = sessions.some((s) => s.id === nextActiveId);

    setWhatsappReady(!!data.whatsappReady);
    setWaQr(data?.qr || "");
    setWaQrAt(data?.meta?.lastQrAt || null);
    setWaInitializing(!!data?.meta?.initializing && !data?.whatsappReady);
    setWaSessions(sessions);
    if (!options.preserveActiveSelection || nextActiveExists) setActiveWaSessionId(nextActiveId);
    if (nextActiveExists && pendingWaSessionId === nextActiveId) setPendingWaSessionId("");
    setWaAccount({ name: data?.account?.name || "", number: data?.account?.number || "", wid: data?.account?.wid || "", platform: data?.account?.platform || "" });
  };

  const syncWhatsappSession = async ({ showToastMessage = false, sessionId = activeWaSessionId, createNew = false } = {}) => {
    try {
      setWaInitializing(true);
      const { data } = await api.post("/init-whatsapp", { sessionId: createNew ? "" : sessionId, createNew });

      applyWhatsappState(data, { preserveActiveSelection: createNew });
      if (createNew && data?.activeSessionId) setPendingWaSessionId(data.activeSessionId);
      if (data.whatsappReady) { return true; }

      if (!data.qr) {
        const targetId = data?.activeSessionId || sessionId || "";
        for (let i = 0; i < 8; i += 1) {
          await new Promise((r) => window.setTimeout(r, 1000));
          const { data: sd } = await api.post("/check-whatsapp", { sessionId: targetId });
          applyWhatsappState(sd, { preserveActiveSelection: createNew });
          if (sd.whatsappReady) { setPendingWaSessionId(""); return true; }
          if (sd.qr) break;
        }
      }
      return false;
    } catch (err) {
      const m = err?.response?.data?.message || "Failed to connect WhatsApp";
      setWhatsappReady(false); setWaInitializing(false); setWaQr("");
      if (createNew) setPendingWaSessionId("");
      setWaError({ open: true, message: m });
      addLog("error", m);
      return false;
    }
  };

  const checkWhatsappStatus = async (showMsg = false, sessionId = activeWaSessionId) => {
    try {
      setCheckingWhatsapp(true);
      const { data } = await api.post("/check-whatsapp", { sessionId });
      applyWhatsappState(data);
      setSending(!!data?.isSending);
      if (data?.whatsappReady)  { addWhatsappLogOnce("wa-ready", "success", "WhatsApp is ready to use"); }
      else if (data?.needScan)  { addWhatsappLogOnce("wa-need-scan", "info", "Please scan the WhatsApp QR"); }
      return !!data?.whatsappReady;
    } catch (err) {
      const m = err?.response?.data?.message || "Failed to check WhatsApp status";
      setWhatsappReady(false);
      addWhatsappLogOnce(`wa-error-${m}`, "error", m);
      if (showMsg) setWaError({ open: true, message: m });
      return false;
    } finally { setCheckingWhatsapp(false); }
  };

  // GSheet
  const fetchSheetNames = async (showMsg = false) => {
    try {
      setLoadingSheets(true);
      const { data } = await api.get("/gsheet/sheets");
      const sheets   = Array.isArray(data.sheets) ? data.sheets : [];
      setSheetNames(sheets);
      setSelectedSheet(data.selectedSheet || sheets[0] || "");
      setAutoSync(!!data.autoSync);
      if (showMsg) addLog("success", sheets.length ? `${sheets.length} sheets loaded` : "No sheets found");
      return sheets;
    } catch (err) {
      const m = err?.response?.data?.message || "Failed to fetch sheet list";
      addLog("error", m);
      return [];
    } finally { setLoadingSheets(false); }
  };

  const loadCustomersFromGSheet = async (sheetName, showMsg = true, silentLog = false) => {
    try {
      setSyncingSheet(true);
      const { data } = await api.post("/gsheet/sync", { selectedSheet: sheetName || selectedSheet || "" });
      const synced   = Array.isArray(data.data) ? data.data : [];
      setCustomers(synced);
      setSelectedSheet(data.selectedSheet || sheetName || "");
      setSheetNames(Array.isArray(data.sheets) ? data.sheets : []);
      setAutoSync(!!data.autoSync);
      setLastSyncAt(data.lastSyncAt || null);
      setSourceMode("gsheet");
      setFileInfo({ fileName: `Google Sheet - ${data.selectedSheet || "-"}`, message: data.message || `${synced.length} customers loaded` });
      if (!silentLog) addLog("success", data.message || `Synced ${synced.length} customers`);
      return synced;
    } catch (err) {
      const m = err?.response?.data?.message || "Failed to sync Google Sheet";
      addLog("error", m);
      return [];
    } finally { setSyncingSheet(false); }
  };

  const handleSaveGsheetConfig = async ({ url, selected = selectedSheet, auto = autoSync, showSuccess = true } = {}) => {
    try {
      setSavingGsheet(true);
      // url is omitted here on purpose unless the caller explicitly passes
      // a freshly-typed one — gsheetUrl in state is only ever the server's
      // masked display string, never the real link, so re-sending it would
      // overwrite the saved URL with garbage.
      const payload = { selectedSheet: selected || "", autoSync: !!auto };
      if (typeof url === "string" && url.trim()) payload.url = url.trim();
      const { data } = await api.post("/gsheet", payload);
      if (payload.url) setGsheetUrl(data?.config?.url || payload.url);
      setSelectedSheet(selected || ""); setAutoSync(!!auto);
      addLog("success", "Google Sheet configuration saved");
      return true;
    } catch (err) {
      const m = err?.response?.data?.message || "Failed to save configuration";
      addLog("error", m);
      return false;
    } finally { setSavingGsheet(false); }
  };

  const handleSelectSheet = async (val) => {
    try {
      setSelectedSheet(val);
      const { data } = await api.post("/gsheet/select-sheet", { selectedSheet: val });
      setSheetNames(Array.isArray(data.sheets) ? data.sheets : []);
      addLog("success", `Sheet: ${val}`);
    } catch (err) {
      const m = err?.response?.data?.message || "Failed to select sheet";
      addLog("error", m);
    }
  };

  const handleSyncGSheet = async () => {
    if (!gsheetUrl)                              { addLog("warning", "Google Sheet URL has not been filled in yet"); return; }
    if (!selectedSheet && sheetNames.length > 0) { addLog("warning", "Please select a sheet first"); return; }
    await loadCustomersFromGSheet(selectedSheet, true, false);
  };

  const handleRefreshCustomers = async () => {
    if (syncingSheet || loadingAutoCustomers) return;
    if (sourceMode === "pdf") {
      await loadCustomersFromPdf(true);
      return;
    }
    await handleSyncGSheet();
  };

  const handleToggleAutoSync = async (checked) => {
    const ok = await handleSaveGsheetConfig({ selected: selectedSheet, auto: checked, showSuccess: true });
    if (ok) setAutoSync(checked);
  };

  // PDF
  const loadCustomersFromPdf = async (showMsg = false) => {
    try {
      const { data } = await api.get("/pdf/log");
      const rows     = Array.isArray(data?.rows) ? data.rows : [];
      const valid    = rows.filter((r) => r.nomor && r.nomor !== "TIDAK DITEMUKAN").map((r) => ({ nama: r.nama, nomor: r.nomor }));
      setPdfLogRows(rows);
      setCustomers(valid);
      setSourceMode("pdf");
      setFileInfo({ fileName: `PDF Results - ${valid.length} customers`, message: `${valid.length} of ${rows.length} are ready to send` });
      addLog("success", `${valid.length} customers loaded from PDF results`);
      return valid;
    } catch {
      return [];
    }
  };

  // Upload Excel
  const handleUpload = async (file) => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/upload-excel", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setCustomers(data?.data || []);
      setSourceMode("manual");
      setFileInfo({ fileName: data?.fileName, message: data?.message });
      addLog("success", data?.message || "Upload successful");
    } catch (err) {
      const m = err?.response?.data?.message || "Upload failed";
      addLog("error", m);
    }
  };

  // WA handlers
  const handleInitWhatsapp = async () => {
    addLog("info", "Connecting WhatsApp...");
    const ready = await syncWhatsappSession({ showToastMessage: true, sessionId: activeWaSessionId, createNew: false });
    addLog("info", ready ? "Session is active" : "Waiting for QR scan");
  };

  const handleOpenWaBrowser = async () => {
    if (!activeWaSessionId) { addLog("error", "Pilih akun WhatsApp dulu"); return; }
    setOpeningWaBrowser(true);
    try {
      const res = await api.post("/open-whatsapp-browser", { browser: "auto", sessionId: activeWaSessionId });
      addLog("success", res?.data?.message || "Browser WhatsApp dibuka di server");
    } catch (err) {
      addLog("error", err?.response?.data?.message || "Gagal membuka browser WhatsApp");
    } finally {
      setOpeningWaBrowser(false);
    }
  };

  const handleAddWhatsappAccount = async () => {
    addLog("info", "Preparing a new WhatsApp account...");
    const ready = await syncWhatsappSession({ showToastMessage: true, createNew: true });
    addLog("info", ready ? "New account is active" : "New account QR is ready to scan");
  };

  const handleSelectWhatsappSession = async (sessionId) => {
    setActiveWaSessionId(sessionId);
    const session = waSessions.find((item) => item.id === sessionId);
    setWaAccount({ name: session?.lastKnownName || "", number: session?.lastKnownNumber || "", wid: "", platform: session?.lastKnownPlatform || "" });
    addLog("info", `Selecting account ${session?.label || sessionId}`);
    try {
      setWaInitializing(true);
      const { data } = await api.post("/select-whatsapp-session", { sessionId });
      applyWhatsappState(data);
      addLog(data?.whatsappReady ? "success" : "info", data?.message || "WhatsApp account selected");
    } catch (err) {
      const m = err?.response?.data?.message || "Failed to select WhatsApp account";
      setWhatsappReady(false); setWaInitializing(false); setWaQr("");
      addLog("error", m);
    }
  };

  const handleDeleteWhatsappSession = () => {
    if (!activeWaSessionId) { addLog("warning", "Please select a WhatsApp account first"); return; }
    const session = waSessions.find((s) => s.id === activeWaSessionId) || null;
    const label   = session?.lastKnownName || session?.label || activeWaSessionId;
    setDeleteConfirm({ open: true, label });
  };

  const confirmDeleteSession = async () => {
    setDeleteConfirm({ open: false, label: "" });
    const session = waSessions.find((s) => s.id === activeWaSessionId) || null;
    const label   = session?.lastKnownName || session?.label || activeWaSessionId;
    try {
      const { data } = await api.post("/delete-whatsapp-session", { sessionId: activeWaSessionId });
      applyWhatsappState(data);
      addLog("success", data.message || `Session ${label} deleted`);
    } catch (err) {
      const m = err?.response?.data?.message || "Failed to delete WhatsApp session";
      addLog("error", m);
    }
  };

  const handleSend = async () => {
    if (sending)                return;
    if (!activeWaSessionId)     { addLog("warning", "Please select a WhatsApp account first"); return; }
    if (!customers.length)      { addLog("error",   "Customer data is empty");               return; }
    if (Number(delay) < 3000)   { addLog("warning", "Minimum delay is 3000 ms");             return; }
    try {
      setSending(true); setLastSendSummary(null); setLastSendResults([]);
      setProgress({ current: 0, total: customers.length });
      const ready = await checkWhatsappStatus(false);
      if (!ready) { setSending(false); addLog("warning", "WhatsApp is not ready yet. Please connect first."); return; }
      addLog("info", `Starting to send messages to ${customers.length} customers...`);
      const { data } = await api.post("/send-messages", { customers, delay: Number(delay), sessionId: activeWaSessionId });
      if (data.background) {
        addLog("success", data.message || "Sending is running in the background");
      } else {
        const s = data.summary || { success: 0, failed: 0 };
        setSending(false); setLastSendSummary(s);
        addLog("success", `Finished - Success: ${s.success}, Failed: ${s.failed}`);
      }
    } catch (err) {
      const m = err?.response?.data?.message || "Failed to send message";
      setSending(false); addLog("error", m);
    }
  };

  const fetchSendResults = async (showFinishToast = false) => {
    try {
      const { data } = await api.get("/send-results");
      setSending(!!data.isSending);
      setLastSendSummary(data.summary || null);
      setLastSendResults(Array.isArray(data.results) ? data.results : []);
      setProgress(data.isSending ? normalizeProgress(data.progress) : { current: 0, total: 0 });
      if (!data.isSending && data.summary && showFinishToast) {
        addLog("success", `Finished - Success: ${data.summary.success || 0}, Failed: ${data.summary.failed || 0}`);
      }
      return data;
    } catch { return null; }
  };

  // Init + socket listeners
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [tplRes, gsRes, stRes] = await Promise.allSettled([
          api.get("/template"), api.get("/gsheet"), api.get("/status"),
        ]);

        if (tplRes.status === "fulfilled") setTemplate(tplRes.value?.data?.template || "");
        else addLog("error", tplRes.reason?.response?.data?.message || "Failed to load template");

        let gs = {};
        if (gsRes.status === "fulfilled") {
          gs = gsRes.value?.data || {};
          setGsheetUrl(gs?.url || ""); setSelectedSheet(gs?.selectedSheet || "");
          setAutoSync(!!gs?.autoSync); setLastSyncAt(gs?.lastSyncAt || null);
        } else addLog("error", gsRes.reason?.response?.data?.message || "Failed to load Google Sheet configuration");

        if (stRes.status === "fulfilled") {
          const sd = stRes.value?.data || {};
          applyWhatsappState(sd);
          setSending(!!sd.isSending);
          setLastSendSummary(sd.lastSendSummary || null);
          setLastSendResults(Array.isArray(sd.lastSendResults) ? sd.lastSendResults : []);
          setProgress(sd.isSending ? normalizeProgress(sd.progress) : { current: 0, total: 0 });
          if (sd.whatsappReady) { setWaPopup(true); }
          else if (sd.activeSessionId && !sd.qr && !sd.meta?.initializing) {
            await syncWhatsappSession({ sessionId: sd.activeSessionId || "", createNew: false });
          }
        } else addLog("error", stRes.reason?.response?.data?.message || "Failed to load WhatsApp status");

        await loadCustomersFromPdf(false);

        if (gs?.url) {
          const sheets = await fetchSheetNames(false);
          if (gs?.autoSync && sheets.length > 0) {
            setLoadingAutoCustomers(true);
            const target = gs?.selectedSheet || sheets[0] || "";
            await loadCustomersFromGSheet(target, false, true);
            addLog("success", `Auto sync - ${target || "active sheet"}`);
          }
        }
      } catch (err) {
        const m = err?.response?.data?.message || err?.message || "Failed to load initial data";
        addLog("error", m);
      } finally { setLoadingAutoCustomers(false); }
    };

    fetchInitial();
    fetchSendResults(false);

    const onProgress        = (d) => { setSending(true); setProgress({ current: d.current || 0, total: d.total || 0 }); };
    const onLog             = (d) => { const seq = logSeqRef.current++; setLogs((p) => [{ ...d, _seq: seq }, ...p]); };
    const onFinished        = (d) => {
      const summary = d?.summary || null;
      setSending(false); setLastSendSummary(summary); setLastSendResults(Array.isArray(d?.results) ? d.results : []);
      if (summary) {
        setProgress({ current: summary.total || 0, total: summary.total || 0 });
        const msg = `Finished - Success: ${summary.success || 0}, Failed: ${summary.failed || 0}`;
        addLog(d?.success === false ? "error" : "success", msg);
      } else { setProgress({ current: 0, total: 0 }); }
    };
    const onWaQr            = (d) => {
      if (d?.sessionId) setActiveWaSessionId(d.sessionId);
      setWaQr(d?.qr || ""); setWaQrAt(d?.time || null); setWhatsappReady(false); setWaInitializing(false);
      setQrOpen(true);
      if (!d?.isRefresh) { lastWhatsappLogRef.current = "wa-qr"; addLog("info", "QR received - please scan it"); }
    };
    const onWaAuthenticated = (d) => {
      setWaQr(""); setWaInitializing(true); lastWhatsappLogRef.current = "wa-authenticated";
      addLog("info", "QR scanned, syncing WhatsApp...");
      window.setTimeout(() => { checkWhatsappStatus(false, d?.sessionId || ""); }, 1200);
    };
    const onWaReady = async (d) => {
      if (d?.sessionId) setActiveWaSessionId(d.sessionId);
      setPendingWaSessionId(""); setWhatsappReady(true); setWaQr(""); setWaInitializing(false);
      setQrOpen(false); setWaPopup(true);
      lastWhatsappLogRef.current = "wa-ready";
      addLog("success", "WhatsApp is ready to use");
      await checkWhatsappStatus(false, d?.sessionId || "");
    };

    if (socket?.on) {
      socket.on("send-progress",    onProgress);
      socket.on("send-log",         onLog);
      socket.on("send-finished",    onFinished);
      socket.on("wa-qr",            onWaQr);
      socket.on("wa-authenticated", onWaAuthenticated);
      socket.on("wa-ready",         onWaReady);
    }
    return () => {
      if (socket?.off) {
        socket.off("send-progress",    onProgress);
        socket.off("send-log",         onLog);
        socket.off("send-finished",    onFinished);
        socket.off("wa-qr",            onWaQr);
        socket.off("wa-authenticated", onWaAuthenticated);
        socket.off("wa-ready",         onWaReady);
      }
    };
  }, []);

  useEffect(() => {
    if (whatsappReady || (!waInitializing && !waQr)) return;
    const timer = window.setInterval(() => checkWhatsappStatus(false, pendingWaSessionId || activeWaSessionId), 5000);
    return () => window.clearInterval(timer);
  }, [whatsappReady, waInitializing, waQr, activeWaSessionId, pendingWaSessionId]);

  // Derived values
  const selectedWaSession = waSessions.find((s) => s.id === activeWaSessionId) || null;
  const percent           = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const waLabel           = whatsappReady ? "Connected" : waInitializing ? "Preparing..." : "Not logged in";
  const sendDisabled      = !whatsappReady || !customers.length || sending;
  const hasPdfResult      = sourceMode === "pdf" && pdfLogRows.length > 0;
  const filteredCustomers = customerSearch.trim()
    ? customers.filter((c) =>
        (c.nama || "").toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.nomor || "").includes(customerSearch)
      )
    : customers;
  const panelListHeight = isNarrow ? 340 : isMobile ? 420 : "auto";
  const mainGridHeight = isTablet ? 720 : "100%";
  const pagePadding = isNarrow ? 12 : 16;
  const customerGridTemplate = isNarrow ? "minmax(0, 1fr)" : S.customerHead.gridTemplateColumns;
  const customerRowStyle = (index, last) => ({
    ...S.customerRow(index % 2 === 0, last),
    gridTemplateColumns: customerGridTemplate,
    alignItems: isNarrow ? "flex-start" : "center",
    gap: isNarrow ? 4 : 10,
    padding: isDesktop ? "5px 12px" : isNarrow ? "9px 12px" : "7px 14px",
  });
  const headerChipStyle = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
    maxWidth: isNarrow ? 160 : 240,
    height: 32,
    paddingInline: 12,
    borderRadius: 10,
    fontFamily: F.sans,
    fontSize: 12,
    fontWeight: 600,
    color: "#fff",
    whiteSpace: "nowrap",
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Render Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  return (
    <div
      className={`dashboard-scrollbar-none${isDesktop ? " dashboard-page--compact" : ""}`}
      style={{
        ...S.page,
        height: "calc(100vh - 64px)",
        minHeight: 0,
        overflowY: "hidden",
        gap: 12,
        padding: pagePadding,
        paddingBottom: pagePadding,
      }}
    >

      {/* Header slot portal */}
      {headerSlot && createPortal(
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <style>{`.hdr-search::placeholder { color: rgba(255,255,255,0.42); font-weight: 400; }`}</style>
          <div
            style={{ position: "relative", display: "flex", alignItems: "center" }}
            onMouseEnter={(e) => {
              const inp = e.currentTarget.querySelector("input");
              if (inp !== document.activeElement) {
                inp.style.borderColor = "rgba(233,196,106,0.55)";
                inp.style.background = "rgba(233,196,106,0.1)";
              }
            }}
            onMouseLeave={(e) => {
              const inp = e.currentTarget.querySelector("input");
              if (inp !== document.activeElement) {
                inp.style.borderColor = customerSearch ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.22)";
                inp.style.background = "rgba(255,255,255,0.12)";
              }
            }}
          >
            <SearchRoundedIcon style={{ position: "absolute", left: 11, fontSize: 14, color: "rgba(255,255,255,0.55)", pointerEvents: "none" }} />
            <input
              type="text"
              className="hdr-search"
              placeholder="Search..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              style={{
                height: 34,
                paddingLeft: 32,
                paddingRight: customerSearch ? 30 : 14,
                width: isNarrow ? 154 : 200,
                fontFamily: F.sans,
                fontSize: 12.5,
                fontWeight: 500,
                color: "#fff",
                border: "1.5px solid rgba(255,255,255,0.22)",
                borderRadius: 10,
                background: "rgba(255,255,255,0.12)",
                outline: "none",
                transition: "border-color 0.18s, background 0.18s",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.12)",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(233,196,106,0.8)";
                e.target.style.background = "rgba(233,196,106,0.12)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = customerSearch ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.22)";
                e.target.style.background = "rgba(255,255,255,0.12)";
              }}
            />
            {customerSearch && (
              <button
                type="button"
                onClick={() => setCustomerSearch("")}
                style={{ position: "absolute", right: 8, width: 16, height: 16, borderRadius: "50%", background: "rgba(255,255,255,0.28)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
              >
                <CloseRoundedIcon style={{ fontSize: 9, color: "#fff" }} />
              </button>
            )}
          </div>
          {/* WA status pill */}
          <div style={{ ...headerChipStyle, border: "1.5px solid rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.18)" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: whatsappReady ? "#4ade80" : waInitializing ? "#fbbf24" : "rgba(255,255,255,0.4)", flexShrink: 0 }} />
            <WhatsAppIcon style={{ fontSize: 14 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              {whatsappReady
                ? (waAccount.number || selectedWaSession?.lastKnownNumber || "Connected")
                : waInitializing ? "Preparing..." : "Not connected"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRefreshCustomers}
            className="header-icon-button header-icon-button--compact"
            title={sourceMode === "pdf" ? "Refresh PDF customers" : "Sync customers"}
            disabled={syncingSheet || loadingAutoCustomers}
            style={{ opacity: syncingSheet || loadingAutoCustomers ? 0.55 : 1 }}
          >
            <RefreshRoundedIcon style={{ fontSize: 17 }} />
          </button>
          {/* Sending badge */}
          {sending && (
            <div style={{ ...headerChipStyle, border: "1.5px solid rgba(233,196,106,0.5)", background: "rgba(233,196,106,0.18)", fontWeight: 700, color: "rgba(233,196,106,0.95)" }}>
              <SendRoundedIcon style={{ fontSize: 13 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>Sending {progress.current}/{progress.total}</span>
            </div>
          )}
        </div>,
        headerSlot
      )}

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Stat Cards Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <Grid container spacing={1.5} alignItems="stretch" sx={{ mb: 0, flexShrink: 0 }}>

        <Grid item xs={12} sm={6} lg={3} sx={{ display: "flex" }}>
          <CardBox
            style={{ height: "100%", width: "100%", minHeight: isDesktop ? 108 : isNarrow ? 118 : 132 }}
            eyebrow="Customers Loaded"
            icon={statIcon(<BadgeRoundedIcon />, "teal")}
            value={customers.length.toLocaleString()}
            detail={
              sourceMode === "pdf"    ? `PDF Results - ${pdfLogRows.length} total` :
              sourceMode === "gsheet" ? `Google Sheet - ${selectedSheet || "-"}` :
              fileInfo?.fileName || "Belum ada data"
            }
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3} sx={{ display: "flex" }}>
          <CardBox
            style={{ height: "100%", width: "100%", minHeight: isDesktop ? 108 : isNarrow ? 118 : 132 }}
            eyebrow="WhatsApp Status"
            icon={statIcon(<WhatsAppIcon />, "green")}
            value={waLabel}
            detail={waAccount.number || selectedWaSession?.lastKnownNumber || activeWaSessionId || "Not connected"}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3} sx={{ display: "flex" }}>
          <CardBox
            style={{ height: "100%", width: "100%", minHeight: isDesktop ? 108 : isNarrow ? 118 : 132 }}
            eyebrow="Message Template"
            icon={statIcon(<DescriptionRoundedIcon />, "amber")}
            value={template?.trim() ? "Ready to Send" : "Not Set"}
            detail={template?.trim() ? `${template.trim().split("\n").length} message lines` : "Open Settings"}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3} sx={{ display: "flex" }}>
          <CardBox
            style={{ height: "100%", width: "100%", minHeight: isDesktop ? 108 : isNarrow ? 118 : 132 }}
            eyebrow="Saved WA Sessions"
            icon={statIcon(<DevicesRoundedIcon />, "blue")}
            value={`${waSessions.length} Accounts`}
            detail={activeWaSessionId ? (selectedWaSession?.lastKnownName || selectedWaSession?.label || activeWaSessionId) : "No active session yet"}
          />
        </Grid>

      </Grid>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Main Grid Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <Grid
        container
        spacing={1.5}
        alignItems="stretch"
        sx={{
          flex: { xs: "0 0 auto", md: 1 },
          height: { xs: "auto", md: mainGridHeight },
          minHeight: { xs: "auto", md: 0 },
          overflow: { xs: "visible", md: "hidden" },
          pb: 0,
        }}
      >

        {/* Col 1 Ã¢â‚¬â€ Pelanggan PDF */}
        <Grid item xs={12} md={6} lg={4} sx={{ display: "flex", height: { xs: "auto", md: "100%" }, minHeight: 0 }}>
          <CardBigBox
            style={{ height: "100%", width: "100%", minWidth: 0 }}
            title={panelTitle(<BadgeRoundedIcon />, "Customer Data", "teal")}
            description="List of message recipients"
            headerAction={
              hasPdfResult ? (
                <button
                  className="users-table-card__action"
                  onClick={() => navigate("/pdf/hasil")}
                  style={{
                    minHeight: 32, padding: "0 10px", fontFamily: F.sans,
                    fontSize: 12, fontWeight: 700, lineHeight: 1,
                    boxShadow: "0 4px 12px rgba(42,157,143,0.18)",
                    borderRadius: 999, width: "auto",
                  }}
                >
                  <OpenInNewRoundedIcon style={{ fontSize: 14 }} />
                  Details
                </button>
              ) : null
            }
          >
            <div style={S.customerPanelBody}>
              <div
                className="dashboard-scrollbar-none"
                style={{
                  ...S.listScroll,
                  flex: isMobile ? "0 0 auto" : "1 1 auto",
                  height: panelListHeight,
                  minHeight: panelListHeight === "auto" ? 0 : panelListHeight,
                  marginBottom: 0,
                }}
              >
                {customers.length === 0 ? (
                  <div style={S.customerEmpty}>
                    <div style={S.customerEmptyIcon}>
                      <BadgeRoundedIcon style={{ fontSize: 28 }} />
                    </div>
                    <p style={S.customerEmptyTitle}>No Customer Data Yet</p>
                    <p style={S.customerEmptyText}>
                      Customer data will appear here once the PDF results are available.
                    </p>
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div style={S.customerEmpty}>
                    <div style={S.customerEmptyIcon}>
                      <SearchRoundedIcon style={{ fontSize: 28 }} />
                    </div>
                    <p style={S.customerEmptyTitle}>Customer tidak ditemukan</p>
                    <p style={S.customerEmptyText}>Coba kata kunci atau nomor WhatsApp yang berbeda.</p>
                  </div>
                ) : (
                  <div style={S.customerTable}>
                    <div style={{ ...S.customerHead, gridTemplateColumns: customerGridTemplate, padding: isDesktop ? "8px 12px" : isNarrow ? "9px 12px" : "10px 14px" }}>
                      <span style={S.customerHeadText}>Customer</span>
                      {!isNarrow && <span style={{ ...S.customerHeadText, textAlign: "right" }}>No. WhatsApp</span>}
                    </div>
                    {filteredCustomers.map((c, i) => {
                      const name = c.nama || "?";
                      const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("") || "?";
                      return (
                        <div key={`${c.nomor || "cust"}-${i}`} style={customerRowStyle(i, i === filteredCustomers.length - 1)}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                            <span className="users-table__avatar" style={S.customerAvatar}>{initials}</span>
                            <span style={{ ...S.customerName, whiteSpace: isNarrow ? "normal" : "nowrap" }}>{c.nama || "-"}</span>
                          </div>
                          <span style={{ ...S.customerPhone, textAlign: isNarrow ? "left" : "right", paddingLeft: isNarrow ? 37 : 0 }}>{c.nomor || "-"}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div style={S.customerFooter}>
                <p style={S.customerFooterText}>
                  <BadgeRoundedIcon style={{ fontSize: 15, color: "#8a97ad", flexShrink: 0 }} />
                  Total customer data ready to process:{" "}
                  <span style={S.customerFooterValue}>
                    {customers.length}
                  </span>
                </p>
              </div>
            </div>
          </CardBigBox>
        </Grid>

        {/* Col 2 Ã¢â‚¬â€ WhatsApp Control */}
        <Grid item xs={12} md={6} lg={4} sx={{ display: "flex", height: { xs: "auto", md: "100%" }, minHeight: 0 }}>
          <CardBigBox
            style={{ height: "100%", width: "100%", minWidth: 0 }}
            title={panelTitle(<WhatsAppIcon />, "WhatsApp", "green")}
            description="Manage sessions & send messages"
            headerAction={
              waQr && !whatsappReady ? (
                <button
                  className="users-table-card__action"
                  onClick={() => setQrOpen(true)}
                  style={{
                    minHeight: 38,
                    padding: "0.58rem 1rem",
                    fontFamily: F.sans,
                    fontSize: 12,
                    fontWeight: 700,
                    lineHeight: 1,
                    boxShadow: "0 8px 18px rgba(35, 57, 113, 0.22)",
                    borderRadius: 999,
                    width: "auto",
                  }}
                >
                  <QrCode2RoundedIcon style={{ fontSize: 14 }} />
                  Open QR
                </button>
              ) : null
            }
            footer={
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button className="users-table-card__action" style={S.primaryBtn(true)} onClick={handleInitWhatsapp}>
                  <WhatsAppIcon style={{ fontSize: 14 }} />
                  {whatsappReady ? "WhatsApp Connected" : waInitializing ? "Preparing..." : "Connect WhatsApp"}
                </button>
                <button
                  className="users-table-card__action"
                  onClick={handleOpenWaBrowser}
                  disabled={!activeWaSessionId || openingWaBrowser}
                  style={S.primaryBtn(true, !activeWaSessionId || openingWaBrowser)}
                >
                  <OpenInNewRoundedIcon style={{ fontSize: 14 }} />
                  {openingWaBrowser ? "Opening..." : "Open WhatsApp"}
                </button>
              </div>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

                <SessionDropdown
                  sessions={waSessions}
                  value={activeWaSessionId}
                  onChange={handleSelectWhatsappSession}
                  disabled={waSessions.length === 0}
                />

                <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 6 }}>
                  <CreateButton
                    variant="detail"
                    onClick={handleAddWhatsappAccount}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 12.5, minHeight: 34, padding: "0 10px" }}
                  >
                    <AddRoundedIcon style={{ fontSize: 14 }} />
                    Add Session
                  </CreateButton>
                  <CreateButton
                    variant="detail"
                    onClick={handleDeleteWhatsappSession}
                    disabled={!activeWaSessionId}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 12.5, minHeight: 34, padding: "0 10px", opacity: !activeWaSessionId ? 0.5 : 1, borderColor: "rgba(239, 68, 68, 0.22)", background: "rgba(239, 68, 68, 0.10)", color: "#dc2626" }}
                  >
                    <DeleteSweepRoundedIcon style={{ fontSize: 13 }} />
                    Delete Session
                  </CreateButton>
                </div>

                <div style={{ borderRadius: 12, border: `1px solid ${C.line}`, overflow: "hidden" }}>
                  <DataRow label="Account Name" value={waAccount.name || selectedWaSession?.lastKnownName || "-"} even />
                  <DataRow label="WA Number"    value={waAccount.number || selectedWaSession?.lastKnownNumber || "-"} mono />
                  <DataRow label="Status"       value={whatsappReady ? "Connected" : waInitializing ? "Preparing..." : "Not connected"} even />
                  <DataRow label="Session ID"   value={activeWaSessionId || "Not selected"} mono last />
                </div>

                {(progress.total > 0 || loadingAutoCustomers || sending) && (
                  <div style={S.progressBox}>
                    <div style={{ ...S.rowBetween, marginBottom: 10 }}>
                      <span style={{ fontFamily: F.sans, fontSize: 12.5, fontWeight: 500, color: C.brand }}>
                        {loadingAutoCustomers ? "Loading auto sync..." : sending ? "Sending messages..." : "Sending progress"}
                      </span>
                      {!loadingAutoCustomers && (
                        <div style={S.row}>
                          <span style={S.mono(11.5)}>{progress.current}/{progress.total}</span>
                          <span style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 600, padding: "2px 6px", borderRadius: 5, background: C.white, color: C.brand, border: `1px solid ${C.brandBorder}` }}>
                            {percent}%
                          </span>
                        </div>
                      )}
                    </div>
                    <LinearProgress
                      variant={loadingAutoCustomers ? "indeterminate" : "determinate"}
                      value={loadingAutoCustomers ? undefined : percent}
                      sx={{ height: 4, borderRadius: 999, bgcolor: C.white, "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: C.brand } }}
                    />
                  </div>
                )}

                {lastSendSummary && (
                  <SendResultCard summary={lastSendSummary} />
                )}

            </div>
          </CardBigBox>
        </Grid>

        {/* Col 3 Ã¢â‚¬â€ Activity Log */}
        <Grid item xs={12} lg={4} sx={{ display: "flex", height: { xs: "auto", lg: "100%" }, minHeight: 0 }}>
          <CardBigBox
            style={{ height: "100%", width: "100%", minWidth: 0 }}
            title={panelTitle(<ChecklistRoundedIcon />, "Activity Log", "blue")}
            description="Sending activity history"
          >
            <div style={S.customerPanelBody}>
              {lastSendSummary && (
                <SendResultCard summary={lastSendSummary} />
              )}
              <div
                className="dashboard-scrollbar-none"
                style={{
                  ...S.listScroll,
                  flex: isMobile || isTablet ? "0 0 auto" : "1 1 auto",
                  height: isNarrow ? 340 : isMobile || isTablet ? 420 : "auto",
                  minHeight: isNarrow ? 340 : isMobile || isTablet ? 420 : 0,
                  marginBottom: 0,
                }}
              >
                <div style={{ position: "sticky", top: 0, zIndex: 2, display: "grid", gridTemplateColumns: "minmax(0, 1fr) 80px", alignItems: "center", gap: 10, padding: isDesktop ? "8px 12px" : "10px 14px", background: "#eef1f6", borderBottom: "1px solid #d4ddf0" }}>
                  <span style={S.customerHeadText}>Activity</span>
                  <span style={{ ...S.customerHeadText, textAlign: "right" }}>Time</span>
                </div>
                <LogsPanel logs={logs} />
              </div>
              <div style={S.customerFooter}>
                <p style={S.customerFooterText}>
                  <ChecklistRoundedIcon style={{ fontSize: 15, color: "#8a97ad", flexShrink: 0 }} />
                  Total log aktivitas: <span style={S.customerFooterValue}>{logs.length}</span>
                </p>
              </div>
            </div>
          </CardBigBox>
        </Grid>

      </Grid>

      <WaConnectedPopup
        open={waPopup}
        name={waAccount.name || selectedWaSession?.lastKnownName}
        number={waAccount.number || selectedWaSession?.lastKnownNumber}
        onClose={() => setWaPopup(false)}
      />

      <WaPreparingPopup open={waInitializing && !whatsappReady && !waPopup} />

      <WaErrorPopup
        open={waError.open}
        message={waError.message}
        onClose={() => setWaError({ open: false, message: "" })}
      />

      <QRDialog
        open={qrOpen}
        waQr={waQr} waQrAt={waQrAt}
        formatSyncTime={formatSyncTime} onClose={() => setQrOpen(false)}
      />

      <DeleteConfirmPopup
        open={deleteConfirm.open}
        label={deleteConfirm.label}
        onConfirm={confirmDeleteSession}
        onCancel={() => setDeleteConfirm({ open: false, label: "" })}
      />

    </div>
  );
}
