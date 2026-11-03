import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, LinearProgress } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import LogsPanel from "../components/LogsPanel";
import api    from "../services/api";
import socket from "../services/socket";
import "./DashboardPage.css";

import WhatsAppIcon                 from "@mui/icons-material/WhatsApp";
import SendRoundedIcon              from "@mui/icons-material/SendRounded";
import QrCode2RoundedIcon           from "@mui/icons-material/QrCode2Rounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import DeleteSweepRoundedIcon       from "@mui/icons-material/DeleteSweepRounded";
import AddRoundedIcon               from "@mui/icons-material/AddRounded";
import CheckCircleRoundedIcon       from "@mui/icons-material/CheckCircleRounded";
import SearchRoundedIcon            from "@mui/icons-material/SearchRounded";
import OpenInNewRoundedIcon         from "@mui/icons-material/OpenInNewRounded";
import RefreshRoundedIcon           from "@mui/icons-material/RefreshRounded";
import PictureAsPdfRoundedIcon      from "@mui/icons-material/PictureAsPdfRounded";
import CloudDoneRoundedIcon         from "@mui/icons-material/CloudDoneRounded";
import VisibilityRoundedIcon        from "@mui/icons-material/VisibilityRounded";
import ArrowUpwardRoundedIcon       from "@mui/icons-material/ArrowUpwardRounded";
import ArrowDownwardRoundedIcon     from "@mui/icons-material/ArrowDownwardRounded";
import UnfoldMoreRoundedIcon        from "@mui/icons-material/UnfoldMoreRounded";
import WarningAmberRoundedIcon      from "@mui/icons-material/WarningAmberRounded";


// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Design tokens Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

const F = {
  sans: "var(--font-sans)",
  mono: "var(--font-mono)",
};

