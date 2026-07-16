import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  Snackbar,
  Tooltip,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import RoomRoundedIcon from "@mui/icons-material/RoomRounded";
import api from "../services/api";
import CreateButton from "../components/button/CreateButton";

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

const CELL_FIELD_LABELS = {
  nama: "Nama / Customer",
  phone: "No HP",
  wilayah: "Wilayah",
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

function getInitials(name) {
  if (!name) return "?";
  return String(name).trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("") || "?";
}

/* Floating cell editor — gaya sama persis dengan CellPopupEditor di PdfPage */
function CellPopupEditor({ rect, value, label, onClose, onChange, onKeyDown }) {
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
            type="text"
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
          <div style={{ padding: "16px 16px 14px", background: "linear-gradient(180deg, rgba(24,43,88,1) 0%, rgba(27,55,112,0.96) 100%)", borderBottom: "1px solid rgba(26,42,87,0.10)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.28)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <DeleteForeverRoundedIcon style={{ fontSize: 20, color: "#f87171" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, color: "rgba(233,196,106,0.92)", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 3px" }}>Master Data</p>
              <h3 style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.2 }}>Hapus Baris</h3>
            </div>
          </div>
          <div style={{ padding: "14px 16px", background: "#fff" }}>
            <p style={{ fontFamily: FONT_SANS, fontSize: 12.5, color: T.text, margin: "0 0 4px", lineHeight: 1.6 }}>
              Hapus baris <strong style={{ color: T.ink }}>{label}</strong>?
            </p>
            <p style={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.muted, margin: 0, lineHeight: 1.5 }}>
              Data akan dihapus permanen dan tidak bisa dikembalikan.
            </p>
          </div>
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
  const [cellRect, setCellRect]       = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, idx: -1, label: "" });
  const [toast, setToast]             = useState({ open: false, message: "", severity: "success" });
  const [headerSlot, setHeaderSlot]   = useState(null);

  const dataRef      = useRef([]);
  const activeCellRef = useRef(null);
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

  const handlePopupChange = (value) => {
    if (!editingCell) return;
    setData((prev) => {
      const next = prev.map((r, i) => i === editingCell.row ? { ...r, [editingCell.key]: value } : r);
      dataRef.current = next;
      return next;
    });
  };

  const commitCellEdit = () => {
    setEditingCell(null); setCellRect(null);
    autoSave(dataRef.current);
  };

  const cancelCellEdit = () => {
    if (editingCell) {
      setData((prev) => {
        const next = prev.map((r, i) => i === editingCell.row ? { ...r, [editingCell.key]: editingCell.orig } : r);
        dataRef.current = next;
        return next;
      });
    }
    setEditingCell(null); setCellRect(null);
  };

  const handleCellPopupKey = (e) => {
    if (e.key === "Enter") { e.preventDefault(); commitCellEdit(); }
    else if (e.key === "Escape") { cancelCellEdit(); }
  };

  useEffect(() => {
    if (!editingCell) { setCellRect(null); return; }
    requestAnimationFrame(() => {
      if (activeCellRef.current) {
        const r = activeCellRef.current.getBoundingClientRect();
        setCellRect({ top: r.top, bottom: r.bottom, left: r.left, width: r.width });
      }
    });
  }, [editingCell]);

  const addRow = () => {
    const newRows = [...dataRef.current, { nama: "", phone: "", wilayah: "" }];
    dataRef.current = newRows;
    setData(newRows);
    autoSave(newRows);
    const newIdx = newRows.length - 1;
    setWilayahFilter("all"); setSearchQuery("");
    setPage(Math.floor(newIdx / rowsPerPage));
  };

  const deleteRow = (idx) => {
    const newRows = dataRef.current.filter((_, i) => i !== idx);
    dataRef.current = newRows;
    setData(newRows);
    autoSave(newRows);
    if (editingCell?.row === idx) { setEditingCell(null); setCellRect(null); }
  };

  const requestDeleteRow = (idx) => {
    const label = dataRef.current[idx]?.nama || `#${idx + 1}`;
    setDeleteConfirm({ open: true, idx, label });
  };

  const confirmDeleteRow = () => {
    const { idx } = deleteConfirm;
    setDeleteConfirm({ open: false, idx: -1, label: "" });
    if (idx >= 0) deleteRow(idx);
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

      <section className="dashboard-panel" style={{ flex: 1, minHeight: 0, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", borderRadius: 28 }}>

        {/* Card Header */}
        <div className="dashboard-panel__header" style={{ padding: "18px 24px 12px", borderBottom: "none", background: T.white, flexShrink: 0, margin: 0 }}>
          <div>
            <p className="dashboard-panel__eyebrow" style={{ fontFamily: FONT_SANS, marginBottom: 2 }}>Master Data</p>
            <h2 className="dashboard-panel__title" style={{ margin: 0 }}>Master Data</h2>
            {data.length > 0 && (
              <p className="dashboard-panel__description" style={{ margin: "3px 0 0", fontFamily: FONT_MONO }}>
                {data.length} customer
                {wilayahFilter !== "all" && <span style={{ color: T.brand }}> · {wilayahFilter}</span>}
                {searchQuery.trim() && <span style={{ color: T.brand }}> · search aktif</span>}
                {saveState === "saving" && <span style={{ color: T.muted, fontStyle: "italic" }}> · menyimpan…</span>}
                {saveState === "saved" && <span style={{ color: "#16a34a" }}> · tersimpan</span>}
              </p>
            )}
          </div>
          <div className="dashboard-panel__action" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
            <WilayahDropdown options={wilayahOptions} value={wilayahFilter} onChange={(next) => { setWilayahFilter(next); setPage(0); }} />
            <Tooltip title="Tambah baris baru">
              <IconButton size="small" onClick={addRow} disabled={loading}
                sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: T.brandLight, color: T.brand, border: `1.5px solid ${T.brandBorder}`, "&:hover": { bgcolor: T.brandBorder } }}>
                <AddRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </div>
        </div>

        {!loading && data.length === 0 && (
          <div style={{ padding: "0 20px 10px", flexShrink: 0 }}>
            <Alert severity="info" sx={{ fontFamily: FONT_SANS, fontSize: 12, py: 0.25, borderRadius: "10px" }}>
              Belum ada data — sync dari Google Sheet atau tambah manual terlebih dahulu
            </Alert>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CircularProgress size={28} sx={{ color: T.brand }} />
          </Box>
        ) : (
          <div className="users-table-wrapper" style={{ flex: 1, minHeight: 0, margin: "0 16px", overflowX: "hidden", overflowY: "auto" }}>
            <table className="users-table" style={{ fontFamily: FONT_SANS, width: "100%", minWidth: 0, tableLayout: "fixed" }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                <tr>
                  {["Nama / Customer", "No HP", "Wilayah", ""].map((h, i) => (
                    <th key={i} style={{ color: T.brandDark, fontSize: 10.5, fontWeight: 700, padding: h === "" ? "10px 8px" : "10px 14px", textAlign: h === "" ? "center" : "left", whiteSpace: "nowrap", width: h === "" ? 48 : undefined, userSelect: "none", background: T.surface, textTransform: "none", letterSpacing: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "48px 20px", textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                        <StorageRoundedIcon style={{ fontSize: 32, color: T.subtle }} />
                        <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: T.muted, fontWeight: 600 }}>Belum ada data</span>
                        <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: T.subtle }}>Klik "Sync Sheet" untuk memuat dari Google Sheet, atau klik "+" untuk tambah manual</span>
                      </div>
                    </td>
                  </tr>
                ) : paged.map(({ row, idx: globalIdx }, i) => {
                  const isCell = (k) => editingCell?.row === globalIdx && editingCell?.key === k;
                  const cellBtn = (k, displayNode) => {
                    const active = isCell(k);
                    return (
                      <button
                        ref={active ? activeCellRef : null}
                        type="button"
                        onClick={() => handleCellClick(globalIdx, k)}
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
                    <tr key={globalIdx} className="users-table__row users-table__row--interactive" style={{ background: i % 2 !== 0 ? T.surface : T.white }}>
                      <td style={{ padding: "4px 8px", minWidth: 0, overflow: "hidden" }}>
                        {cellBtn("nama", (
                          <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                            <span className="users-table__avatar" style={{ width: 30, height: 30, fontFamily: FONT_SANS, fontSize: 9.5, letterSpacing: "0.04em", flexShrink: 0 }}>{getInitials(row.nama)}</span>
                            <span style={{ fontWeight: 600, color: T.ink, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.nama || <span style={{ color: T.subtle, fontStyle: "italic", fontWeight: 400 }}>—</span>}</span>
                          </div>
                        ))}
                      </td>
                      <td style={{ padding: "4px 8px", minWidth: 0, overflow: "hidden" }}>
                        {cellBtn("phone", <span style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: T.text, fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.phone || <span style={{ color: T.subtle, fontStyle: "italic", fontFamily: FONT_SANS, fontWeight: 400 }}>—</span>}</span>)}
                      </td>
                      <td style={{ padding: "4px 8px", minWidth: 0, overflow: "hidden" }}>
                        {cellBtn("wilayah", row.wilayah ? (
                          <span className={`users-table__status users-table__status--inline ${/dalam/i.test(row.wilayah) ? "users-table__status--active" : /luar/i.test(row.wilayah) ? "users-table__status--pending" : "users-table__status--app"}`}>
                            {row.wilayah}
                          </span>
                        ) : <span style={{ color: T.subtle, fontStyle: "italic", fontWeight: 400, fontSize: 12 }}>—</span>)}
                      </td>
                      <td style={{ padding: "4px 8px", textAlign: "center", width: 44 }}>
                        <button onClick={() => requestDeleteRow(globalIdx)}
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
        )}

        {/* Pagination */}
        {!loading && filteredWithIdx.length > 0 && (
          <div className="users-table-pagination" style={{ padding: "9px 22px 8px", borderTop: `1px solid ${T.line}`, marginTop: 0 }}>
            <div className="users-table-pagination__meta" style={{ gap: 10 }}>
              <p className="users-table-pagination__summary" style={{ fontSize: 11.5, lineHeight: 1.35 }}>
                {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filteredWithIdx.length)} of{" "}
                <strong>{filteredWithIdx.length}</strong> rows
                {wilayahFilter !== "all" && <span style={{ marginLeft: 6, color: T.brand, fontWeight: 600 }}>· {wilayahFilter}</span>}
                {searchQuery.trim() && <span style={{ marginLeft: 6, color: T.brand, fontWeight: 600 }}>· search aktif</span>}
                {saveState === "saving" && <span style={{ marginLeft: 6, color: T.muted, fontStyle: "italic" }}>· menyimpan…</span>}
                {saveState === "saved" && <span style={{ marginLeft: 6, color: "#16a34a", fontWeight: 600 }}>· tersimpan</span>}
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

      {editingCell && (
        <CellPopupEditor
          rect={cellRect}
          value={String(data[editingCell.row]?.[editingCell.key] ?? "")}
          label={CELL_FIELD_LABELS[editingCell.key] || editingCell.key}
          onClose={commitCellEdit}
          onChange={handlePopupChange}
          onKeyDown={handleCellPopupKey}
        />
      )}

      <DeleteConfirmPopup
        open={deleteConfirm.open}
        label={deleteConfirm.label}
        onConfirm={confirmDeleteRow}
        onCancel={() => setDeleteConfirm({ open: false, idx: -1, label: "" })}
      />

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={toast.severity} variant="filled" sx={{ borderRadius: "10px", fontFamily: FONT_SANS }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
