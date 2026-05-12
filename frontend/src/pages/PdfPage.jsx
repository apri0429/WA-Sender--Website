import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  LinearProgress,
  Snackbar,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import CloudDoneRoundedIcon from "@mui/icons-material/CloudDoneRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
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
  greenLight: "#e6f5ee",
  greenBorder: "#a7d7be",
  ink: "#0f2460",
  text: "#374151",
  muted: "#6b7280",
  subtle: "#9ca3af",
  line: "#e5e7eb",
  surface: "#f9fafb",
  white: "#ffffff",
  red: "#dc2626",
  redBg: "#fef2f2",
  wa: "#25d366",
  waBg: "#e9fdf0",
  waBorder: "#9fe3b7",
};

const API_RAW = import.meta.env.DEV ? "http://192.168.1.254:8090" : "";

function formatCurrency(v) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(v) || 0);
}

function Panel({ children, sx = {} }) {
  return (
    <Box sx={{ bgcolor: T.white, borderRadius: "14px", border: `1px solid ${T.line}`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)", overflow: "hidden", ...sx }}>
      {children}
    </Box>
  );
}

function SectionTitle({ children, icon, color = T.brand }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 2.5, py: 1.75, borderBottom: `1px solid ${T.line}`, bgcolor: `${color}06` }}>
      <Box sx={{ width: 4, height: 18, borderRadius: "3px", bgcolor: color, flexShrink: 0 }} />
      <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: `${color}14`, display: "grid", placeItems: "center", "& svg": { fontSize: 15, color } }}>
        {icon}
      </Box>
      <Typography sx={{ fontFamily: FONT_SANS, fontSize: 13.5, fontWeight: 600, color: T.ink }}>
        {children}
      </Typography>
    </Box>
  );
}

function Btn({ children, onClick, disabled, loading, color = "brand", variant = "solid", startIcon, sx = {} }) {
  const solidMap = {
    brand: { bg: T.brand, hover: T.brandDark, text: "#fff" },
    green: { bg: T.green, hover: "#0a3228", text: "#fff" },
    red: { bg: T.red, hover: "#b91c1c", text: "#fff" },
    wa: { bg: T.wa, hover: "#1da855", text: "#fff" },
  };
  const s = solidMap[color] || solidMap.brand;
  if (variant === "outline") {
    return (
      <Button onClick={onClick} disabled={disabled} startIcon={loading ? <CircularProgress size={13} color="inherit" /> : startIcon}
        sx={{ height: 36, px: 2, borderRadius: "8px", fontFamily: FONT_SANS, fontSize: 13, fontWeight: 500, textTransform: "none", color: T.text, bgcolor: T.white, border: `1px solid ${T.line}`, boxShadow: "none", "&:hover": { bgcolor: T.surface, boxShadow: "none" }, "&:disabled": { opacity: 0.4 }, ...sx }}>
        {children}
      </Button>
    );
  }
  return (
    <Button variant="contained" onClick={onClick} disabled={disabled || loading} startIcon={loading ? <CircularProgress size={13} color="inherit" /> : startIcon}
      sx={{ height: 36, px: 2.25, borderRadius: "8px", fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, textTransform: "none", bgcolor: s.bg, color: s.text, boxShadow: "none", "&:hover": { bgcolor: s.hover, boxShadow: "none" }, "&:disabled": { bgcolor: T.line, color: T.subtle, boxShadow: "none" }, ...sx }}>
      {children}
    </Button>
  );
}

const editInputSx = {
  width: "100%", border: `1.5px solid ${T.brand}`, borderRadius: "5px",
  px: "6px", py: "3px", fontFamily: FONT_SANS, fontSize: 12, outline: "none",
  bgcolor: T.brandLight, color: T.ink,
  "&:focus": { borderColor: T.brandDark },
};

