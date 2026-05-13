import { useEffect, useRef, useState } from "react";
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
  MenuItem,
  Select,
  Snackbar,
  Switch,
  TextField,
  Tooltip,
  Typography,
  Button,
} from "@mui/material";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import CloudDoneRoundedIcon from "@mui/icons-material/CloudDoneRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import api from "../services/api";
import socket from "../services/socket";

const FONT_SANS = "'Plus Jakarta Sans', 'Inter', sans-serif";
const FONT_MONO = "'JetBrains Mono', 'Fira Code', monospace";

const T = {
  brand: "#1a4ba8",
  brandDark: "#0f2460",
  brandLight: "#eef2fc",
  brandBorder: "#c5d0e8",
  green: "#0c4232",
  ink: "#0f2460",
  text: "#374151",
  muted: "#6b7280",
  subtle: "#9ca3af",
  line: "#e5e7eb",
  surface: "#f9fafb",
  white: "#ffffff",
  red: "#dc2626",
  redBg: "#fef2f2",
};

function extractDriveFolderId(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const match = raw.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : raw;
}

function formatCurrency(v) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);
}

function Panel({ children, sx = {} }) {
  return (
    <Box
      sx={{
        bgcolor: T.white,
        borderRadius: "14px",
        border: `1px solid ${T.line}`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        overflow: "hidden",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

function SectionTitle({ children, icon, color = T.brand, action }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        px: 2.5,
        py: 1.75,
        borderBottom: `1px solid ${T.line}`,
        bgcolor: `${color}06`,
      }}
    >
      <Box sx={{ width: 4, height: 18, borderRadius: "3px", bgcolor: color, flexShrink: 0 }} />
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: "8px",
          bgcolor: `${color}14`,
          display: "grid",
          placeItems: "center",
          "& svg": { fontSize: 15, color },
        }}
      >
        {icon}
      </Box>
      <Typography sx={{ fontFamily: FONT_SANS, fontSize: 13.5, fontWeight: 600, color: T.ink, flexGrow: 1 }}>
        {children}
      </Typography>
      {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
    </Box>
  );
}

function Btn({ children, onClick, disabled, loading, color = "brand", variant = "solid", startIcon, sx = {} }) {
  const solidMap = {
    brand: { bg: T.brand, hover: T.brandDark, text: "#fff" },
    green: { bg: T.green, hover: "#0a3228", text: "#fff" },
    red: { bg: T.red, hover: "#b91c1c", text: "#fff" },
  };
  const s = solidMap[color] || solidMap.brand;

  if (variant === "outline") {
    return (
      <Button
        onClick={onClick}
        disabled={disabled}
        startIcon={loading ? <CircularProgress size={13} color="inherit" /> : startIcon}
        sx={{
          height: 36,
          px: 2,
          borderRadius: "8px",
          fontFamily: FONT_SANS,
          fontSize: 13,
          fontWeight: 500,
          textTransform: "none",
          color: T.text,
          bgcolor: T.white,
          border: `1px solid ${T.line}`,
          boxShadow: "none",
          "&:hover": { bgcolor: T.surface, boxShadow: "none" },
          "&:disabled": { opacity: 0.4 },
          ...sx,
        }}
      >
        {children}
      </Button>
    );
  }

  return (
    <Button
      variant="contained"
      onClick={onClick}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={13} color="inherit" /> : startIcon}
      sx={{
        height: 36,
        px: 2.25,
        borderRadius: "8px",
        fontFamily: FONT_SANS,
        fontSize: 13,
        fontWeight: 600,
        textTransform: "none",
        bgcolor: s.bg,
        color: s.text,
        boxShadow: "none",
        "&:hover": { bgcolor: s.hover, boxShadow: "none" },
        "&:disabled": { bgcolor: T.line, color: T.subtle, boxShadow: "none" },
        ...sx,
      }}
    >
      {children}
    </Button>
  );
}

const editInputSx = {
  width: "100%",
  minHeight: 28,
  border: `1.5px solid ${T.brandBorder}`,
  borderRadius: "7px",
  px: "8px",
  py: "4px",
  fontFamily: FONT_SANS,
  fontSize: 12,
  outline: "none",
  bgcolor: T.white,
  color: T.ink,
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  "&:focus": {
    borderColor: T.brand,
    boxShadow: `0 0 0 3px ${T.brand}14`,
  },
};

