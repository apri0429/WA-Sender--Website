import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  MenuItem,
  Select,
  Snackbar,
  Tooltip,
  Typography,
} from "@mui/material";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import CloudDoneRoundedIcon from "@mui/icons-material/CloudDoneRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
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
  wa: "#25d366",
  waBg: "#e9fdf0",
  waBorder: "#9fe3b7",
};

const API_RAW = import.meta.env.DEV ? "http://192.168.1.254:8098" : "";

export default function HasilPdfPage() {
  const [logRows, setLogRows] = useState([]);
  const [logGeneratedAt, setLogGeneratedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [waSending, setWaSending] = useState(false);
  const [waProgress, setWaProgress] = useState({ current: 0, total: 0, customer: "" });
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage] = useState(0);
  const [wilayahFilter, setWilayahFilter] = useState("all");
  const [sendConfirm, setSendConfirm] = useState({ open: false, rows: [], mode: "single" });
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
  const logRefreshTimerRef = useRef(null);

  const showToast = (message, severity = "success") =>
    setToast({ open: true, message, severity });

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

    const scheduleLogRefresh = () => {
      if (logRefreshTimerRef.current) return;
      logRefreshTimerRef.current = setTimeout(async () => {
        logRefreshTimerRef.current = null;
        await fetchLog({ silent: true });
      }, 350);
    };

    const onWaProgress = (d) => {
      setWaSending(true);
      setWaProgress({ current: d.current || 0, total: d.total || 0, customer: d.customer || "" });
    };
    const onWaDone = (d) => {
      setWaSending(false);
      const results = Array.isArray(d.results) ? d.results : [];
      const ok = results.filter((r) => r.success).length;
      const fail = results.filter((r) => !r.success).length;
      showToast(`${ok} PDF terkirim${fail > 0 ? `, ${fail} gagal` : ""}`, fail > 0 ? "warning" : "success");
    };
    const onWaError = (d) => {
      setWaSending(false);
      showToast(d?.error || "Kirim PDF gagal", "error");
    };
    const onPdfProgress = () => {
      scheduleLogRefresh();
    };
    const onPdfLogUpdated = () => {
      scheduleLogRefresh();
    };

    if (socket?.on) {
      socket.on("pdf-wa-progress", onWaProgress);
      socket.on("pdf-wa-done", onWaDone);
      socket.on("pdf-wa-error", onWaError);
      socket.on("pdf-progress", onPdfProgress);
      socket.on("pdf-log-updated", onPdfLogUpdated);
      socket.on("pdf-done", fetchLog);
    }
    return () => {
      if (logRefreshTimerRef.current) {
        clearTimeout(logRefreshTimerRef.current);
        logRefreshTimerRef.current = null;
      }
      if (socket?.off) {
        socket.off("pdf-wa-progress", onWaProgress);
        socket.off("pdf-wa-done", onWaDone);
        socket.off("pdf-wa-error", onWaError);
        socket.off("pdf-progress", onPdfProgress);
        socket.off("pdf-log-updated", onPdfLogUpdated);
        socket.off("pdf-done", fetchLog);
      }
    };
  }, []);

  const handleSendViaWA = async (targetRows) => {
    if (!targetRows.length) return;
    setWaSending(true);
    setWaProgress({ current: 0, total: targetRows.length, customer: "" });
    try {
      await api.post("/pdf/send-via-wa", { rows: targetRows });
    } catch (err) {
      setWaSending(false);
      showToast(err?.response?.data?.message || "Gagal memulai pengiriman", "error");
    }
  };

  const openSendConfirm = (targetRows, mode = "single") => {
    const validRows = targetRows.filter((row) => row.nomor && row.nomor !== "TIDAK DITEMUKAN");
    if (!validRows.length) {
      showToast("Nomor WhatsApp tidak tersedia", "warning");
      return;
    }
    setSendConfirm({ open: true, rows: validRows, mode });
  };

  const closeSendConfirm = () => {
    if (waSending) return;
    setSendConfirm({ open: false, rows: [], mode: "single" });
  };

  const confirmSendViaWA = async () => {
    const rows = sendConfirm.rows;
    closeSendConfirm();
    await handleSendViaWA(rows);
  };

  const waPercent = waProgress.total > 0 ? Math.round((waProgress.current / waProgress.total) * 100) : 0;
  const wilayahOptions = Array.from(
    new Set(
      logRows
        .map((row) => String(row.wilayah || "").trim())
        .filter((value) => value && value !== "CEK")
    )
  ).sort((a, b) => a.localeCompare(b, "id"));
  const filteredRows = logRows.filter((row) => {
    if (wilayahFilter === "all") return true;
    return String(row.wilayah || "").trim() === wilayahFilter;
  });
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const pagedRows = filteredRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const sendableRows = logRows.filter((row) => row.nomor && row.nomor !== "TIDAK DITEMUKAN");

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalPages]);

  return (
    <Box sx={{ fontFamily: FONT_SANS, p: 2, display: "flex", flexDirection: "column", gap: 1.5, height: "calc(100vh - 64px)", boxSizing: "border-box", overflow: "hidden" }}>

      <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, minHeight: 0, borderRadius: "14px", border: `1px solid ${T.line}`, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", bgcolor: T.white, overflow: "hidden" }}>

        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, py: 1.5, borderBottom: `1px solid ${T.line}`, bgcolor: `${T.green}08`, flexShrink: 0, flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box sx={{ width: 4, height: 18, borderRadius: "3px", bgcolor: T.green, flexShrink: 0 }} />
            <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: `${T.green}14`, display: "grid", placeItems: "center", "& svg": { fontSize: 15, color: T.green } }}>
              <PictureAsPdfRoundedIcon />
            </Box>
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 700, color: T.ink }}>
              Hasil PDF
            </Typography>
            {logRows.length > 0 && (
              <Box sx={{ px: 1, py: 0.25, borderRadius: "5px", bgcolor: T.greenLight, border: `1px solid ${T.greenBorder}` }}>
                <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11, color: T.green, fontWeight: 600 }}>
                  {logRows.length} file
                </Typography>
              </Box>
            )}
            {logGeneratedAt && (
              <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11, color: T.subtle }}>
                · {logGeneratedAt}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.muted }}>
                Wilayah:
              </Typography>
              <Select
                size="small"
                value={wilayahFilter}
                onChange={(e) => {
                  setWilayahFilter(e.target.value);
                  setPage(0);
                }}
                sx={{ minWidth: 150, height: 32, fontFamily: FONT_SANS, fontSize: 12, borderRadius: "8px", bgcolor: T.white, "& .MuiOutlinedInput-notchedOutline": { borderColor: T.line }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: T.brandBorder }, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: T.brand } }}
              >
                <MenuItem value="all" sx={{ fontFamily: FONT_SANS, fontSize: 12 }}>Semua wilayah</MenuItem>
                {wilayahOptions.map((wilayah) => (
                  <MenuItem key={wilayah} value={wilayah} sx={{ fontFamily: FONT_SANS, fontSize: 12 }}>
                    {wilayah}
                  </MenuItem>
                ))}
              </Select>
            </Box>
            {logRows.length > 0 && !waSending && (
              <Button
                onClick={() => openSendConfirm(sendableRows, "bulk")}
                disabled={!sendableRows.length}
                startIcon={<WhatsAppIcon sx={{ fontSize: 15 }} />}
                sx={{ height: 32, px: 1.75, borderRadius: "8px", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, textTransform: "none", bgcolor: T.wa, color: "#fff", boxShadow: "none", "&:hover": { bgcolor: "#1da855", boxShadow: "none" }, "&:disabled": { bgcolor: T.line, color: T.subtle } }}
              >
                Kirim Semua via WA
              </Button>
            )}
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={fetchLog} disabled={loading} sx={{ color: T.green, "&:hover": { bgcolor: T.greenLight } }}>
                {loading ? <CircularProgress size={16} sx={{ color: T.green }} /> : <RefreshRoundedIcon sx={{ fontSize: 17 }} />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* WA Progress */}
        {waSending && (
          <Box sx={{ px: 2.5, py: 1.25, borderBottom: `1px solid ${T.line}`, bgcolor: T.waBg, flexShrink: 0 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <WhatsAppIcon sx={{ fontSize: 14, color: T.wa }} />
                <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: 600, color: T.green }}>
                  {waProgress.customer || "Mengirim..."}
                </Typography>
              </Box>
              <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11.5, color: T.wa, fontWeight: 700 }}>
                {waProgress.current}/{waProgress.total}
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={waPercent} sx={{ height: 5, borderRadius: 3, bgcolor: T.waBorder, "& .MuiLinearProgress-bar": { bgcolor: T.wa, borderRadius: 3 } }} />
          </Box>
        )}

        {/* Pagination bar */}
        {logRows.length > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 0.75, borderBottom: `1px solid ${T.line}`, bgcolor: T.surface, flexWrap: "wrap", gap: 1, flexShrink: 0 }}>
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.muted }}>
              {filteredRows.length === 0 ? "0" : `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, filteredRows.length)}`} dari {filteredRows.length} file
              {wilayahFilter !== "all" && (
                <Box component="span" sx={{ ml: 0.75, color: T.brand, fontWeight: 600 }}>
                  - {wilayahFilter}
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
              <IconButton size="small" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} sx={{ width: 26, height: 26, color: T.brand, "&:disabled": { opacity: 0.3 } }}>
                <ChevronLeftRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11.5, color: T.ink, minWidth: 44, textAlign: "center" }}>
                {page + 1} / {totalPages || 1}
              </Typography>
              <IconButton size="small" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={(page + 1) >= totalPages} sx={{ width: 26, height: 26, color: T.brand, "&:disabled": { opacity: 0.3 } }}>
                <ChevronRightRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Box>
        )}

        {/* Empty state */}
        {logRows.length === 0 && !loading ? (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1.5, p: 6 }}>
            <PictureAsPdfRoundedIcon sx={{ fontSize: 42, color: T.subtle }} />
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: T.muted }}>
              Belum ada PDF
            </Typography>
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12.5, color: T.subtle, textAlign: "center" }}>
              Generate PDF terlebih dahulu dari halaman Generate PDF
            </Typography>
          </Box>
        ) : loading ? (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CircularProgress size={28} sx={{ color: T.green }} />
          </Box>
        ) : (
          <Box sx={{ overflow: "auto", flexGrow: 1, minHeight: 0 }}>
            <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_SANS, fontSize: 12.5 }}>
              <Box component="thead" sx={{ position: "sticky", top: 0, zIndex: 10 }}>
                <Box component="tr" sx={{ bgcolor: T.brandLight, borderBottom: `2px solid ${T.brandBorder}` }}>
                  {["No", "Customer", "No. WhatsApp", "Wilayah", "Jatuh Tempo", "Total Tagihan", "Aksi"].map((h, i) => (
                    <Box component="th" key={i} sx={{
                      color: T.brandDark, fontSize: 11, fontWeight: 700, px: 2, py: 1.25,
                      textAlign: h === "Total Tagihan" ? "right" : h === "Aksi" ? "center" : "left",
                      whiteSpace: "nowrap",
                      width: h === "Aksi" ? 120 : h === "No" ? 50 : h === "No. WhatsApp" ? 160 : undefined,
                    }}>
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {pagedRows.length === 0 ? (
                  <Box component="tr">
                    <Box component="td" colSpan={7} sx={{ py: 6, textAlign: "center" }}>
                      <Typography sx={{ fontFamily: FONT_SANS, fontSize: 13, color: T.muted, fontWeight: 600 }}>
                        Tidak ada data untuk wilayah ini
                      </Typography>
                      <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12, color: T.subtle, mt: 0.5 }}>
                        Coba pilih wilayah lain atau kembali ke "Semua wilayah"
                      </Typography>
                    </Box>
                  </Box>
                ) : pagedRows.map((row, i) => (
                  <Box component="tr" key={i} sx={{
                    borderBottom: `1px solid ${T.line}`,
                    bgcolor: i % 2 !== 0 ? T.surface : T.white,
                    transition: "background-color 0.12s ease",
                    "&:hover": { bgcolor: T.brandLight },
                    "&:last-child": { borderBottom: "none" },
                  }}>
                    <Box component="td" sx={{ px: 2, py: 1.1, color: T.subtle, fontSize: 11, fontWeight: 500, textAlign: "center", userSelect: "none" }}>
                      {page * rowsPerPage + i + 1}
                    </Box>
                    <Box component="td" sx={{ px: 2, py: 1.1 }}>
                      <Typography sx={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 700, color: T.ink }}>
                        {row.nama || "-"}
                      </Typography>
                    </Box>
                    <Box component="td" sx={{ px: 2, py: 1.1 }}>
                      <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11.5, color: row.nomor && row.nomor !== "TIDAK DITEMUKAN" ? T.brand : T.subtle, fontWeight: row.nomor && row.nomor !== "TIDAK DITEMUKAN" ? 600 : 400 }}>
                        {row.nomor && row.nomor !== "TIDAK DITEMUKAN" ? row.nomor : "-"}
                      </Typography>
                    </Box>
                    <Box component="td" sx={{ px: 2, py: 1.1 }}>
                      {row.wilayah && row.wilayah !== "CEK" ? (
                        <Box sx={{ display: "inline-block", px: 1, py: 0.25, borderRadius: "5px", bgcolor: T.brandLight, border: `1px solid ${T.brandBorder}` }}>
                          <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.brand, fontWeight: 600 }}>
                            {row.wilayah}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography sx={{ color: T.subtle, fontSize: 12, fontStyle: "italic" }}>-</Typography>
                      )}
                    </Box>
                    <Box component="td" sx={{ px: 2, py: 1.1 }}>
                      <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12, color: T.text, fontWeight: 500 }}>
                        {row.tempo || "-"}
                      </Typography>
                    </Box>
                    <Box component="td" sx={{ px: 2, py: 1.1, textAlign: "right" }}>
                      <Typography sx={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 700, color: T.green }}>
                        {row.total || "-"}
                      </Typography>
                    </Box>
                    <Box component="td" sx={{ px: 1.5, py: 1, textAlign: "center" }}>
                      <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                        {row.pdf && (
                          <Tooltip title="Buka PDF">
                            <IconButton size="small" component="a" href={`${API_RAW}${row.pdf}`} target="_blank" rel="noopener noreferrer"
                              sx={{ bgcolor: T.brandLight, color: T.brand, width: 28, height: 28, borderRadius: "7px", "&:hover": { bgcolor: T.brandBorder } }}>
                              <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {row.driveUrl && (
                          <Tooltip title="Google Drive">
                            <IconButton size="small" component="a" href={row.driveUrl} target="_blank" rel="noopener noreferrer"
                              sx={{ bgcolor: T.brandLight, color: T.brand, width: 28, height: 28, borderRadius: "7px", "&:hover": { bgcolor: T.brandBorder } }}>
                              <CloudDoneRoundedIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {!row.driveUrl && row.driveError && (
                          <Tooltip title={`Upload Drive gagal: ${row.driveError}`}>
                            <Box component="span">
                              <IconButton
                                size="small"
                                disabled
                                sx={{
                                  bgcolor: T.surface,
                                  color: T.subtle,
                                  width: 28,
                                  height: 28,
                                  borderRadius: "7px",
                                  "&.Mui-disabled": {
                                    bgcolor: T.surface,
                                    color: T.subtle,
                                    opacity: 1,
                                  },
                                }}
                              >
                                <CloudDoneRoundedIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Box>
                          </Tooltip>
                        )}
                        <Tooltip title={row.nomor && row.nomor !== "TIDAK DITEMUKAN" ? "Kirim via WA" : "Nomor WhatsApp tidak tersedia"}>
                          <Box component="span">
                            <IconButton size="small" onClick={() => openSendConfirm([row], "single")} disabled={waSending || !row.nomor || row.nomor === "TIDAK DITEMUKAN"}
                              sx={{
                                bgcolor: row.nomor && row.nomor !== "TIDAK DITEMUKAN" ? T.waBg : T.surface,
                                color: row.nomor && row.nomor !== "TIDAK DITEMUKAN" ? T.wa : T.subtle,
                                width: 28,
                                height: 28,
                                borderRadius: "7px",
                                "&:hover": { bgcolor: row.nomor && row.nomor !== "TIDAK DITEMUKAN" ? T.waBorder : T.surface },
                                "&.Mui-disabled": { bgcolor: T.surface, color: T.subtle, opacity: 1 },
                              }}>
                              <SendRoundedIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      <Dialog open={sendConfirm.open} onClose={closeSendConfirm} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "14px" } }}>
        <DialogTitle sx={{ fontFamily: FONT_SANS, fontWeight: 700, fontSize: 15, color: T.ink, pb: 1 }}>
          Konfirmasi Pengiriman
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12.5, color: T.text }}>
            {sendConfirm.mode === "bulk"
              ? `Apakah Anda yakin ingin mengirim ${sendConfirm.rows.length} PDF lewat WhatsApp?`
              : `Apakah Anda yakin ingin mengirim PDF ke ${sendConfirm.rows[0]?.nama || "customer"} lewat WhatsApp?`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 0 }}>
          <Button onClick={closeSendConfirm} disabled={waSending} sx={{ fontFamily: FONT_SANS, fontSize: 12, textTransform: "none", color: T.muted }}>
            Batal
          </Button>
          <Button
            onClick={confirmSendViaWA}
            variant="contained"
            disabled={waSending}
            startIcon={<WhatsAppIcon sx={{ fontSize: 15 }} />}
            sx={{ borderRadius: "8px", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, textTransform: "none", bgcolor: T.wa, boxShadow: "none", "&:hover": { bgcolor: "#1da855", boxShadow: "none" } }}
          >
            Ya, kirim
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={toast.severity} variant="filled" sx={{ borderRadius: "10px", fontFamily: FONT_SANS }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