export default function PdfPage() {
  const [rows, setRows] = useState([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [fileName, setFileName] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [gsheetLoading, setGsheetLoading] = useState(false);
  const [gsheetUrl, setGsheetUrl] = useState("");
  const [gsheetUrlEdit, setGsheetUrlEdit] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: "", ptName: "" });
  const [logRows, setLogRows] = useState([]);
  const [logGeneratedAt, setLogGeneratedAt] = useState(null);
  const [hasLogo, setHasLogo] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);
  const [deleteLogoOpen, setDeleteLogoOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
  const [editingCell, setEditingCell] = useState(null); // { row, field, orig }
  const rowsRef = useRef([]);
  const [waSending, setWaSending] = useState(false);
  const [waProgress, setWaProgress] = useState({ current: 0, total: 0, customer: "" });
  const [waResults, setWaResults] = useState([]);
  const [waResultsOpen, setWaResultsOpen] = useState(false);
  const [driveConfig, setDriveConfig] = useState({ folderId: "", enabled: false, scriptUrl: "" });
  const [driveLoading, setDriveLoading] = useState(false);
  const excelRef = useRef(null);
  const logoRef = useRef(null);
  const gsheetSavedUrlRef = useRef("");

  const showToast = (message, severity = "success") => setToast({ open: true, message, severity });

  const loadInitial = async () => {
    try {
      const [statusRes, logRes, tmpRes, gsheetRes, driveRes] = await Promise.allSettled([
        api.get("/pdf/status"),
        api.get("/pdf/log"),
        api.get("/pdf/temporary"),
        api.get("/gsheet"),
        api.get("/pdf/drive-config"),
      ]);
      if (statusRes.status === "fulfilled") {
        const d = statusRes.value?.data || {};
        setHasLogo(!!d.hasLogo);
        if (d.progress?.running) {
          setGenerating(true);
          setProgress({ current: d.progress.current || 0, total: d.progress.total || 0, status: d.progress.status || "", ptName: d.progress.ptName || "" });
        }
      }
      if (logRes.status === "fulfilled") {
        setLogRows(Array.isArray(logRes.value?.data?.rows) ? logRes.value.data.rows : []);
        setLogGeneratedAt(logRes.value?.data?.generatedAt || null);
      }
      if (tmpRes.status === "fulfilled") {
        const d = tmpRes.value?.data || {};
        if (Array.isArray(d.rows) && d.rows.length) {
          setRows(d.rows);
          setCustomerCount(new Set(d.rows.map((r) => r.customer).filter(Boolean)).size);
          setFileName(d.sourceSheet || "");
        }
      }
      if (gsheetRes.status === "fulfilled") {
        const url = gsheetRes.value?.data?.url || "";
        setGsheetUrl(url);
        gsheetSavedUrlRef.current = url;
        setGsheetUrlEdit(!url);
      }
      if (driveRes.status === "fulfilled") {
        const d = driveRes.value?.data || {};
        setDriveConfig({ folderId: d.folderId || "", enabled: !!d.enabled, scriptUrl: d.scriptUrl || "" });
      }
    } catch {}
  };

  useEffect(() => {
    loadInitial();

    const onPdfProgress = (d) => {
      setGenerating(true);
      setProgress({ current: d.current || 0, total: d.total || 0, status: d.status || "", ptName: d.ptName || "" });
    };
    const onPdfDone = async () => {
      setGenerating(false);
      try {
        const res = await api.get("/pdf/log");
        setLogRows(Array.isArray(res?.data?.rows) ? res.data.rows : []);
        setLogGeneratedAt(res?.data?.generatedAt || null);
      } catch {}
      showToast("Semua PDF berhasil dibuat!", "success");
    };
    const onPdfError = (d) => {
      setGenerating(false);
      showToast(d?.error || "Generate PDF gagal", "error");
    };
    const onWaProgress = (d) => {
      setWaSending(true);
      setWaProgress({ current: d.current || 0, total: d.total || 0, customer: d.customer || "" });
    };
    const onWaDone = (d) => {
      setWaSending(false);
      const results = Array.isArray(d.results) ? d.results : [];
      setWaResults(results);
      setWaResultsOpen(true);
      const ok = results.filter((r) => r.success).length;
      const fail = results.filter((r) => !r.success).length;
      showToast(`${ok} PDF terkirim${fail > 0 ? `, ${fail} gagal` : ""}`, fail > 0 ? "warning" : "success");
    };
    const onWaError = (d) => {
      setWaSending(false);
      showToast(d?.error || "Kirim PDF gagal", "error");
    };

    if (socket?.on) {
      socket.on("pdf-progress", onPdfProgress);
      socket.on("pdf-done", onPdfDone);
      socket.on("pdf-error", onPdfError);
      socket.on("pdf-wa-progress", onWaProgress);
      socket.on("pdf-wa-done", onWaDone);
      socket.on("pdf-wa-error", onWaError);
    }
    return () => {
      if (socket?.off) {
        socket.off("pdf-progress", onPdfProgress);
        socket.off("pdf-done", onPdfDone);
        socket.off("pdf-error", onPdfError);
        socket.off("pdf-wa-progress", onWaProgress);
        socket.off("pdf-wa-done", onWaDone);
        socket.off("pdf-wa-error", onWaError);
      }
    };
  }, []);

  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/pdf/upload-excel", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const d = res?.data || {};
      setRows(Array.isArray(d.rows) ? d.rows : []);
      setCustomerCount(d.customerCount || 0);
      setFileName(d.fileName || file.name);
      showToast(d.message || "Data berhasil dimuat", "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Upload gagal", "error");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleGSheetSaveUrl = async () => {
    if (!gsheetUrl.trim()) { showToast("Masukkan URL Google Sheet", "warning"); return; }
    if (!gsheetUrl.includes("/spreadsheets/d/")) { showToast("URL tidak valid. Gunakan link Google Sheets yang benar.", "error"); return; }
    try {
      await api.post("/gsheet", { url: gsheetUrl.trim() });
      gsheetSavedUrlRef.current = gsheetUrl.trim();
      setGsheetUrlEdit(false);
      showToast("URL Google Sheet disimpan", "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Gagal simpan URL", "error");
    }
  };

  const handleGSheetSync = async () => {
    if (!gsheetSavedUrlRef.current) { showToast("Atur URL Google Sheet terlebih dahulu", "warning"); return; }
    setGsheetLoading(true);
    try {
      const res = await api.post("/pdf/generate-temporary");
      const d = res?.data || {};
      const newRows = Array.isArray(d.rows) ? d.rows : [];
      setRows(newRows);
      setCustomerCount(new Set(newRows.map((r) => r.customer).filter(Boolean)).size);
      setFileName("Google Sheet");
      showToast(d.message || "Data berhasil dimuat dari Google Sheet", "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Sync Google Sheet gagal", "error");
    } finally {
      setGsheetLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setLogoLoading(true);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      await api.post("/pdf/logo", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setHasLogo(true);
      showToast("Logo berhasil disimpan", "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Upload logo gagal", "error");
    } finally {
      setLogoLoading(false);
    }
  };

  const handleDeleteLogo = async () => {
    setDeleteLogoOpen(false);
    try {
      await api.delete("/pdf/logo");
      setHasLogo(false);
      showToast("Logo dihapus", "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Gagal hapus logo", "error");
    }
  };

  const handleGenerate = async () => {
    if (!rows.length) { showToast("Upload file Excel atau sync Google Sheet terlebih dahulu", "warning"); return; }
    setGenerating(true);
    setProgress({ current: 0, total: customerCount, status: "Memulai...", ptName: "" });
    try {
      await api.post("/pdf/generate-per-pt");
    } catch (err) {
      setGenerating(false);
      showToast(err?.response?.data?.message || "Generate gagal", "error");
    }
  };

  const handleRefreshLog = async () => {
    try {
      const res = await api.get("/pdf/log");
      setLogRows(Array.isArray(res?.data?.rows) ? res.data.rows : []);
      setLogGeneratedAt(res?.data?.generatedAt || null);
      showToast("Log diperbarui", "success");
    } catch { showToast("Gagal refresh log", "error"); }
  };

  const handleCellClick = (rowIdx, field) => {
    if (editingCell?.row === rowIdx && editingCell?.field === field) return;
    setEditingCell({ row: rowIdx, field, orig: rows[rowIdx]?.[field] });
  };

  const handleCellChange = (rowIdx, field, value) => {
    setRows((prev) => prev.map((r, i) => i === rowIdx ? { ...r, [field]: value } : r));
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
        setRows((prev) => prev.map((r, i) => i === rowIdx ? { ...r, [editingCell.field]: editingCell.orig } : r));
      }
      setEditingCell(null);
    }
  };

  const deleteRow = async (idx) => {
    const newRows = rows.filter((_, i) => i !== idx);
    setRows(newRows);
    setCustomerCount(new Set(newRows.map((r) => r.customer).filter(Boolean)).size);
    try {
      await api.put("/pdf/temporary/rows", { rows: newRows });
      showToast("Baris dihapus", "success");
    } catch {
      showToast("Gagal hapus baris", "error");
    }
  };

  const handleSendViaWA = async (targetRows) => {
    if (!targetRows.length) return;
    setWaSending(true);
    setWaResults([]);
    setWaProgress({ current: 0, total: targetRows.length, customer: "" });
    try {
      await api.post("/pdf/send-via-wa", { rows: targetRows });
    } catch (err) {
      setWaSending(false);
      showToast(err?.response?.data?.message || "Gagal memulai pengiriman", "error");
    }
  };

  const handleSaveDriveConfig = async () => {
    setDriveLoading(true);
    try {
      await api.post("/pdf/drive-config", { folderId: driveConfig.folderId, enabled: driveConfig.enabled, scriptUrl: driveConfig.scriptUrl });
      showToast("Konfigurasi Google Drive disimpan", "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Gagal simpan konfigurasi", "error");
    } finally {
      setDriveLoading(false);
    }
  };

  rowsRef.current = rows;

  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const waPercent = waProgress.total > 0 ? Math.round((waProgress.current / waProgress.total) * 100) : 0;
  const uniqueCustomers = [...new Map(rows.map((r) => [r.customer, r])).values()].slice(0, 8);

  return (
    <Box sx={{ fontFamily: FONT_SANS, p: 2, display: "flex", gap: 2, alignItems: "flex-start", flexDirection: { xs: "column", xl: "row" } }}>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          MAIN CONTENT (kiri)
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>

      {/* placeholder kosong jika belum ada data */}
      {!rows.length && (
        <Panel>
          <Box sx={{ p: 5, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
            <PictureAsPdfRoundedIcon sx={{ fontSize: 48, color: T.subtle }} />
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: T.muted }}>
              Belum ada data
            </Typography>
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12.5, color: T.subtle }}>
              Upload file Excel atau sync Google Sheet dari sidebar kanan
            </Typography>
          </Box>
        </Panel>
      )}

      {/* â”€â”€ Data Preview Table â”€â”€ */}
      {rows.length > 0 && (
        <Panel>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, py: 1.75, borderBottom: `1px solid ${T.line}`, bgcolor: `${T.brand}06` }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <Box sx={{ width: 4, height: 18, borderRadius: "3px", bgcolor: T.brand, flexShrink: 0 }} />
              <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: `${T.brand}14`, display: "grid", placeItems: "center", "& svg": { fontSize: 15, color: T.brand } }}>
                <UploadFileRoundedIcon />
              </Box>
              <Typography sx={{ fontFamily: FONT_SANS, fontSize: 13.5, fontWeight: 600, color: T.ink }}>
                Preview Data ({rows.length} baris)
              </Typography>
            </Box>
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.muted }}>Klik sel untuk edit langsung</Typography>
          </Box>
          <Box sx={{ overflowX: "auto" }}>
            <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_SANS, fontSize: 12.5 }}>
              <Box component="thead">
                <Box component="tr" sx={{ bgcolor: T.brandDark }}>
                  {["No", "No Invoice", "Customer", "Tgl Invoice", "Jatuh Tempo", "Termin", "Tagihan", ""].map((h, i) => (
                    <Box component="th" key={i} sx={{ color: "#fff", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", px: 1.5, py: 1, textAlign: h === "Tagihan" ? "right" : "left", whiteSpace: "nowrap", width: h === "" ? 40 : undefined }}>
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {rows.slice(0, 50).map((row, i) => {
                  const isCell = (f) => editingCell?.row === i && editingCell?.field === f;
                  const cellSx = (f, extra = {}) => ({
                    px: 1.5, py: 0.75,
                    ...(isCell(f) ? { bgcolor: `${T.brand}06` } : { "&:hover": { bgcolor: `${T.brand}05`, cursor: "text" } }),
                    ...extra,
                  });
                  const inp = (f, opts = {}) => (
                    <Box component="input" autoFocus
                      type={opts.type || "text"}
                      value={opts.type === "number" ? (row[f] ?? "") : (row[f] || "")}
                      placeholder={opts.placeholder}
                      onChange={(e) => handleCellChange(i, f, e.target.value)}
                      onBlur={handleCellBlur}
                      onKeyDown={(e) => handleCellKey(e, i)}
                      sx={{ ...editInputSx, ...(opts.align ? { textAlign: opts.align } : {}) }}
                    />
                  );
                  return (
                    <Box component="tr" key={i} sx={{ borderBottom: `1px solid ${T.line}`, "&:nth-of-type(even)": { bgcolor: editingCell?.row === i ? "unset" : T.surface } }}>
                      <Box component="td" sx={{ px: 1.5, py: 0.9, color: T.subtle, fontSize: 11 }}>{i + 1}</Box>
                      <Box component="td" sx={cellSx("noInvoice")} onClick={() => handleCellClick(i, "noInvoice")}>
                        {isCell("noInvoice") ? inp("noInvoice") : <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11.5, color: T.brand, fontWeight: 700 }}>{row.noInvoice || "-"}</Typography>}
                      </Box>
                      <Box component="td" sx={cellSx("customer")} onClick={() => handleCellClick(i, "customer")}>
                        {isCell("customer") ? inp("customer") : <Typography sx={{ fontWeight: 600, color: T.ink, fontSize: 12.5 }}>{row.customer || "-"}</Typography>}
                      </Box>
                      <Box component="td" sx={cellSx("tanggalInvoice")} onClick={() => handleCellClick(i, "tanggalInvoice")}>
                        {isCell("tanggalInvoice") ? inp("tanggalInvoice", { placeholder: "dd/mm/yyyy" }) : <Typography sx={{ color: T.muted, fontSize: 12.5 }}>{row.tanggalInvoice || "-"}</Typography>}
                      </Box>
                      <Box component="td" sx={cellSx("tempo")} onClick={() => handleCellClick(i, "tempo")}>
                        {isCell("tempo") ? inp("tempo", { placeholder: "dd/mm/yyyy" }) : <Typography sx={{ color: T.text, fontWeight: 500, fontSize: 12.5 }}>{row.tempo || "-"}</Typography>}
                      </Box>
                      <Box component="td" sx={cellSx("termin", { textAlign: "center" })} onClick={() => handleCellClick(i, "termin")}>
                        {isCell("termin") ? inp("termin", { align: "center" }) : <Typography sx={{ color: T.muted, fontSize: 12.5, textAlign: "center" }}>{row.termin || "-"}</Typography>}
                      </Box>
                      <Box component="td" sx={cellSx("tagihan", { textAlign: "right" })} onClick={() => handleCellClick(i, "tagihan")}>
                        {isCell("tagihan") ? inp("tagihan", { type: "number", align: "right" }) : <Typography sx={{ fontWeight: 700, color: T.green, fontSize: 12.5 }}>{formatCurrency(row.tagihan)}</Typography>}
                      </Box>
                      <Box component="td" sx={{ px: 1, py: 0.5, textAlign: "center", width: 40 }}>
                        <Tooltip title="Hapus baris">
                          <IconButton size="small" onClick={() => deleteRow(i)} sx={{ color: T.subtle, "&:hover": { color: T.red, bgcolor: T.redBg } }}>
                            <DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
            {rows.length > 50 && (
              <Box sx={{ px: 2, py: 1.5, borderTop: `1px solid ${T.line}`, bgcolor: T.surface }}>
                <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12, color: T.muted }}>Menampilkan 50 dari {rows.length} baris</Typography>
              </Box>
            )}
          </Box>
        </Panel>
      )}

      {/* â”€â”€ PDF Log â”€â”€ */}
      <Panel>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, py: 1.75, borderBottom: `1px solid ${T.line}`, bgcolor: `${T.green}06` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box sx={{ width: 4, height: 18, borderRadius: "3px", bgcolor: T.green, flexShrink: 0 }} />
            <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: `${T.green}14`, display: "grid", placeItems: "center", "& svg": { fontSize: 15, color: T.green } }}>
              <PictureAsPdfRoundedIcon />
            </Box>
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 13.5, fontWeight: 600, color: T.ink }}>
              Hasil PDF
              {logGeneratedAt && <Typography component="span" sx={{ fontFamily: FONT_MONO, fontSize: 11, color: T.muted, ml: 1 }}>â€” {new Date(logGeneratedAt).toLocaleString("id-ID")}</Typography>}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {logRows.length > 0 && !waSending && (
              <Btn color="wa" onClick={() => handleSendViaWA(logRows)} startIcon={<WhatsAppIcon sx={{ fontSize: 16 }} />} sx={{ height: 32, px: 1.75, fontSize: 12 }}>
                Kirim Semua via WA
              </Btn>
            )}
            <Tooltip title="Refresh log">
              <IconButton size="small" onClick={handleRefreshLog} sx={{ color: T.green, "&:hover": { bgcolor: T.greenLight } }}>
                <RefreshRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {waSending && (
          <Box sx={{ px: 2.5, py: 1.5, bgcolor: T.waBg, borderBottom: `1px solid ${T.waBorder}` }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <WhatsAppIcon sx={{ fontSize: 15, color: T.wa }} />
                <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: 600, color: T.green }}>{waProgress.customer || "Mengirim..."}</Typography>
              </Box>
              <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11.5, color: T.wa, fontWeight: 700 }}>{waProgress.current}/{waProgress.total}</Typography>
            </Box>
            <LinearProgress variant="determinate" value={waPercent} sx={{ height: 6, borderRadius: 3, bgcolor: T.waBorder, "& .MuiLinearProgress-bar": { bgcolor: T.wa, borderRadius: 3 } }} />
          </Box>
        )}

        {logRows.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <PictureAsPdfRoundedIcon sx={{ fontSize: 40, color: T.subtle, mb: 1.5 }} />
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 13, color: T.muted }}>Belum ada PDF yang digenerate</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_SANS, fontSize: 12.5 }}>
              <Box component="thead">
                <Box component="tr" sx={{ bgcolor: T.green }}>
                  {["No", "Customer", "Total Tagihan", "Jatuh Tempo", "No HP", "Wilayah", "PDF", "WA"].map((h) => (
                    <Box component="th" key={h} sx={{ color: "#fff", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", px: 1.5, py: 1, textAlign: h === "Total Tagihan" ? "right" : "left", whiteSpace: "nowrap" }}>{h}</Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {logRows.map((row, i) => (
                  <Box component="tr" key={i} sx={{ borderBottom: `1px solid ${T.line}`, "&:nth-of-type(even)": { bgcolor: T.surface }, "&:last-child": { borderBottom: "none" } }}>
                    <Box component="td" sx={{ px: 1.5, py: 1, color: T.subtle, fontSize: 11 }}>{i + 1}</Box>
                    <Box component="td" sx={{ px: 1.5, py: 1, fontWeight: 700, color: T.ink }}>{row.nama || "-"}</Box>
                    <Box component="td" sx={{ px: 1.5, py: 1, textAlign: "right", fontWeight: 700, color: T.green }}>{row.total || "-"}</Box>
                    <Box component="td" sx={{ px: 1.5, py: 1, color: T.text }}>{row.tempo || "-"}</Box>
                    <Box component="td" sx={{ px: 1.5, py: 1, fontFamily: FONT_MONO, fontSize: 12, color: T.muted }}>{row.nomor || "-"}</Box>
                    <Box component="td" sx={{ px: 1.5, py: 1, color: T.muted }}>{row.wilayah || "-"}</Box>
                    <Box component="td" sx={{ px: 1.5, py: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                        {row.pdf && (
                          <Tooltip title="Buka PDF lokal">
                            <IconButton size="small" component="a" href={`${API_RAW}${row.pdf}`} target="_blank" rel="noopener noreferrer" sx={{ color: T.green, "&:hover": { bgcolor: T.greenLight } }}>
                              <OpenInNewRoundedIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {row.driveUrl && (
                          <Tooltip title="Buka di Google Drive">
                            <IconButton size="small" component="a" href={row.driveUrl} target="_blank" rel="noopener noreferrer" sx={{ color: "#1a73e8", "&:hover": { bgcolor: "#e8f0fe" } }}>
                              <CloudDoneRoundedIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {!row.pdf && !row.driveUrl && <Typography sx={{ fontSize: 11.5, color: T.subtle }}>â€”</Typography>}
                      </Box>
                    </Box>
                    <Box component="td" sx={{ px: 1.5, py: 1 }}>
                      {row.nomor ? (
                        <Tooltip title={`Kirim ke ${row.nomor}`}>
                          <IconButton size="small" onClick={() => handleSendViaWA([row])} disabled={waSending} sx={{ color: T.wa, "&:hover": { bgcolor: T.waBg }, "&:disabled": { opacity: 0.35 } }}>
                            <SendRoundedIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                      ) : <Typography sx={{ fontSize: 11.5, color: T.subtle }}>â€”</Typography>}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </Panel>

      </Box>{/* end main content */}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          RIGHT SIDEBAR
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <Box sx={{ width: { xs: "100%", xl: 300 }, flexShrink: 0, display: "flex", flexDirection: "column", gap: 2, position: { xl: "sticky" }, top: { xl: 16 } }}>
        <input ref={excelRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleExcelUpload} />
        <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoUpload} />

        {/* â”€â”€ Sumber Data â”€â”€ */}
        <Panel>
          <SectionTitle icon={<UploadFileRoundedIcon />} color={T.brand}>Sumber Data</SectionTitle>
          <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>

            {/* Excel upload */}
            <Box onClick={() => !uploadLoading && excelRef.current?.click()}
              sx={{ border: `2px dashed ${rows.length ? T.brand : T.line}`, borderRadius: "10px", p: 2, textAlign: "center", cursor: uploadLoading ? "default" : "pointer", bgcolor: rows.length ? T.brandLight : T.surface, transition: "all 0.15s", "&:hover": { borderColor: T.brand, bgcolor: T.brandLight } }}>
              {uploadLoading ? (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                  <CircularProgress size={16} sx={{ color: T.brand }} />
                  <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12.5, color: T.muted }}>Memproses...</Typography>
                </Box>
              ) : rows.length ? (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                  <CheckCircleOutlineRoundedIcon sx={{ fontSize: 24, color: T.brand }} />
                  <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: 700, color: T.ink }}>{fileName}</Typography>
                  <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11, color: T.brand }}>{rows.length} baris &bull; {customerCount} customer</Typography>
                  <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11, color: T.muted }}>Klik untuk ganti file</Typography>
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                  <UploadFileRoundedIcon sx={{ fontSize: 28, color: T.subtle }} />
                  <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: 600, color: T.text }}>Upload Excel</Typography>
                  <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11, color: T.muted }}>.xlsx / .xls</Typography>
                </Box>
              )}
            </Box>

            {/* divider */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ flex: 1, height: "1px", bgcolor: T.line }} />
              <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11, color: T.subtle }}>atau Google Sheet</Typography>
              <Box sx={{ flex: 1, height: "1px", bgcolor: T.line }} />
            </Box>

            {/* GSheet section */}
            {gsheetUrlEdit ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                <TextField size="small" fullWidth autoFocus placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={gsheetUrl} onChange={(e) => setGsheetUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGSheetSaveUrl()}
                  InputProps={{ startAdornment: <InputAdornment position="start"><LinkRoundedIcon sx={{ fontSize: 15, color: T.muted }} /></InputAdornment>, sx: { fontFamily: FONT_SANS, fontSize: 12, borderRadius: "9px" } }}
                  sx={{ "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: T.brandBorder }, "&:hover fieldset": { borderColor: T.brand }, "&.Mui-focused fieldset": { borderColor: T.brand } } }}
                />
                {gsheetUrl && !gsheetUrl.includes("/spreadsheets/d/") && (
                  <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11, color: T.red }}>URL tidak valid</Typography>
                )}
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button fullWidth onClick={handleGSheetSaveUrl} disabled={!gsheetUrl.trim()}
                    sx={{ height: 34, borderRadius: "8px", fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: 600, textTransform: "none", border: `1.5px solid ${T.brandBorder}`, color: T.brand, bgcolor: T.brandLight, boxShadow: "none", "&:hover": { bgcolor: "#dce7f9" }, "&:disabled": { opacity: 0.5 } }}>
                    Simpan URL
                  </Button>
                  {gsheetSavedUrlRef.current && (
                    <IconButton size="small" onClick={() => { setGsheetUrl(gsheetSavedUrlRef.current); setGsheetUrlEdit(false); }} sx={{ color: T.muted, "&:hover": { bgcolor: T.surface } }}>
                      <CloseRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.25, py: 0.9, borderRadius: "9px", bgcolor: T.brandLight, border: `1px solid ${T.brandBorder}` }}>
                <TableChartRoundedIcon sx={{ fontSize: 14, color: T.brand, flexShrink: 0 }} />
                <Typography sx={{ flex: 1, fontFamily: FONT_SANS, fontSize: 12, color: T.brand, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {gsheetSavedUrlRef.current ? "Sync dari Google Sheet" : "Belum dikonfigurasi"}
                </Typography>
                <Tooltip title="Ubah URL"><IconButton size="small" onClick={() => setGsheetUrlEdit(true)} sx={{ color: T.muted, p: "3px", "&:hover": { bgcolor: "#dce7f9" } }}><EditRoundedIcon sx={{ fontSize: 13 }} /></IconButton></Tooltip>
                <Button onClick={handleGSheetSync} disabled={gsheetLoading || !gsheetSavedUrlRef.current}
                  startIcon={gsheetLoading ? <CircularProgress size={11} color="inherit" /> : <SyncRoundedIcon sx={{ fontSize: 14 }} />}
                  sx={{ height: 30, px: 1.25, borderRadius: "7px", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, textTransform: "none", border: `1.5px solid ${T.brandBorder}`, color: T.brand, bgcolor: T.white, boxShadow: "none", whiteSpace: "nowrap", flexShrink: 0, "&:hover": { bgcolor: "#dce7f9" }, "&:disabled": { opacity: 0.5 } }}>
                  {gsheetLoading ? "Sync..." : "Sync"}
                </Button>
              </Box>
            )}

            {/* Customer preview chips */}
            {uniqueCustomers.length > 0 && (
              <Box>
                <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11, fontWeight: 600, color: T.muted, mb: 0.75 }}>
                  {customerCount} customer:
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {uniqueCustomers.map((r) => (
                    <Box key={r.customer} sx={{ px: 1, py: 0.3, bgcolor: T.brandLight, border: `1px solid ${T.brandBorder}`, borderRadius: "5px" }}>
                      <Typography sx={{ fontFamily: FONT_SANS, fontSize: 10.5, fontWeight: 500, color: T.brand }}>{r.customer}</Typography>
                    </Box>
                  ))}
                  {customerCount > 8 && (
                    <Box sx={{ px: 1, py: 0.3, bgcolor: T.surface, border: `1px solid ${T.line}`, borderRadius: "5px" }}>
                      <Typography sx={{ fontFamily: FONT_SANS, fontSize: 10.5, color: T.muted }}>+{customerCount - 8}</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </Panel>

        {/* â”€â”€ Generate PDF â”€â”€ */}
        <Panel>
          <SectionTitle icon={<PictureAsPdfRoundedIcon />} color={T.green}>Generate PDF</SectionTitle>
          <Box sx={{ p: 2 }}>
            {generating ? (
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                  <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: T.ink }}>{progress.ptName || "Menyiapkan..."}</Typography>
                  <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11, color: T.brand, fontWeight: 700 }}>{progress.current}/{progress.total}</Typography>
                </Box>
                <LinearProgress variant="determinate" value={percent} sx={{ height: 7, borderRadius: 4, bgcolor: T.brandLight, "& .MuiLinearProgress-bar": { bgcolor: T.brand, borderRadius: 4 } }} />
                <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11, color: T.muted, mt: 0.5 }}>{progress.status || "Berjalan..."}</Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                {!rows.length && <Alert severity="info" sx={{ fontFamily: FONT_SANS, fontSize: 12, py: 0.25 }}>Upload Excel atau sync GSheet dulu</Alert>}
                <Btn color="green" onClick={handleGenerate} disabled={!rows.length} loading={generating}
                  startIcon={<PictureAsPdfRoundedIcon sx={{ fontSize: 16 }} />}
                  sx={{ width: "100%", height: 40, fontSize: 13 }}>
                  Generate {customerCount > 0 ? `${customerCount} PDF` : "PDF"}
                </Btn>
              </Box>
            )}
          </Box>
        </Panel>

        {/* â”€â”€ Logo â”€â”€ */}
        <Panel>
          <SectionTitle icon={<ImageRoundedIcon />} color={T.green}>Logo PDF</SectionTitle>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: "9px", border: `1px solid ${T.line}`, bgcolor: T.surface, display: "grid", placeItems: "center", flexShrink: 0 }}>
                {hasLogo ? <CheckCircleOutlineRoundedIcon sx={{ fontSize: 22, color: T.green }} /> : <ImageRoundedIcon sx={{ fontSize: 22, color: T.subtle }} />}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: 600, color: T.ink }}>{hasLogo ? "Logo terpasang" : "Belum ada logo"}</Typography>
                <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.muted }}>{hasLogo ? "Muncul di header PDF" : "PNG/JPG untuk header"}</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                <Tooltip title={hasLogo ? "Ganti logo" : "Upload logo"}>
                  <IconButton size="small" onClick={() => logoRef.current?.click()} disabled={logoLoading} sx={{ color: T.brand, "&:hover": { bgcolor: T.brandLight } }}>
                    {logoLoading ? <CircularProgress size={15} /> : <ImageRoundedIcon sx={{ fontSize: 17 }} />}
                  </IconButton>
                </Tooltip>
                {hasLogo && (
                  <Tooltip title="Hapus logo">
                    <IconButton size="small" onClick={() => setDeleteLogoOpen(true)} sx={{ color: T.red, "&:hover": { bgcolor: T.redBg } }}>
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </Box>
        </Panel>

        {/* â”€â”€ Google Drive â”€â”€ */}
        <Panel>
          <SectionTitle icon={<CloudUploadRoundedIcon />} color="#1a73e8">Google Drive</SectionTitle>
          <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
            <TextField size="small" fullWidth label="Apps Script URL"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={driveConfig.scriptUrl}
              onChange={(e) => setDriveConfig((p) => ({ ...p, scriptUrl: e.target.value }))}
              InputProps={{ startAdornment: <InputAdornment position="start"><LinkRoundedIcon sx={{ fontSize: 15, color: driveConfig.scriptUrl ? "#1a73e8" : T.muted }} /></InputAdornment>, sx: { fontFamily: FONT_MONO, fontSize: 10.5, borderRadius: "9px" } }}
              sx={{ "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: driveConfig.scriptUrl ? "#c5d8fb" : T.line }, "&:hover fieldset": { borderColor: "#1a73e8" }, "&.Mui-focused fieldset": { borderColor: "#1a73e8" } }, "& label": { fontFamily: FONT_SANS, fontSize: 12 } }}
            />
            <TextField size="small" fullWidth label="Folder ID"
              placeholder="1f1gonl... (dari URL folder Drive)"
              value={driveConfig.folderId}
              onChange={(e) => setDriveConfig((p) => ({ ...p, folderId: e.target.value }))}
              InputProps={{ startAdornment: <InputAdornment position="start"><FolderOpenRoundedIcon sx={{ fontSize: 15, color: T.muted }} /></InputAdornment>, sx: { fontFamily: FONT_MONO, fontSize: 10.5, borderRadius: "9px" } }}
              sx={{ "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: T.line }, "&:hover fieldset": { borderColor: "#1a73e8" }, "&.Mui-focused fieldset": { borderColor: "#1a73e8" } }, "& label": { fontFamily: FONT_SANS, fontSize: 12 } }}
            />
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Switch size="small" checked={driveConfig.enabled} onChange={(e) => setDriveConfig((p) => ({ ...p, enabled: e.target.checked }))
                  } sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#1a73e8" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#1a73e8" } }} />
                <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: driveConfig.enabled ? "#1a73e8" : T.muted, fontWeight: driveConfig.enabled ? 600 : 400 }}>
                  {driveConfig.enabled ? "Aktif" : "Nonaktif"}
                </Typography>
              </Box>
              <Btn color="brand" onClick={handleSaveDriveConfig} loading={driveLoading} sx={{ height: 30, px: 1.5, fontSize: 11.5, bgcolor: "#1a73e8", "&:hover": { bgcolor: "#1558c0" } }}>
                Simpan
              </Btn>
            </Box>
            {driveConfig.enabled && !driveConfig.scriptUrl && <Alert severity="warning" sx={{ fontFamily: FONT_SANS, fontSize: 11, py: 0.25 }}>Isi Apps Script URL dulu</Alert>}
            {driveConfig.scriptUrl && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.25, py: 0.6, borderRadius: "7px", bgcolor: "#e8f0fe", border: "1px solid #c5d8fb" }}>
                <CloudDoneRoundedIcon sx={{ fontSize: 14, color: "#1a73e8" }} />
                <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: "#1a73e8", fontWeight: 600 }}>Apps Script terhubung</Typography>
              </Box>
            )}
          </Box>
        </Panel>

      </Box>{/* end sidebar */}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          DIALOGS
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}

      {/* WA Results Dialog */}
      <Dialog open={waResultsOpen} onClose={() => setWaResultsOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "14px", m: 2 } }}>
        <DialogTitle sx={{ fontFamily: FONT_SANS, fontWeight: 700, fontSize: 15, color: T.ink, pb: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><WhatsAppIcon sx={{ fontSize: 20, color: T.wa }} />Hasil Kirim PDF via WA</Box>
          <IconButton size="small" onClick={() => setWaResultsOpen(false)} sx={{ color: T.muted }}><CloseRoundedIcon sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          {waResults.length > 0 && (
            <Box sx={{ mb: 1.5, display: "flex", gap: 1 }}>
              <Box sx={{ px: 1.5, py: 0.5, bgcolor: T.waBg, border: `1px solid ${T.waBorder}`, borderRadius: "8px" }}>
                <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: T.green }}>âœ“ {waResults.filter((r) => r.success).length} berhasil</Typography>
              </Box>
              {waResults.filter((r) => !r.success).length > 0 && (
                <Box sx={{ px: 1.5, py: 0.5, bgcolor: T.redBg, border: `1px solid #fca5a5`, borderRadius: "8px" }}>
                  <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: T.red }}>âœ— {waResults.filter((r) => !r.success).length} gagal</Typography>
                </Box>
              )}
            </Box>
          )}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, maxHeight: 320, overflowY: "auto" }}>
            {waResults.map((r, i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1.5, py: 0.9, borderRadius: "8px", bgcolor: r.success ? T.waBg : T.redBg, border: `1px solid ${r.success ? T.waBorder : "#fca5a5"}` }}>
                <Typography sx={{ fontSize: 14 }}>{r.success ? "âœ“" : "âœ—"}</Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: 600, color: r.success ? T.green : T.red }}>{r.customer || "-"}</Typography>
                  {!r.success && r.error && <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.red, opacity: 0.8 }}>{r.error}</Typography>}
                </Box>
              </Box>
            ))}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Delete logo confirm */}
      <Dialog open={deleteLogoOpen} onClose={() => setDeleteLogoOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "14px", m: 2 } }}>
        <Box sx={{ px: 3, py: 2.5 }}>
          <Typography sx={{ fontFamily: FONT_SANS, fontWeight: 700, fontSize: 15, color: T.ink, mb: 0.75 }}>Hapus logo?</Typography>
          <Typography sx={{ fontFamily: FONT_SANS, fontSize: 13.5, color: T.muted, mb: 2.5 }}>Logo akan dihapus dari semua PDF yang digenerate berikutnya.</Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button onClick={() => setDeleteLogoOpen(false)} variant="text" sx={{ textTransform: "none", fontFamily: FONT_SANS, color: T.muted, borderRadius: "8px" }}>Batal</Button>
            <Button onClick={handleDeleteLogo} variant="contained" color="error" sx={{ textTransform: "none", fontFamily: FONT_SANS, fontWeight: 600, borderRadius: "8px" }}>Hapus</Button>
          </Box>
        </Box>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={3200} onClose={() => setToast((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={toast.severity} variant="filled" sx={{ borderRadius: "10px", fontFamily: FONT_SANS }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