export default function PdfPage() {
  const [rows, setRows] = useState([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: "", ptName: "" });
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
  const [editingCell, setEditingCell] = useState(null);
  const [driveConfig, setDriveConfig] = useState({ folderId: "", enabled: false, scriptUrl: "" });
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveConfigOpen, setDriveConfigOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [resettingProgress, setResettingProgress] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage] = useState(0);
  const [penagihFilter, setPenagihFilter] = useState("all");
  const [logoUrl, setLogoUrl] = useState(null);

  const rowsRef = useRef([]);
  const driveReady = !!driveConfig.enabled && !!driveConfig.scriptUrl && !!driveConfig.folderId;
  const hasProgressState = !!progress.status || progress.current > 0 || progress.total > 0;
  const penagihOptions = Array.from(
    new Set(
      rows
        .map((row) => String(row.penagih || "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, "id"));
  const filteredRows = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => {
      if (penagihFilter === "all") return true;
      return String(row.penagih || "").trim() === penagihFilter;
    });
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const pagedRows = filteredRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const showToast = (message, severity = "success") => setToast({ open: true, message, severity });

  const loadInitial = async () => {
    try {
      const [statusRes, tmpRes, driveRes, logoRes] = await Promise.allSettled([
        api.get("/pdf/status"),
        api.get("/pdf/temporary"),
        api.get("/pdf/drive-config"),
        api.get("/pdf/logo"),
      ]);

      if (statusRes.status === "fulfilled") {
        const d = statusRes.value?.data || {};
        setGenerating(!!d.progress?.running);
        setProgress({
          current: d.progress?.current || 0,
          total: d.progress?.total || 0,
          status: d.progress?.status || "",
          ptName: d.progress?.ptName || "",
        });
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

      if (logoRes.status === "fulfilled") {
        setLogoUrl(logoRes.value?.data?.dataUrl || null);
      }
    } catch {
      // intentional
    }
  };

  useEffect(() => {
    loadInitial();

    const onPdfProgress = (d) => {
      setGenerating(!!d.running);
      setProgress({
        current: d.current || 0,
        total: d.total || 0,
        status: d.status || "",
        ptName: d.ptName || "",
      });
      if (!d.running) setCancelling(false);
    };

    const onPdfDone = () => {
      setGenerating(false);
      setCancelling(false);
      showToast("Semua PDF berhasil dibuat!", "success");
    };

    const onPdfError = (d) => {
      setGenerating(false);
      setCancelling(false);
      showToast(d?.error || "Generate PDF gagal", "error");
    };

    const onPdfCancelled = (d) => {
      setGenerating(false);
      setCancelling(false);
      showToast(d?.message || "Generate PDF dibatalkan", "warning");
    };

    if (socket?.on) {
      socket.on("pdf-progress", onPdfProgress);
      socket.on("pdf-done", onPdfDone);
      socket.on("pdf-error", onPdfError);
      socket.on("pdf-cancelled", onPdfCancelled);
    }

    return () => {
      if (socket?.off) {
        socket.off("pdf-progress", onPdfProgress);
        socket.off("pdf-done", onPdfDone);
        socket.off("pdf-error", onPdfError);
        socket.off("pdf-cancelled", onPdfCancelled);
      }
    };
  }, []);

  const handleGenerate = async () => {
    if (!rows.length) {
      showToast("Belum ada data PDF yang siap diproses", "warning");
      return;
    }

    if (driveConfig.enabled && !driveReady) {
      showToast("Google Drive aktif tapi konfigurasi belum lengkap. Isi Apps Script URL dan Folder ID dulu.", "warning");
      return;
    }

    setGenerating(true);
    setProgress({ current: 0, total: customerCount, status: "Memulai...", ptName: "" });
    try {
      await api.post("/pdf/generate-per-pt");
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
    } catch (err) {
      setCancelling(false);
      showToast(err?.response?.data?.message || "Gagal membatalkan generate PDF", "error");
    }
  };

  const handleResetProgress = async () => {
    setResettingProgress(true);
    try {
      const res = await api.post("/pdf/reset-progress");
      const p = res?.data?.progress || {};
      setGenerating(false);
      setCancelling(false);
      setProgress({
        current: p.current || 0,
        total: p.total || 0,
        status: p.status || "",
        ptName: p.ptName || "",
      });
      showToast(res?.data?.message || "Status generate PDF berhasil direset", "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Gagal reset status generate PDF", "error");
    } finally {
      setResettingProgress(false);
    }
  };

  const handleCellClick = (rowIdx, field) => {
    if (editingCell?.row === rowIdx && editingCell?.field === field) return;
    setEditingCell({ row: rowIdx, field, orig: rows[rowIdx]?.[field] });
  };

  const handleCellChange = (rowIdx, field, value) => {
    setRows((prev) => prev.map((r, i) => (i === rowIdx ? { ...r, [field]: value } : r)));
  };

  const handleCellBlur = async () => {
    setEditingCell(null);
    setCustomerCount(new Set(rowsRef.current.map((r) => r.customer).filter(Boolean)).size);
    try {
      await api.put("/pdf/temporary/rows", { rows: rowsRef.current });
    } catch {
      showToast("Gagal simpan ke server", "error");
    }
  };

  const handleCellKey = (e, rowIdx) => {
    if (e.key === "Enter") {
      e.target.blur();
    } else if (e.key === "Escape") {
      if (editingCell) {
        setRows((prev) =>
          prev.map((r, i) => (i === rowIdx ? { ...r, [editingCell.field]: editingCell.orig } : r))
        );
      }
      setEditingCell(null);
    }
  };

  const deleteRow = async (idx) => {
    const absoluteIdx = idx;
    const newRows = rows.filter((_, i) => i !== absoluteIdx);
    setRows(newRows);
    setCustomerCount(new Set(newRows.map((r) => r.customer).filter(Boolean)).size);
    try {
      await api.put("/pdf/temporary/rows", { rows: newRows });
      showToast("Baris dihapus", "success");
    } catch {
      showToast("Gagal hapus baris", "error");
    }
  };

  const handleSaveDriveConfig = async () => {
    setDriveLoading(true);
    try {
      await api.post("/pdf/drive-config", {
        folderId: driveConfig.folderId,
        enabled: driveConfig.enabled,
        scriptUrl: driveConfig.scriptUrl,
      });
      showToast("Konfigurasi Google Drive disimpan", "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Gagal simpan konfigurasi", "error");
    } finally {
      setDriveLoading(false);
    }
  };

  rowsRef.current = rows;

  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <Box sx={{ fontFamily: FONT_SANS, p: 2, display: "flex", flexDirection: "column", gap: 2, height: "calc(100vh - 64px)", boxSizing: "border-box", overflow: "hidden" }}>

      {/* Action bar */}
      <Panel sx={{ flexShrink: 0 }}>
        {/* Company identity strip */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, py: 1.25, borderBottom: `1px solid ${T.line}`, bgcolor: T.surface }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {logoUrl ? (
              <Box component="img" src={logoUrl} alt="logo"
                sx={{ maxHeight: 36, maxWidth: 96, objectFit: "contain", objectPosition: "left center", display: "block", flexShrink: 0 }} />
            ) : (
              <Box sx={{ width: 36, height: 36, borderRadius: "8px", bgcolor: T.brandLight, display: "grid", placeItems: "center", flexShrink: 0 }}>
                <PictureAsPdfRoundedIcon sx={{ fontSize: 18, color: T.brand }} />
              </Box>
            )}
            <Box>
              <Typography sx={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 800, color: T.ink, lineHeight: 1.25, letterSpacing: "-.01em" }}>
                PT Pilar Niaga Makmur
              </Typography>
              <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11, color: T.muted, lineHeight: 1.3 }}>
                Generate &amp; Cetak Tagihan PDF
              </Typography>
            </Box>
          </Box>
          {rows.length > 0 && (
            <Box sx={{ px: 1.25, py: 0.4, borderRadius: "6px", bgcolor: T.brandLight, border: `1px solid ${T.brandBorder}` }}>
              <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11, color: T.brand, fontWeight: 600 }}>
                {customerCount} customer &bull; {rows.length} baris
              </Typography>
            </Box>
          )}
        </Box>

        {/* Action row */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, py: 1.25, flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            {driveReady && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1.25, py: 0.5, borderRadius: "8px", bgcolor: "#e8f0fe", border: "1px solid #c5d8fb" }}>
                <CloudDoneRoundedIcon sx={{ fontSize: 14, color: "#1a73e8" }} />
                <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: "#1a73e8", fontWeight: 600 }}>Drive aktif</Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Btn variant="outline" onClick={() => setDriveConfigOpen(true)} startIcon={<SettingsRoundedIcon sx={{ fontSize: 14 }} />} sx={{ height: 34, fontSize: 12.5 }}>
              Setting Drive
            </Btn>
            {!generating ? (
              <Btn color="brand" onClick={handleGenerate} disabled={!rows.length} startIcon={<PictureAsPdfRoundedIcon sx={{ fontSize: 14 }} />} sx={{ height: 34, fontSize: 12.5 }}>
                Generate {customerCount > 0 ? `${customerCount} PDF` : "PDF"}
              </Btn>
            ) : (
              <Btn color="red" onClick={handleCancelGenerate} disabled={cancelling} loading={cancelling} sx={{ height: 34, fontSize: 12.5 }}>
                {cancelling ? "Membatalkan..." : "Batalkan Generate"}
              </Btn>
            )}
          </Box>
        </Box>

        {/* Progress bar inline */}
        {generating && (
          <Box sx={{ px: 2.5, pb: 1.5, display: "flex", flexDirection: "column", gap: 0.75 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 700, color: T.ink }}>
                {progress.ptName || "Menyiapkan..."}
              </Typography>
              <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11, color: T.brand, fontWeight: 700 }}>
                {progress.current}/{progress.total}
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={percent} sx={{ height: 6, borderRadius: 4, bgcolor: T.brandLight, "& .MuiLinearProgress-bar": { bgcolor: T.brand, borderRadius: 4 } }} />
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.muted }}>
              {progress.status || "Berjalan..."}
            </Typography>
          </Box>
        )}

        {/* Alerts */}
        {!generating && (
          <Box sx={{ px: 2.5, pb: rows.length ? 0 : 1.5, display: "flex", flexDirection: "column", gap: 0.75 }}>
            {!rows.length && <Alert severity="info" sx={{ fontFamily: FONT_SANS, fontSize: 12, py: 0.25, mb: 0.75 }}>Belum ada data — siapkan dari halaman Input Data terlebih dahulu</Alert>}
            {driveConfig.enabled && !driveReady && <Alert severity="warning" sx={{ fontFamily: FONT_SANS, fontSize: 12, py: 0.25, mb: 0.75 }}>Upload Drive aktif tapi belum lengkap — isi Apps Script URL dan Folder ID di Setting Drive.</Alert>}
            {hasProgressState && (
              <Box sx={{ pb: 1 }}>
                <Btn variant="outline" onClick={handleResetProgress} loading={resettingProgress} sx={{ height: 30, fontSize: 11.5 }}>
                  Reset Status Proses
                </Btn>
              </Box>
            )}
          </Box>
        )}
      </Panel>

      {rows.length > 0 && (
        <Panel sx={{ width: "100%", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          {/* Table header */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, py: 1.5, borderBottom: `1px solid ${T.line}`, bgcolor: T.white, gap: 2, flexWrap: "wrap", flexShrink: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <Box sx={{ width: 4, height: 18, borderRadius: "3px", bgcolor: T.brand, flexShrink: 0 }} />
              <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: T.brandLight, display: "grid", placeItems: "center", "& svg": { fontSize: 15, color: T.brand } }}>
                <PictureAsPdfRoundedIcon />
              </Box>
              <Typography sx={{ fontFamily: FONT_SANS, fontSize: 13.5, fontWeight: 600, color: T.ink }}>
                Preview Data
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <FilterAltRoundedIcon sx={{ fontSize: 15, color: T.muted }} />
                <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.muted }}>
                  Filter penagih:
                </Typography>
                <Select
                  size="small"
                  value={penagihFilter}
                  onChange={(e) => {
                    setPenagihFilter(e.target.value);
                    setPage(0);
                  }}
                  sx={{
                    minWidth: 170,
                    height: 32,
                    fontFamily: FONT_SANS,
                    fontSize: 12,
                    borderRadius: "8px",
                    bgcolor: T.white,
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: T.line },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: T.brandBorder },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: T.brand },
                  }}
                >
                  <MenuItem value="all" sx={{ fontFamily: FONT_SANS, fontSize: 12 }}>Semua penagih</MenuItem>
                  {penagihOptions.map((name) => (
                    <MenuItem key={name} value={name} sx={{ fontFamily: FONT_SANS, fontSize: 12 }}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
              <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.muted }}>
                Klik sel untuk edit langsung
              </Typography>
            </Box>
          </Box>

          {/* Pagination bar top */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 0.75, borderBottom: `1px solid ${T.line}`, bgcolor: T.surface, flexWrap: "wrap", gap: 1, flexShrink: 0 }}>
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.muted }}>
              {filteredRows.length === 0 ? "0" : `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, filteredRows.length)}`} dari {filteredRows.length} baris
              {penagihFilter !== "all" && (
                <Box component="span" sx={{ ml: 0.75, color: T.brand, fontWeight: 600 }}>
                  - {penagihFilter}
                </Box>
              )}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.subtle }}>Tampilkan:</Typography>
              <Select
                size="small"
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(e.target.value); setPage(0); }}
                sx={{ height: 26, fontFamily: FONT_MONO, fontSize: 11.5, fontWeight: 600, color: T.brand, bgcolor: T.brandLight, "& .MuiOutlinedInput-notchedOutline": { border: `1px solid ${T.brandBorder}`, borderRadius: "6px" }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: T.brand }, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: T.brand }, "& .MuiSelect-select": { py: 0, pl: 1, pr: 3 } }}
              >
                <MenuItem value={25} sx={{ fontFamily: FONT_MONO, fontSize: 12 }}>25 baris</MenuItem>
                <MenuItem value={50} sx={{ fontFamily: FONT_MONO, fontSize: 12 }}>50 baris</MenuItem>
                <MenuItem value={100} sx={{ fontFamily: FONT_MONO, fontSize: 12 }}>100 baris</MenuItem>
              </Select>
              <IconButton size="small" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} sx={{ color: T.brand, "&:disabled": { opacity: 0.3 } }}>
                <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11, color: T.muted, minWidth: 36, textAlign: "center" }}>
                {page + 1}/{totalPages || 1}
              </Typography>
              <IconButton size="small" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={(page + 1) >= totalPages} sx={{ color: T.brand, "&:disabled": { opacity: 0.3 } }}>
                <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", width: "100%" }}>
            <Box component="table" sx={{ width: "100%", minWidth: 1020, borderCollapse: "collapse", fontFamily: FONT_SANS, fontSize: 12 }}>
              <Box component="thead" sx={{ position: "sticky", top: 0, zIndex: 5 }}>
                <Box component="tr" sx={{ bgcolor: T.brandLight, borderBottom: `2px solid ${T.brand}22` }}>
                  {["No", "No Invoice", "Customer", "Tgl Invoice", "Jatuh Tempo", "Termin", "Tagihan", "Penagih", ""].map((h, i) => (
                    <Box
                      component="th"
                      key={i}
                      sx={{
                        color: T.brandDark,
                        fontSize: 11,
                        fontWeight: 700,
                        px: h === "" ? 1 : 2,
                        py: 1.25,
                        textAlign: h === "Tagihan" ? "right" : "left",
                        whiteSpace: "nowrap",
                        width: h === "" ? 44 : undefined,
                        userSelect: "none",
                      }}
                    >
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {pagedRows.length === 0 ? (
                  <Box component="tr">
                    <Box component="td" colSpan={9} sx={{ py: 6, textAlign: "center" }}>
                      <FilterAltRoundedIcon sx={{ fontSize: 34, color: T.subtle, display: "block", mx: "auto", mb: 1 }} />
                      <Typography sx={{ fontFamily: FONT_SANS, fontSize: 13, color: T.muted, fontWeight: 600 }}>
                        Tidak ada data untuk penagih ini
                      </Typography>
                      <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12, color: T.subtle, mt: 0.5 }}>
                        Coba pilih penagih lain atau kembali ke "Semua penagih"
                      </Typography>
                    </Box>
                  </Box>
                ) : pagedRows.map(({ row, index: absoluteIdx }, i) => {
                  const isCell = (f) => editingCell?.row === absoluteIdx && editingCell?.field === f;
                  const cellSx = (f, extra = {}) => ({
                    px: 1.75,
                    py: 0.95,
                    minWidth: 90,
                    cursor: "text",
                    transition: "background-color 0.12s ease",
                    ...(isCell(f) ? { bgcolor: T.brandLight } : {}),
                    ...extra,
                  });
                  const inp = (f, opts = {}) => (
                    <Box
                      component="input"
                      autoFocus
                      type={opts.type || "text"}
                      value={opts.type === "number" ? row[f] ?? "" : row[f] || ""}
                      placeholder={opts.placeholder}
                      onChange={(e) => handleCellChange(absoluteIdx, f, e.target.value)}
                      onBlur={handleCellBlur}
                      onKeyDown={(e) => handleCellKey(e, absoluteIdx)}
                      sx={{ ...editInputSx, ...(opts.align ? { textAlign: opts.align } : {}) }}
                    />
                  );

                  return (
                    <Box
                      component="tr"
                      key={absoluteIdx}
                      sx={{
                        borderBottom: `1px solid ${T.line}`,
                        bgcolor: i % 2 !== 0 ? T.surface : T.white,
                        transition: "background-color 0.12s ease",
                        "&:hover": { bgcolor: T.brandLight },
                        "&:last-child": { borderBottom: "none" },
                      }}
                    >
                      <Box component="td" sx={{ px: 2, py: 1, color: T.subtle, fontSize: 11, fontWeight: 500, textAlign: "center", userSelect: "none" }}>{page * rowsPerPage + i + 1}</Box>
                      <Box component="td" sx={cellSx("noInvoice")} onClick={() => handleCellClick(absoluteIdx, "noInvoice")}>
                        {isCell("noInvoice") ? inp("noInvoice") : <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11.5, color: T.brand, fontWeight: 700 }}>{row.noInvoice || <Box component="span" sx={{ color: T.subtle, fontStyle: "italic", fontFamily: FONT_SANS, fontWeight: 400 }}>-</Box>}</Typography>}
                      </Box>
                      <Box component="td" sx={cellSx("customer")} onClick={() => handleCellClick(absoluteIdx, "customer")}>
                        {isCell("customer") ? inp("customer") : <Typography sx={{ fontWeight: 600, color: T.ink, fontSize: 12 }}>{row.customer || <Box component="span" sx={{ color: T.subtle, fontStyle: "italic", fontWeight: 400 }}>-</Box>}</Typography>}
                      </Box>
                      <Box component="td" sx={cellSx("tanggalInvoice")} onClick={() => handleCellClick(absoluteIdx, "tanggalInvoice")}>
                        {isCell("tanggalInvoice") ? inp("tanggalInvoice", { placeholder: "dd/mm/yyyy" }) : <Typography sx={{ color: T.muted, fontSize: 12 }}>{row.tanggalInvoice || "-"}</Typography>}
                      </Box>
                      <Box component="td" sx={cellSx("tempo")} onClick={() => handleCellClick(absoluteIdx, "tempo")}>
                        {isCell("tempo") ? inp("tempo", { placeholder: "dd/mm/yyyy" }) : <Typography sx={{ color: T.text, fontWeight: 500, fontSize: 12 }}>{row.tempo || "-"}</Typography>}
                      </Box>
                      <Box component="td" sx={cellSx("termin", { textAlign: "center" })} onClick={() => handleCellClick(absoluteIdx, "termin")}>
                        {isCell("termin") ? inp("termin", { align: "center" }) : <Typography sx={{ color: T.muted, fontSize: 12, textAlign: "center" }}>{row.termin || "-"}</Typography>}
                      </Box>
                      <Box component="td" sx={cellSx("tagihan", { textAlign: "right" })} onClick={() => handleCellClick(absoluteIdx, "tagihan")}>
                        {isCell("tagihan") ? inp("tagihan", { type: "number", align: "right" }) : <Typography sx={{ fontWeight: 700, color: T.green, fontSize: 12 }}>{formatCurrency(row.tagihan)}</Typography>}
                      </Box>
                      <Box component="td" sx={cellSx("penagih")} onClick={() => handleCellClick(absoluteIdx, "penagih")}>
                        {isCell("penagih") ? inp("penagih") : <Typography sx={{ color: T.muted, fontSize: 12 }}>{row.penagih || "-"}</Typography>}
                      </Box>
                      <Box component="td" sx={{ px: 0.75, py: 0.5, textAlign: "center", width: 44, userSelect: "none" }}>
                        <Tooltip title="Hapus baris">
                          <IconButton
                            size="small"
                            onClick={() => deleteRow(absoluteIdx)}
                            sx={{
                              width: 28,
                              height: 28,
                              color: T.subtle,
                              borderRadius: "8px",
                              transition: "all 0.16s ease",
                              "&:hover": {
                                color: T.red,
                                bgcolor: T.redBg,
                                transform: "translateY(-1px)",
                              },
                            }}
                          >
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
        </Panel>
      )}

      <Dialog open={driveConfigOpen} onClose={() => setDriveConfigOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "14px", m: 2 } }}>
        <DialogTitle sx={{ fontFamily: FONT_SANS, fontWeight: 700, fontSize: 15, color: T.ink, pb: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CloudUploadRoundedIcon sx={{ fontSize: 20, color: "#1a73e8" }} />
            Pengaturan Google Drive
          </Box>
          <IconButton size="small" onClick={() => setDriveConfigOpen(false)} sx={{ color: T.muted }}>
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 1.75 }}>
          <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12.5, color: T.muted }}>
            Setiap PDF yang digenerate akan diunggah secara otomatis ke Google Drive yang Anda tentukan di bawah ini.
          </Typography>
          <TextField
            size="small"
            fullWidth
            label="Apps Script URL"
            placeholder="https://script.google.com/macros/s/.../exec"
            value={driveConfig.scriptUrl}
            onChange={(e) => setDriveConfig((p) => ({ ...p, scriptUrl: e.target.value }))}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LinkRoundedIcon sx={{ fontSize: 15, color: driveConfig.scriptUrl ? "#1a73e8" : T.muted }} />
                </InputAdornment>
              ),
              sx: { fontFamily: FONT_MONO, fontSize: 10.5, borderRadius: "9px" },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: driveConfig.scriptUrl ? "#c5d8fb" : T.line },
                "&:hover fieldset": { borderColor: "#1a73e8" },
                "&.Mui-focused fieldset": { borderColor: "#1a73e8" },
              },
              "& label": { fontFamily: FONT_SANS, fontSize: 12 },
            }}
          />
          <TextField
            size="small"
            fullWidth
            label="Folder ID / Link Folder"
            placeholder="https://drive.google.com/drive/folders/... atau ID folder"
            value={driveConfig.folderId}
            onChange={(e) => setDriveConfig((p) => ({ ...p, folderId: extractDriveFolderId(e.target.value) }))}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FolderOpenRoundedIcon sx={{ fontSize: 15, color: T.muted }} />
                </InputAdornment>
              ),
              sx: { fontFamily: FONT_MONO, fontSize: 10.5, borderRadius: "9px" },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: T.line },
                "&:hover fieldset": { borderColor: "#1a73e8" },
                "&.Mui-focused fieldset": { borderColor: "#1a73e8" },
              },
              "& label": { fontFamily: FONT_SANS, fontSize: 12 },
            }}
          />
          <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.muted }}>
            Link folder Google Drive boleh ditempel langsung. Sistem akan ambil folderId otomatis.
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.5, px: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Switch
                size="small"
                checked={driveConfig.enabled}
                onChange={(e) => setDriveConfig((p) => ({ ...p, enabled: e.target.checked }))}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: "#1a73e8" },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#1a73e8" },
                }}
              />
              <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12, color: driveConfig.enabled ? "#1a73e8" : T.muted, fontWeight: driveConfig.enabled ? 600 : 400 }}>
                {driveConfig.enabled ? "Upload Drive Aktif" : "Upload Drive Nonaktif"}
              </Typography>
            </Box>
            <Btn
              color="brand"
              onClick={() => {
                handleSaveDriveConfig();
                setDriveConfigOpen(false);
              }}
              loading={driveLoading}
              sx={{ height: 32, px: 2, fontSize: 12, bgcolor: "#1a73e8", "&:hover": { bgcolor: "#1558c0" } }}
            >
              Simpan & Tutup
            </Btn>
          </Box>
          {driveConfig.enabled && !driveConfig.scriptUrl && (
            <Alert severity="warning" sx={{ fontFamily: FONT_SANS, fontSize: 11, py: 0.25 }}>
              Isi Apps Script URL dulu agar upload berhasil.
            </Alert>
          )}
          {driveConfig.enabled && driveConfig.scriptUrl && !driveConfig.folderId && (
            <Alert severity="warning" sx={{ fontFamily: FONT_SANS, fontSize: 11, py: 0.25 }}>
              Isi link atau ID folder Google Drive dulu.
            </Alert>
          )}
          {driveReady && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1, borderRadius: "7px", bgcolor: "#e8f0fe", border: "1px solid #c5d8fb" }}>
              <CloudDoneRoundedIcon sx={{ fontSize: 16, color: "#1a73e8" }} />
              <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12, color: "#1a73e8", fontWeight: 600 }}>
                Google Drive siap dipakai
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={3200} onClose={() => setToast((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={toast.severity} variant="filled" sx={{ borderRadius: "10px", fontFamily: FONT_SANS }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