const C = {
  brand:        "#24476e",
  brandBg:      "#eef2f7",
  brandBorder:  "#b9c8dc",
  ink:          "var(--c-ink)",
  text:         "#374151",
  muted:        "#6b7280",
  subtle:       "#9ca3af",
  line:         "#e3e6eb",
  surface:      "#ffffff",
  white:        "#ffffff",
  amber:        "#92400e",
  amberBg:      "#fffbeb",
  amberBorder:  "#fde68a",
};

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

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
    <div ref={ref} className="ns-acct">
      <button
        type="button"
        className="ns-acct__field"
        onClick={() => { if (!disabled) setOpen((v) => !v); }}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`ns-acct__dot${selected?.runtimeReady ? " ns-acct__dot--ready" : selected ? " ns-acct__dot--idle" : ""}`} />
        <span className={`ns-acct__value${selected ? "" : " ns-acct__value--empty"}`}>
          {sessions.length === 0 ? "Belum ada akun tersimpan" : selected?.label || "Pilih akun"}
        </span>
        <KeyboardArrowDownRoundedIcon className="ns-acct__arrow" />
      </button>

      {open && sessions.length > 0 && (
        <div className="ns-acct__menu" role="listbox">
          {sessions.map((s) => {
            const isActive = s.id === value;
            return (
              <button
                key={s.id}
                type="button"
                role="option"
                aria-selected={isActive}
                className={`ns-acct__option${isActive ? " ns-acct__option--active" : ""}`}
                onClick={() => { onChange(s.id); setOpen(false); }}
              >
                <span className={`ns-acct__dot${s.runtimeReady ? " ns-acct__dot--ready" : " ns-acct__dot--idle"}`} />
                <span className="ns-acct__label">{(s.label || s.id).replace(/\s*\(\d+\)\s*$/, "")}</span>
                {s.lastKnownNumber && <span className="ns-acct__num">{s.lastKnownNumber}</span>}
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
      slotProps={{ backdrop: { sx: { background: "rgba(15, 23, 42, 0.45)" } } }}
      PaperProps={{ sx: { borderRadius: "4px", overflow: "hidden", fontFamily: F.sans, boxShadow: "0 24px 60px rgba(15, 23, 42, 0.25)" } }}
    >
      <div className="bd-qr__head">
        <div>
          <h3>Scan QR WhatsApp</h3>
          <p>Hubungkan akun yang dipakai untuk mengirim tagihan.</p>
        </div>
        <button type="button" className="bd-btn bd-btn--icon" aria-label="Tutup" onClick={onClose}>
          <CloseRoundedIcon style={{ fontSize: 17 }} />
        </button>
      </div>
      <DialogContent sx={{ pt: 0, pb: "22px", px: "22px", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
        <div className="bd-qr__frame">
          <QRCodeSVG value={waQr} size={208} bgColor="#ffffff" fgColor="#0f172a" level="M" />
        </div>
        <ol className="bd-qr__steps">
          <li>Buka WhatsApp di HP</li>
          <li>Ketuk <strong>Perangkat tertaut</strong> lalu <strong>Tautkan perangkat</strong></li>
          <li>Arahkan kamera ke QR ini</li>
        </ol>
        {waQrAt && <p className="bd-qr__time">QR diperbarui {formatSyncTime(waQrAt)}. QR berganti otomatis tiap beberapa detik.</p>}
      </DialogContent>
    </Dialog>
  );
}

// Small corner notice used for WhatsApp connection events. Non-blocking, closes itself.
function Toast({ open, tone = "info", title, message, autoHide = 0, onClose }) {
  useEffect(() => {
    if (!open || !autoHide) return undefined;
    const t = window.setTimeout(onClose, autoHide);
    return () => window.clearTimeout(t);
  }, [open, autoHide]);

  if (!open) return null;
  return (
    <div className={`bd-toast bd-toast--${tone}`} role="status">
      <span className="bd-toast__icon" aria-hidden="true">
        {tone === "loading" ? <span className="bd-spin" /> : tone === "ok" ? <CheckCircleRoundedIcon style={{ fontSize: 18 }} /> : tone === "error" ? <CloseRoundedIcon style={{ fontSize: 18 }} /> : null}
      </span>
      <div className="bd-toast__text">
        <strong>{title}</strong>
        {message && <span>{message}</span>}
      </div>
      {onClose && tone !== "loading" && (
        <button type="button" className="bd-toast__close" aria-label="Tutup" onClick={onClose}>
          <CloseRoundedIcon style={{ fontSize: 14 }} />
        </button>
      )}
    </div>
  );
}

function DeleteConfirmPopup({ open, label, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="bd-modal-backdrop" onClick={onCancel}>
      <div className="bd-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="bd-modal__head">
          <h3>Hapus akun WhatsApp?</h3>
        </div>
        <div className="bd-modal__body">
          <p>
            Session <strong>{label}</strong> akan dihapus. Untuk memakai akun ini lagi, Anda perlu scan QR ulang.
          </p>
        </div>
        <div className="bd-modal__actions">
          <button type="button" className="bd-btn" onClick={onCancel}>Batal</button>
          <button type="button" className="bd-btn bd-btn--danger-solid" onClick={onConfirm}>Hapus</button>
        </div>
      </div>
    </div>
  );
}

// --- Billing helpers ---------------------------------------------------------

// In dev the PDF files are served by the backend directly, not through the Vite proxy.
const RAW_BACKEND_URL = import.meta.env.DEV ? `${window.location.protocol}//${window.location.hostname}:8098` : "";

const FILTERS = [
  { id: "all",     label: "Semua" },
  { id: "overdue", label: "Lewat Tempo" },
  { id: "soon",    label: "7 Hari Lagi" },
  { id: "nowa",    label: "Tanpa No. WA" },
  { id: "luar",    label: "Luar Kota" },
  { id: "dalam",   label: "Dalam Kota" },
  { id: "failed",  label: "Gagal" },
];

// Send history comes from the server (/pdf/log -> history), so every browser sees the
// same "Terkirim" state. Only results for the current PDF batch count as this round's status.
function statusFromHistory(history = {}, generatedAt) {
  const status = {};
  Object.entries(history || {}).forEach(([nama, h]) => {
    if (h && h.batch === generatedAt) status[nama] = { ok: !!h.ok, error: h.error || "", at: h.at || null };
  });
  return status;
}

const formatJam = (iso) => {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "";
};

// Fill the WhatsApp template for one customer (same placeholders the backend uses).
function buildMessage(template, row) {
  if (!template.trim() || !row) return "";
  return template
    .replace(/{nama}/g,  row.nama || "-")
    .replace(/{nomor}/g, row.nomor || "-")
    .replace(/{total}/g, row.total || "Rp 0")
    .replace(/{tempo}/g, row.tempo || "-")
    .replace(/{pdf}/g,   row.pdf ? "(terlampir)" : "")
    .replace(/{drive}/g, row.driveUrl || "");
}

// Sortable columns. "urgency" is the default order (nearest due date first).
const SORTERS = {
  urgency: (a, b) => (a.days ?? Infinity) - (b.days ?? Infinity),
  nama:    (a, b) => String(a.nama || "").localeCompare(String(b.nama || ""), "id"),
  amount:  (a, b) => a.amount - b.amount,
  due:     (a, b) => (a.due?.getTime() ?? Infinity) - (b.due?.getTime() ?? Infinity),
};

function downloadCsv(filename, rows) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = rows.map((r) => r.map(esc).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);

function parseRupiah(value) {
  const n = Number(String(value ?? "").replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

// Backend writes the nearest due date as dd/mm/yyyy (id-ID) or "-";
// also accept dd-mm-yyyy, dd.mm.yyyy and yyyy-mm-dd in case the sheet format differs.
function parseTempo(value) {
  const v = String(value || "").trim();
  let m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(v);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(v);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return null;
}

const formatTanggal = (date) =>
  date ? date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "";

// 6281234567890 -> 0812-3456-7890 (how people read Indonesian numbers).
function formatPhone(nomor) {
  let d = String(nomor || "").replace(/\D/g, "");
  if (d.startsWith("62")) d = "0" + d.slice(2);
  if (d.length < 10) return d;
  return `${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8)}`;
}

function daysUntil(date) {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / 86400000);
}

// "TIDAK DITEMUKAN" has no digits, so it fails this check as intended.
const hasWaNumber = (nomor) => String(nomor || "").replace(/\D/g, "").length >= 8;

function toBillingRow(row) {
  return {
    ...row,
    amount: parseRupiah(row.total),
    due:    parseTempo(row.tempo),
    days:   daysUntil(parseTempo(row.tempo)),
    hasWa:  hasWaNumber(row.nomor),
  };
}

// Strip the derived fields before posting rows back to the backend.
const toPayload = ({ amount, due, days, hasWa, ...row }) => row;

const byUrgency = (a, b) => (a.days ?? Infinity) - (b.days ?? Infinity);

function dueInfo(days) {
  if (days === null)  return { tone: "none",    label: "Tanpa tempo" };
  if (days < 0)       return { tone: "overdue", label: `Lewat ${-days} hari` };
  if (days === 0)     return { tone: "soon",    label: "Hari ini" };
  if (days <= 7)      return { tone: "soon",    label: `${days} hari lagi` };
  return { tone: "ok", label: `${days} hari lagi` };
}

function Stat({ label, value, sub, tone }) {
  return (
    <div className="bd-stat">
      <span className="bd-stat__label">{label}</span>
      <strong className={`bd-stat__value${tone ? ` bd-stat__value--${tone}` : ""}`}>{value}</strong>
      <span className="bd-stat__sub">{sub}</span>
    </div>
  );
}

// NetSuite-style portlet: grey-blue title bar with a collapse toggle.
function Portlet({ title, actions, fill = false, children }) {
  const [open, setOpen] = useState(true);
  return (
    <section className={`ns-portlet${fill && open ? " ns-portlet--fill" : ""}`}>
      <header className="ns-portlet__head">
        <button type="button" className="ns-portlet__toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <KeyboardArrowDownRoundedIcon style={{ fontSize: 18, transform: open ? "none" : "rotate(-90deg)" }} />
          <span>{title}</span>
        </button>
        {actions && <div className="ns-portlet__actions">{actions}</div>}
      </header>
      {open && <div className="ns-portlet__body">{children}</div>}
    </section>
  );
}

function ConfirmSendPopup({ open, count, amount, account, noPdfCount, resendCount, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="bd-modal-backdrop" onClick={onCancel}>
      <div className="bd-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="bd-modal__head">
          <h3>Kirim tagihan?</h3>
        </div>
        <div className="bd-modal__body">
          <p>
            Pesan tagihan beserta dokumen PDF akan dikirim ke <strong>{count} pelanggan</strong> dengan total
            tagihan <strong>{rupiah(amount)}</strong>.
          </p>
          <dl className="bd-kv">
            <dt>Dikirim dari</dt>
            <dd>{account || "-"}</dd>
            <dt>Jeda antar pesan</dt>
            <dd>2 - 4 detik</dd>
          </dl>
          {noPdfCount > 0 && (
            <p className="bd-modal__warn">
              <WarningAmberRoundedIcon style={{ fontSize: 16 }} />
              {noPdfCount} pelanggan belum punya PDF, jadi hanya pesan teks yang dikirim.
            </p>
          )}
          {resendCount > 0 && (
            <p className="bd-modal__warn">
              <WarningAmberRoundedIcon style={{ fontSize: 16 }} />
              {resendCount} pelanggan sudah pernah dikirim di batch ini dan akan menerima pesan lagi.
            </p>
          )}
        </div>
        <div className="bd-modal__actions">
          <button type="button" className="bd-btn" onClick={onCancel}>Batal</button>
          <button type="button" className="bd-btn bd-btn--primary" onClick={onConfirm}>
            Kirim sekarang
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewPopup({ row, message, status, selected, canSelect, onToggle, onOpenPdf, onClose }) {
  if (!row) return null;
  return (
    <div className="bd-modal-backdrop" onClick={onClose}>
      <div className="bd-modal bd-modal--preview" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="bd-modal__head">
          <h3>{row.nama || "-"}</h3>
          <button type="button" className="bd-btn bd-btn--icon bd-btn--sm" aria-label="Tutup" onClick={onClose}>
            <CloseRoundedIcon style={{ fontSize: 16 }} />
          </button>
        </div>
        <div className="bd-modal__body">
          <dl className="bd-kv">
            <dt>No. WhatsApp</dt>
            <dd>{row.hasWa ? formatPhone(row.nomor) : "Tidak ada"}</dd>
            <dt>Tagihan</dt>
            <dd>{row.total || rupiah(row.amount)}</dd>
            <dt>Jatuh tempo</dt>
            <dd>{formatTanggal(row.due) || row.tempo || "-"}</dd>
            <dt>Status</dt>
            <dd>{status.label}{status.at ? ` · ${formatJam(status.at)}` : ""}</dd>
          </dl>
          {status.error && <p className="bd-modal__warn bd-modal__warn--danger">{status.error}</p>}
          <span className="bd-preview__label">Pesan yang akan dikirim</span>
          <div className="bd-preview">{message || "Template pesan belum diatur. Isi lewat menu Settings."}</div>
          {!row.pdf && (
            <p className="bd-modal__warn">
              <WarningAmberRoundedIcon style={{ fontSize: 16 }} />
              PDF untuk pelanggan ini belum dibuat, jadi hanya pesan teks yang dikirim.
            </p>
          )}
        </div>
        <div className="bd-modal__actions">
          {row.pdf && (
            <button type="button" className="bd-btn" onClick={() => onOpenPdf(row.pdf)}>
              <PictureAsPdfRoundedIcon style={{ fontSize: 16 }} /> Lihat PDF
            </button>
          )}
          {row.driveUrl && (
            <a className="bd-btn" href={row.driveUrl} target="_blank" rel="noopener noreferrer">
              <CloudDoneRoundedIcon style={{ fontSize: 16 }} /> Google Drive
            </a>
          )}
          {canSelect && (
            <button type="button" className={`bd-btn${selected ? "" : " bd-btn--primary"}`} onClick={onToggle}>
              {selected ? "Batal pilih" : "Pilih untuk dikirim"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SortHeader({ label, sortKey, sort, onSort, className }) {
  const active = sort.key === sortKey;
  const Icon = !active ? UnfoldMoreRoundedIcon : sort.dir === "asc" ? ArrowUpwardRoundedIcon : ArrowDownwardRoundedIcon;
  return (
    <th className={className} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" className={`bd-sort${active ? " is-active" : ""}`} onClick={() => onSort(sortKey)}>
        {label}
        <Icon style={{ fontSize: 14 }} />
      </button>
    </th>
  );
}

// --- Main component ----------------------------------------------------------

export default function DashboardPage() {
  const navigate = useNavigate();
  const [rows,               setRows]               = useState([]);
  const [loadingRows,        setLoadingRows]        = useState(false);
  const [generatedAt,        setGeneratedAt]        = useState(null);
  const [selected,           setSelected]           = useState(() => new Set());
  const [rowStatus,          setRowStatus]          = useState({});
  const [search,             setSearch]             = useState("");
  const [filter,             setFilter]             = useState("all");
  const [sort,               setSort]               = useState({ key: "urgency", dir: "asc" });
  const [previewName,        setPreviewName]        = useState(null);
  const [template,           setTemplate]           = useState("");
  const [logs,               setLogs]               = useState([]);
  const [progress,           setProgress]           = useState({ current: 0, total: 0 });
  const [sending,            setSending]            = useState(false);
  const [stopping,           setStopping]           = useState(false);
  const [confirmOpen,        setConfirmOpen]        = useState(false);
  const [lastSendSummary,    setLastSendSummary]    = useState(null);
  const [whatsappReady,      setWhatsappReady]      = useState(false);
  const [waQr,               setWaQr]               = useState("");
  const [waQrAt,             setWaQrAt]             = useState(null);
  const [waInitializing,     setWaInitializing]     = useState(false);
  const [waSessions,         setWaSessions]         = useState([]);
  const [activeWaSessionId,  setActiveWaSessionId]  = useState("");
  const [pendingWaSessionId, setPendingWaSessionId] = useState("");
  const [waAccount,          setWaAccount]          = useState({ name: "", number: "", wid: "", platform: "" });
  const [qrOpen,             setQrOpen]             = useState(false);
  const [waPopup,            setWaPopup]            = useState(false);
  const [waError,            setWaError]            = useState({ open: false, message: "" });
  const [deleteConfirm,      setDeleteConfirm]      = useState({ open: false, label: "" });
  const [openingWaBrowser,   setOpeningWaBrowser]   = useState(false);
  const [headerSlot,         setHeaderSlot]         = useState(null);
  const lastWhatsappLogRef = useRef("");
  const logSeqRef          = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setHeaderSlot(document.getElementById("header-wa-slot")), 100);
    return () => clearTimeout(t);
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
    return Number.isNaN(d.getTime()) ? v : d.toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  // WA state helpers
  const applyWhatsappState = (data = {}, options = {}) => {
    const sessions         = normalizeSessions(data?.sessions);
    const nextActiveId     = data?.activeSessionId || sessions.find((s) => s.isActive)?.id || "";
    const nextActiveExists = sessions.some((s) => s.id === nextActiveId);

    setWhatsappReady(!!data.whatsappReady);
    setWaQr(data?.qr || "");
    setWaQrAt(data?.meta?.lastQrAt || null);
    setWaInitializing(!!data?.meta?.initializing && !data?.whatsappReady);
    setWaSessions(sessions);
    if (!options.preserveActiveSelection || nextActiveExists) setActiveWaSessionId(nextActiveId);
    if (nextActiveExists && pendingWaSessionId === nextActiveId) setPendingWaSessionId("");
    setWaAccount({ name: data?.account?.name || "", number: data?.account?.number || "", wid: data?.account?.wid || "", platform: data?.account?.platform || "" });
  };

  const syncWhatsappSession = async ({ sessionId = activeWaSessionId, createNew = false } = {}) => {
    try {
      setWaInitializing(true);
      const { data } = await api.post("/init-whatsapp", { sessionId: createNew ? "" : sessionId, createNew });

      applyWhatsappState(data, { preserveActiveSelection: createNew });
      if (createNew && data?.activeSessionId) setPendingWaSessionId(data.activeSessionId);
      if (data.whatsappReady) return true;

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
      const m = err?.response?.data?.message || "Gagal menghubungkan WhatsApp";
      setWhatsappReady(false); setWaInitializing(false); setWaQr("");
      if (createNew) setPendingWaSessionId("");
      setWaError({ open: true, message: m });
      addLog("error", m);
      return false;
    }
  };

  const checkWhatsappStatus = async (showMsg = false, sessionId = activeWaSessionId) => {
    try {
      const { data } = await api.post("/check-whatsapp", { sessionId });
      applyWhatsappState(data);
      if (data?.whatsappReady)  addWhatsappLogOnce("wa-ready", "success", "WhatsApp siap digunakan");
      else if (data?.needScan)  addWhatsappLogOnce("wa-need-scan", "info", "Silakan scan QR WhatsApp");
      return !!data?.whatsappReady;
    } catch (err) {
      const m = err?.response?.data?.message || "Gagal memeriksa status WhatsApp";
      setWhatsappReady(false);
      addWhatsappLogOnce(`wa-error-${m}`, "error", m);
      if (showMsg) setWaError({ open: true, message: m });
      return false;
    }
  };

  // Billing data
  const loadBilling = async (showLog = false) => {
    try {
      setLoadingRows(true);
      const { data } = await api.get("/pdf/log");
      const next = (Array.isArray(data?.rows) ? data.rows : []).map(toBillingRow).sort(byUrgency);
      const saved = statusFromHistory(data?.history, data?.generatedAt || null);
      setRows(next);
      setGeneratedAt(data?.generatedAt || null);
      setSelected(new Set(next.filter((r) => r.hasWa && !saved[r.nama]?.ok).map((r) => r.nama)));
      setRowStatus(saved);
      if (showLog) addLog("success", `${next.length} data penagihan dimuat`);
    } catch (err) {
      addLog("error", err?.response?.data?.message || "Gagal memuat data penagihan");
    } finally {
      setLoadingRows(false);
    }
  };

  // WA handlers
  const handleInitWhatsapp = async () => {
    addLog("info", "Menghubungkan WhatsApp...");
    const ready = await syncWhatsappSession({ sessionId: activeWaSessionId, createNew: false });
    addLog("info", ready ? "Session aktif" : "Menunggu scan QR");
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
    addLog("info", "Menyiapkan akun WhatsApp baru...");
    const ready = await syncWhatsappSession({ createNew: true });
    addLog("info", ready ? "Akun baru aktif" : "QR akun baru siap di-scan");
  };

  const handleSelectWhatsappSession = async (sessionId) => {
    setActiveWaSessionId(sessionId);
    const session = waSessions.find((item) => item.id === sessionId);
    setWaAccount({ name: session?.lastKnownName || "", number: session?.lastKnownNumber || "", wid: "", platform: session?.lastKnownPlatform || "" });
    addLog("info", `Memilih akun ${session?.label || sessionId}`);
    try {
      setWaInitializing(true);
      const { data } = await api.post("/select-whatsapp-session", { sessionId });
      applyWhatsappState(data);
      addLog(data?.whatsappReady ? "success" : "info", data?.message || "Akun WhatsApp dipilih");
    } catch (err) {
      const m = err?.response?.data?.message || "Gagal memilih akun WhatsApp";
      setWhatsappReady(false); setWaInitializing(false); setWaQr("");
      addLog("error", m);
    }
  };

  const handleDeleteWhatsappSession = () => {
    if (!activeWaSessionId) { addLog("warning", "Pilih akun WhatsApp dulu"); return; }
    const session = waSessions.find((s) => s.id === activeWaSessionId) || null;
    setDeleteConfirm({ open: true, label: session?.lastKnownName || session?.label || activeWaSessionId });
  };

  const confirmDeleteSession = async () => {
    setDeleteConfirm({ open: false, label: "" });
    const session = waSessions.find((s) => s.id === activeWaSessionId) || null;
    const label   = session?.lastKnownName || session?.label || activeWaSessionId;
    try {
      const { data } = await api.post("/delete-whatsapp-session", { sessionId: activeWaSessionId });
      applyWhatsappState(data);
      addLog("success", data.message || `Session ${label} dihapus`);
    } catch (err) {
      addLog("error", err?.response?.data?.message || "Gagal menghapus session WhatsApp");
    }
  };

  const handleOpenPdf = async (pdfPath) => {
    try {
      const res = await api.get(`${RAW_BACKEND_URL}${pdfPath}`, { responseType: "blob", baseURL: "" });
      const url = URL.createObjectURL(res.data);
      const tab = window.open(url, "_blank", "noopener,noreferrer");
      if (tab) tab.opener = null;
      window.setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
    } catch (err) {
      addLog("error", err?.response?.data?.message || "Gagal membuka PDF");
    }
  };

  // Selection
  const toggleRow = (key) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // Send
  const handleSend = async () => {
    setConfirmOpen(false);
    if (sending) return;
    if (!activeWaSessionId) { addLog("warning", "Pilih akun WhatsApp dulu"); return; }
    const targets = rows.filter((r) => r.hasWa && selected.has(r.nama));
    if (!targets.length) { addLog("warning", "Pilih minimal satu pelanggan dengan nomor WhatsApp"); return; }

    const ready = await checkWhatsappStatus(false);
    if (!ready) { addLog("warning", "WhatsApp belum siap. Hubungkan dulu."); return; }

    try {
      setSending(true); setLastSendSummary(null);
      setRowStatus((prev) => {
        const next = { ...prev };
        targets.forEach((r) => { delete next[r.nama]; });
        return next;
      });
      setProgress({ current: 0, total: targets.length });
      addLog("info", `Mulai mengirim penagihan ke ${targets.length} pelanggan...`);
      await api.post("/pdf/send-via-wa", { rows: targets.map(toPayload), sessionId: activeWaSessionId });
    } catch (err) {
      setSending(false);
      addLog("error", err?.response?.data?.message || "Gagal memulai pengiriman");
    }
  };

  const handleStop = async () => {
    setStopping(true);
    try {
      const { data } = await api.post("/pdf/cancel-send");
      addLog("warning", data?.message || "Menghentikan pengiriman...");
    } catch (err) {
      setStopping(false);
      addLog("error", err?.response?.data?.message || "Gagal menghentikan pengiriman");
    }
  };

  // Init + socket listeners
  useEffect(() => {
    const fetchInitial = async () => {
      const [tplRes, stRes] = await Promise.allSettled([api.get("/template"), api.get("/status")]);

      if (tplRes.status === "fulfilled") setTemplate(tplRes.value?.data?.template || "");

      if (stRes.status === "fulfilled") {
        const sd = stRes.value?.data || {};
        applyWhatsappState(sd);
        setSending(!!sd.isSending);
        if (sd.whatsappReady) setWaPopup(true);
        else if (sd.activeSessionId && !sd.qr && !sd.meta?.initializing) {
          await syncWhatsappSession({ sessionId: sd.activeSessionId || "", createNew: false });
        }
      } else addLog("error", stRes.reason?.response?.data?.message || "Gagal memuat status WhatsApp");

      await loadBilling(false);
    };

    fetchInitial();

    const onLog      = (d) => { const seq = logSeqRef.current++; setLogs((p) => [{ ...d, _seq: seq }, ...p]); };
    const onProgress = (d) => {
      setSending(true);
      setProgress({ current: d?.current || 0, total: d?.total || 0 });
      if (d?.customer) setRowStatus((prev) => ({ ...prev, [d.customer]: { sending: true } }));
    };
    const onRow      = (d) => {
      if (!d?.customer) return;
      setRowStatus((prev) => ({ ...prev, [d.customer]: { ok: !!d.success, error: d.error || "", at: d.at || new Date().toISOString() } }));
    };
    const onDone     = (d) => {
      const results = Array.isArray(d?.results) ? d.results : [];
      const success = results.filter((r) => r.success).length;
      setRowStatus((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => { if (next[k].sending) delete next[k]; });
        results.forEach((r) => { next[r.customer] = { ...next[r.customer], ok: !!r.success, error: r.error || "" }; });
        return next;
      });
      setLastSendSummary({ total: d?.total || results.length, success, failed: results.length - success, cancelled: !!d?.cancelled });
      setProgress({ current: results.length, total: d?.total || results.length });
      setSending(false);
      setStopping(false);
      addLog(
        success === results.length && !d?.cancelled ? "success" : "warning",
        `${d?.cancelled ? "Dihentikan" : "Selesai"} - Berhasil: ${success}, Gagal: ${results.length - success}`
      );
    };
    const onError    = (d) => { setSending(false); setStopping(false); addLog("error", d?.error || "Pengiriman gagal"); };
    const onWaQr     = (d) => {
      if (d?.sessionId) setActiveWaSessionId(d.sessionId);
      setWaQr(d?.qr || ""); setWaQrAt(d?.time || null); setWhatsappReady(false); setWaInitializing(false);
      setQrOpen(true);
      if (!d?.isRefresh) { lastWhatsappLogRef.current = "wa-qr"; addLog("info", "QR diterima - silakan scan"); }
    };
    const onWaAuthenticated = (d) => {
      setWaQr(""); setWaInitializing(true); lastWhatsappLogRef.current = "wa-authenticated";
      addLog("info", "QR ter-scan, menyinkronkan WhatsApp...");
      window.setTimeout(() => { checkWhatsappStatus(false, d?.sessionId || ""); }, 1200);
    };
    const onWaDisconnected = (d) => {
      const loggedOut = !!d?.loggedOut;
      setWhatsappReady(false); setWaPopup(false); setWaQr("");
      // Not logged out = the server is already reconnecting on its own.
      setWaInitializing(!loggedOut);
      if (Array.isArray(d?.sessions)) setWaSessions(normalizeSessions(d.sessions));
      lastWhatsappLogRef.current = "wa-disconnected";
      setWaError({
        open: true,
        title: loggedOut ? "WhatsApp logout" : "WhatsApp terputus",
        message: d?.message || (loggedOut ? "Akun sudah logout. Scan QR lagi." : "Menyambungkan ulang..."),
        persist: loggedOut,
      });
    };
    const onWaReady = async (d) => {
      if (d?.sessionId) setActiveWaSessionId(d.sessionId);
      setPendingWaSessionId(""); setWhatsappReady(true); setWaQr(""); setWaInitializing(false);
      setQrOpen(false); setWaPopup(true); setWaError({ open: false, message: "" });
      lastWhatsappLogRef.current = "wa-ready";
      addLog("success", "WhatsApp siap digunakan");
      await checkWhatsappStatus(false, d?.sessionId || "");
    };

    if (socket?.on) {
      socket.on("send-log",          onLog);
      socket.on("pdf-wa-progress",   onProgress);
      socket.on("pdf-wa-row",        onRow);
      socket.on("pdf-wa-done",       onDone);
      socket.on("pdf-wa-error",      onError);
      socket.on("wa-qr",             onWaQr);
      socket.on("wa-authenticated",  onWaAuthenticated);
      socket.on("wa-ready",          onWaReady);
      socket.on("wa-disconnected",   onWaDisconnected);
    }
    return () => {
      if (socket?.off) {
        socket.off("send-log",         onLog);
        socket.off("pdf-wa-progress",  onProgress);
        socket.off("pdf-wa-row",       onRow);
        socket.off("pdf-wa-done",      onDone);
        socket.off("pdf-wa-error",     onError);
        socket.off("wa-qr",            onWaQr);
        socket.off("wa-authenticated", onWaAuthenticated);
        socket.off("wa-ready",         onWaReady);
        socket.off("wa-disconnected",  onWaDisconnected);
      }
    };
  }, []);

  // Keep checking while connected too (slower), as a fallback if the
  // "wa-disconnected" socket event is missed, e.g. while the socket reconnects.
  useEffect(() => {
    if (!whatsappReady && !waInitializing && !waQr) return;
    const timer = window.setInterval(() => checkWhatsappStatus(false, pendingWaSessionId || activeWaSessionId), whatsappReady ? 15000 : 5000);
    return () => window.clearInterval(timer);
  }, [whatsappReady, waInitializing, waQr, activeWaSessionId, pendingWaSessionId]);

  // Derived values
  const selectedWaSession = waSessions.find((s) => s.id === activeWaSessionId) || null;
  const waNumber   = waAccount.number || selectedWaSession?.lastKnownNumber || "";
  const waName     = waAccount.name   || selectedWaSession?.lastKnownName   || "";
  const waLabel    = whatsappReady ? "Terhubung" : waInitializing ? "Menyiapkan..." : "Belum login";
  const waTone     = whatsappReady ? "ok" : waInitializing ? "soon" : "none";

  const totalAmount  = rows.reduce((sum, r) => sum + r.amount, 0);
  const overdueRows  = rows.filter((r) => r.days !== null && r.days < 0);
  const soonRows     = rows.filter((r) => r.days !== null && r.days >= 0 && r.days <= 7);
  const noWaRows     = rows.filter((r) => !r.hasWa);
  const overdueAmt   = overdueRows.reduce((sum, r) => sum + r.amount, 0);
  const targets      = rows.filter((r) => r.hasWa && selected.has(r.nama));
  const targetAmount = targets.reduce((sum, r) => sum + r.amount, 0);
  const failedRows   = rows.filter((r) => r.hasWa && rowStatus[r.nama] && !rowStatus[r.nama].ok && !rowStatus[r.nama].sending);
  const sentCount    = rows.filter((r) => rowStatus[r.nama]?.ok).length;
  const failedCount  = failedRows.length;

  const isLuarKota   = (r) => (r.wilayah || "").trim().toLowerCase() === "luar kota";
  const isDalamKota  = (r) => (r.wilayah || "").trim().toLowerCase() === "dalam kota";
  const filterCounts = { all: rows.length, overdue: overdueRows.length, soon: soonRows.length, nowa: noWaRows.length, luar: rows.filter(isLuarKota).length, dalam: rows.filter(isDalamKota).length, failed: failedCount };
  const term = search.trim().toLowerCase();
  const visibleRows = rows.filter((r) => {
    if (filter === "overdue" && !(r.days !== null && r.days < 0)) return false;
    if (filter === "soon"    && !(r.days !== null && r.days >= 0 && r.days <= 7)) return false;
    if (filter === "nowa"    && r.hasWa) return false;
    if (filter === "luar"    && !isLuarKota(r)) return false;
    if (filter === "dalam"   && !isDalamKota(r)) return false;
    if (filter === "failed"  && !failedRows.includes(r)) return false;
    if (!term) return true;
    return (r.nama || "").toLowerCase().includes(term)
      || String(r.nomor || "").includes(term)
      || (r.wilayah || "").toLowerCase().includes(term);
  });
  if (sort.key !== "urgency" || sort.dir !== "asc") {
    const cmp = sort.key === "status" ? (a, b) => statusRank(a) - statusRank(b) : SORTERS[sort.key] || SORTERS.urgency;
    visibleRows.sort((a, b) => (sort.dir === "asc" ? cmp(a, b) : cmp(b, a)));
  }
  // Click cycles asc -> desc -> back to the default urgency order.
  const toggleSort = (key) => {
    setSort((prev) => (prev.key === key
      ? (prev.dir === "asc" ? { key, dir: "desc" } : { key: "urgency", dir: "asc" })
      : { key, dir: "asc" }));
  };

  const noPdfTargets  = targets.filter((r) => !r.pdf).length;
  const resendTargets = targets.filter((r) => rowStatus[r.nama]?.ok).length;
  const previewRow    = previewName ? rows.find((r) => r.nama === previewName) || null : null;

  // Click anywhere on a row to select it; the row's own controls keep their behaviour.
  const handleRowClick = (e, r) => {
    if (!r.hasWa || sending) return;
    if (e.target.closest("button, a, input, label")) return;
    toggleRow(r.nama);
  };

  const selectableVisible = visibleRows.filter((r) => r.hasWa);
  const allVisibleSelected = selectableVisible.length > 0 && selectableVisible.every((r) => selected.has(r.nama));

  const toggleAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      selectableVisible.forEach((r) => { if (allVisibleSelected) next.delete(r.nama); else next.add(r.nama); });
      return next;
    });
  };

  const retryFailed = () => {
    setSelected(new Set(failedRows.map((r) => r.nama)));
    setFilter("failed");
    setConfirmOpen(true);
  };

  function statusOf(r) {
    const st = rowStatus[r.nama];
    if (!r.hasWa) return { tone: "muted", label: "Tanpa nomor", rank: 4 };
    if (st?.sending) return { tone: "warn", label: "Mengirim...", rank: 1 };
    if (st) return st.ok
      ? { tone: "ok", label: "Terkirim", at: st.at, rank: 3 }
      : { tone: "danger", label: "Gagal", at: st.at, error: st.error, rank: 0 };
    return { tone: "idle", label: "Belum dikirim", rank: 2 };
  }
  function statusRank(r) { return statusOf(r).rank; }

  const exportReport = () => {
    const header = ["Pelanggan", "Wilayah", "No. WhatsApp", "Tagihan", "Jatuh tempo", "Status", "Keterangan"];
    const body = visibleRows.map((r) => [r.nama, r.wilayah, r.nomor, r.total, r.tempo, statusOf(r).label, rowStatus[r.nama]?.error || ""]);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`laporan-tagihan-${stamp}.csv`, [header, ...body]);
  };

  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  let sendHint = "";
  if (sending)                  sendHint = "Pengiriman sedang berjalan...";
  else if (!whatsappReady)      sendHint = "Hubungkan WhatsApp terlebih dahulu.";
  else if (!rows.length)        sendHint = "Belum ada data penagihan. Generate PDF dulu.";
  else if (!targets.length)     sendHint = "Pilih minimal satu pelanggan yang punya nomor WhatsApp.";
  const sendDisabled = !!sendHint;

  // --- Render ---
  return (
    <div className="bd-page dashboard-scrollbar-none">

      {headerSlot && createPortal(
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: "rgba(255,255,255,0.85)", fontFamily: F.sans, fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: whatsappReady ? "#4ade80" : waInitializing ? "#fbbf24" : "rgba(255,255,255,0.4)" }} />
            <span>WhatsApp: {whatsappReady ? (formatPhone(waNumber) || "terhubung") : waInitializing ? "menyiapkan..." : "belum terhubung"}</span>
          </div>
          {sending && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8, paddingLeft: 12, borderLeft: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontFamily: F.sans, fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap" }}>
              <SendRoundedIcon style={{ fontSize: 14 }} />
              Mengirim {progress.current}/{progress.total}
            </div>
          )}
        </div>,
        headerSlot
      )}

      {/* Summary */}
      <section className="bd-stats">
        <Stat label="Total tagihan" value={rupiah(totalAmount)} sub={`${rows.length} pelanggan`} />
        <Stat
          label="Lewat jatuh tempo"
          value={overdueRows.length}
          tone={overdueRows.length ? "danger" : undefined}
          sub={overdueRows.length ? rupiah(overdueAmt) : `${soonRows.length} jatuh tempo dalam 7 hari`}
        />
        <Stat
          label="Siap dikirim"
          value={targets.length}
          sub={noWaRows.length ? `${noWaRows.length} tanpa nomor WhatsApp` : rupiah(targetAmount)}
        />
        <Stat
          label="Terkirim"
          value={sentCount || failedCount ? `${sentCount}/${rows.length - noWaRows.length}` : "–"}
          tone={failedCount ? "warn" : undefined}
          sub={sentCount || failedCount ? (failedCount ? `${failedCount} gagal` : "Tidak ada yang gagal") : "Belum ada pengiriman"}
        />
      </section>

      <div className="bd-grid">

        {/* Billing list */}
        <section className="bd-panel bd-panel--fill">
          <header className="bd-panel__head">
            <div className="bd-panel__title">
              <h2>Tagihan <span className="bd-count">{rows.length}</span></h2>
              {generatedAt && <small className="bd-updated">Data PDF per {formatSyncTime(generatedAt)}</small>}
            </div>
            <div className="bd-head-actions">
              {rows.length > 0 && (
                <label className="bd-search">
                  <SearchRoundedIcon style={{ fontSize: 16 }} />
                  <input
                    type="text"
                    placeholder="Cari pelanggan atau nomor"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
              )}
              <button
                type="button"
                className="bd-btn bd-btn--icon"
                onClick={() => loadBilling(true)}
                disabled={loadingRows || sending}
                title="Muat ulang data tagihan"
                aria-label="Muat ulang data tagihan"
              >
                <RefreshRoundedIcon style={{ fontSize: 18 }} className={loadingRows ? "bd-spin-icon" : ""} />
              </button>
              <button type="button" className="bd-btn" onClick={() => navigate("/pdf")}>
                Generate PDF
              </button>
            </div>
          </header>

          {rows.length > 0 && (
            <nav className="bd-tabs" aria-label="Filter tagihan">
              {FILTERS.filter((f) => f.id !== "failed" || failedCount > 0).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`bd-tab${filter === f.id ? " active" : ""}`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                  <span>{filterCounts[f.id]}</span>
                </button>
              ))}
            </nav>
          )}

          {rows.length === 0 ? (
            <div className="bd-empty">
              <h3>{loadingRows ? "Memuat data..." : "Belum ada data tagihan"}</h3>
              <p>Data muncul di sini setelah PDF tagihan per pelanggan dibuat.</p>
              {!loadingRows && (
                <button type="button" className="bd-btn bd-btn--primary" onClick={() => navigate("/pdf")}>
                  Buat PDF Tagihan
                </button>
              )}
            </div>
          ) : visibleRows.length === 0 ? (
            <div className="bd-empty">
              <h3>Tidak ada hasil</h3>
              <p>Coba kata kunci atau filter lain.</p>
            </div>
          ) : (
            <div className="bd-tablewrap dashboard-scrollbar-none">
              <table className="bd-table">
                <thead>
                  <tr>
                    <th className="chk">
                      <input
                        type="checkbox"
                        aria-label="Pilih semua yang tampil"
                        checked={allVisibleSelected}
                        disabled={!selectableVisible.length || sending}
                        onChange={toggleAllVisible}
                      />
                    </th>
                    <SortHeader label="Pelanggan"   sortKey="nama"   sort={sort} onSort={toggleSort} />
                    <SortHeader label="Tagihan"     sortKey="amount" sort={sort} onSort={toggleSort} className="num" />
                    <SortHeader label="Jatuh tempo" sortKey="due"    sort={sort} onSort={toggleSort} />
                    <th className="bd-hide-md">WhatsApp</th>
                    <SortHeader label="Status"      sortKey="status" sort={sort} onSort={toggleSort} />
                    <th className="act">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((r) => {
                    const due = dueInfo(r.days);
                    const status = statusOf(r);
                    return (
                      <tr
                        key={r.nama}
                        className={`${!r.hasWa ? "is-off" : selected.has(r.nama) ? "is-selected" : ""}${r.hasWa && !sending ? " is-clickable" : ""}`}
                        onClick={(e) => handleRowClick(e, r)}
                      >
                        <td className="chk">
                          <input
                            type="checkbox"
                            aria-label={`Pilih ${r.nama}`}
                            checked={r.hasWa && selected.has(r.nama)}
                            disabled={!r.hasWa || sending}
                            onChange={() => toggleRow(r.nama)}
                          />
                        </td>
                        <td>
                          <div className="bd-cust">
                            <strong title={r.nama}>{r.nama || "-"}</strong>
                            {r.wilayah && r.wilayah !== "CEK" ? <small>{r.wilayah}</small> : null}
                          </div>
                        </td>
                        <td className="num bd-amount">{r.total || rupiah(r.amount)}</td>
                        <td>
                          <div className="bd-due">
                            <span className="bd-due__date">{formatTanggal(r.due) || r.tempo || "-"}</span>
                            <small className={`bd-due__note bd-due__note--${due.tone}`}>{due.label}</small>
                          </div>
                        </td>
                        <td className="bd-hide-md bd-phone">{r.hasWa ? formatPhone(r.nomor) : "-"}</td>
                        <td>
                          <div className="bd-statuscell">
                            <span className={`bd-status bd-status--${status.tone}`}>{status.label}</span>
                            {status.error
                              ? <small className="bd-statuscell__error" title={status.error}>{status.error}</small>
                              : status.at ? <small className="bd-statuscell__time">{formatJam(status.at)}</small> : null}
                          </div>
                        </td>
                        <td className="act">
                          <div className="bd-rowacts">
                            <button type="button" className="bd-btn bd-btn--icon bd-btn--sm" title="Lihat pesan" aria-label={`Lihat pesan untuk ${r.nama}`} onClick={() => setPreviewName(r.nama)}>
                              <VisibilityRoundedIcon style={{ fontSize: 15 }} />
                            </button>
                            {r.driveUrl && (
                              <a className="bd-btn bd-btn--icon bd-btn--sm" href={r.driveUrl} target="_blank" rel="noopener noreferrer" title="Buka di Google Drive" aria-label={`Google Drive ${r.nama}`}>
                                <CloudDoneRoundedIcon style={{ fontSize: 15 }} />
                              </a>
                            )}
                            {r.pdf ? (
                              <button type="button" className="bd-btn bd-btn--icon bd-btn--sm" title="Buka PDF" aria-label={`Buka PDF ${r.nama}`} onClick={() => handleOpenPdf(r.pdf)}>
                                <PictureAsPdfRoundedIcon style={{ fontSize: 15 }} />
                              </button>
                            ) : (
                              <span className="bd-nopdf" title="PDF belum dibuat, hanya pesan teks yang dikirim">
                                <WarningAmberRoundedIcon style={{ fontSize: 13 }} /> Tanpa PDF
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {rows.length > 0 && (
            <div className="bd-foot">
              <span>
                {targets.length} dari {rows.length} dipilih
              </span>
              <span className="bd-foot__right">
                <span>Total dipilih <strong>{rupiah(targetAmount)}</strong></span>
                <button type="button" className="bd-link" onClick={exportReport} disabled={!visibleRows.length}>Ekspor CSV</button>
              </span>
            </div>
          )}
        </section>

        {/* Right column */}
        <aside className="bd-side">

          <Portlet
            title="Akun WhatsApp"
            actions={<span className={`bd-status bd-status--${whatsappReady ? "ok" : waInitializing ? "warn" : "idle"}`}>{waLabel}</span>}
          >
            <div className="ns-form">
              <label className="ns-form__label">Akun pengirim</label>
              <SessionDropdown
                sessions={waSessions}
                value={activeWaSessionId}
                onChange={handleSelectWhatsappSession}
                disabled={waSessions.length === 0 || sending}
              />
              {!whatsappReady && (
                waQr ? (
                  <button type="button" className="bd-btn bd-btn--block" onClick={() => setQrOpen(true)}>
                    <QrCode2RoundedIcon style={{ fontSize: 16 }} />
                    Tampilkan QR
                  </button>
                ) : (
                  <button type="button" className="bd-btn bd-btn--primary bd-btn--block" onClick={handleInitWhatsapp} disabled={waInitializing}>
                    {waInitializing ? "Menyiapkan..." : "Hubungkan WhatsApp"}
                  </button>
                )
              )}
              <div className="ns-links">
                <button type="button" className="ns-link" onClick={handleAddWhatsappAccount} disabled={sending}>Tambah akun</button>
                <span aria-hidden="true">|</span>
                <button type="button" className="ns-link" onClick={handleOpenWaBrowser} disabled={!activeWaSessionId || openingWaBrowser}>
                  {openingWaBrowser ? "Membuka..." : "Buka WhatsApp"}
                </button>
                <span aria-hidden="true">|</span>
                <button type="button" className="ns-link ns-link--danger" onClick={handleDeleteWhatsappSession} disabled={!activeWaSessionId || sending}>Hapus</button>
              </div>
            </div>
          </Portlet>

          <Portlet title="Ringkasan Kiriman">
            <table className="ns-kv">
              <tbody>
                <tr><th>Pelanggan dipilih</th><td>{targets.length}</td></tr>
                <tr><th>Total tagihan</th><td>{rupiah(targetAmount)}</td></tr>
                <tr><th>Dikirim dari</th><td>{waName || formatPhone(waNumber) || "-"}</td></tr>
                <tr><th>Jeda antar pesan</th><td>2–4 detik</td></tr>
              </tbody>
            </table>
            <div className="ns-actions">
              {(sending || progress.total > 0) && (
                <div className="bd-progress">
                  <div className="bd-progress__top">
                    <span>{sending ? "Mengirim..." : lastSendSummary?.cancelled ? "Dihentikan" : "Selesai"}</span>
                    <span>{progress.total > 0 ? `${progress.current}/${progress.total}` : ""}</span>
                  </div>
                  <LinearProgress
                    variant={sending && progress.total === 0 ? "indeterminate" : "determinate"}
                    value={percent}
                    sx={{ height: 4, borderRadius: 999, bgcolor: "#e3e6eb", "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: "#24476e" } }}
                  />
                </div>
              )}
              {sending ? (
                <button type="button" className="bd-btn bd-btn--lg bd-btn--block bd-btn--stop" onClick={handleStop} disabled={stopping}>
                  {stopping ? "Menghentikan..." : "Hentikan pengiriman"}
                </button>
              ) : (
                <button type="button" className="bd-btn bd-btn--primary bd-btn--lg bd-btn--block" disabled={sendDisabled} onClick={() => setConfirmOpen(true)}>
                  Kirim tagihan ({targets.length})
                </button>
              )}
              {!sending && failedCount > 0 && whatsappReady && (
                <button type="button" className="bd-btn bd-btn--block" onClick={retryFailed}>
                  Kirim ulang yang gagal ({failedCount})
                </button>
              )}
              {(sending || sendHint) && (
                <p className="bd-hint">{sending ? "Pesan yang sedang dikirim tetap diselesaikan sebelum berhenti." : sendHint}</p>
              )}
            </div>
          </Portlet>

          <Portlet
            title="Aktivitas"
            fill
            actions={logs.length > 0 ? <button type="button" className="ns-link" onClick={() => setLogs([])}>Bersihkan</button> : null}
          >
            <div className="bd-logbox dashboard-scrollbar-none">
              {logs.length ? <LogsPanel logs={logs} /> : <p className="bd-muted-note">Belum ada aktivitas.</p>}
            </div>
          </Portlet>

        </aside>
      </div>

      <ConfirmSendPopup
        open={confirmOpen}
        count={targets.length}
        amount={targetAmount}
        account={[waName, waNumber].filter(Boolean).join(" · ")}
        noPdfCount={noPdfTargets}
        resendCount={resendTargets}
        onConfirm={handleSend}
        onCancel={() => setConfirmOpen(false)}
      />

      <PreviewPopup
        row={previewRow}
        message={buildMessage(template, previewRow)}
        status={previewRow ? statusOf(previewRow) : {}}
        selected={previewRow ? selected.has(previewRow.nama) : false}
        canSelect={!!previewRow?.hasWa && !sending}
        onToggle={() => previewRow && toggleRow(previewRow.nama)}
        onOpenPdf={handleOpenPdf}
        onClose={() => setPreviewName(null)}
      />

      <div className="bd-toasts">
        <Toast
          open={waPopup}
          tone="ok"
          title="WhatsApp terhubung"
          message={[waName, formatPhone(waNumber)].filter(Boolean).join(" · ") || "Siap mengirim tagihan."}
          autoHide={3500}
          onClose={() => setWaPopup(false)}
        />
        <Toast
          open={waInitializing && !whatsappReady && !waPopup && !waQr}
          tone="loading"
          title="Menyiapkan WhatsApp..."
          message="QR akan muncul sebentar lagi."
        />
        <Toast
          open={waError.open}
          tone="error"
          title={waError.title || "Koneksi gagal"}
          message={waError.message}
          autoHide={waError.persist ? 0 : 6000}
          onClose={() => setWaError({ open: false, message: "" })}
        />
      </div>

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
