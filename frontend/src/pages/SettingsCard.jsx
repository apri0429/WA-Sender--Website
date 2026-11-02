import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  Grid,
  InputAdornment,
  Snackbar,
  TextField,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CloudDoneRoundedIcon from "@mui/icons-material/CloudDoneRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";

// ─────────────────────────────────────────────
// Design Tokens (disamakan dengan Code 1)
// ─────────────────────────────────────────────
const FONT_SANS = "var(--font-sans)";
const FONT_MONO = "var(--font-mono)";

const T = {
  brand: "#24476e",
  brandLight: "#eef2f7",
  brandBorder: "#b9c8dc",
  brandDark: "#24476e",

  blue: "#2e5bba",
  blueBg: "#eef2f9",
  blueBorder: "#c5d0e6",

  amber: "#d97706",
  amberBg: "#fffbeb",
  amberBorder: "#fde68a",

  red: "#dc2626",
  redBg: "#fef2f2",
  redBorder: "#fecaca",

  violet: "#7c3aed",
  violetBg: "#f5f3ff",
  violetBorder: "#ddd6fe",

  sky: "#3a6fd8",
  skyBg: "#eef2f9",
  skyBorder: "#c5d0e6",

  teal: "#2a4585",
  tealBg: "#eef2f7",
  tealBorder: "#b9c8dc",

  rose: "#e11d48",
  roseBg: "#fff1f2",
  roseBorder: "#fecdd3",

  ink: "#0c111b",
  ink2: "#1c2433",
  text: "#374151",
  muted: "#6b7280",
  subtle: "#9ca3af",
  ghost: "#d1d5db",
  line: "#e3e6eb",
  surface: "#f9fafb",
  canvas: "#f3f4f6",
  white: "#ffffff",
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function extractDriveFolderId(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const match = raw.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : raw;
}

function maskSecret(value, visible = 6) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.length <= visible) return "•".repeat(raw.length);
  return `${"•".repeat(Math.max(raw.length - visible, 8))}${raw.slice(-visible)}`;
}

// ─────────────────────────────────────────────
// Reusable UI Atoms
// ─────────────────────────────────────────────
function normalizeDriveConfig(data = {}) {
  return {
    folderId: data.folderId || "",
    enabled: !!data.enabled,
    scriptUrl: data.scriptUrl || "",
    hasFolderId: !!(data.hasFolderId || data.folderId),
    hasScriptUrl: !!(data.hasScriptUrl || data.scriptUrl),
    folderIdMasked: data.folderIdMasked || (data.folderId ? maskSecret(data.folderId, 8) : ""),
    scriptUrlMasked: data.scriptUrlMasked || (data.scriptUrl ? maskSecret(data.scriptUrl, 10) : ""),
  };
}

function SettingsPanel({ title, action, sx = {}, children }) {
  return (
    <Box
      className="dashboard-panel"
      sx={{
        height: "100%",
        padding: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        borderRadius: "2px",
        background: T.white,
        border: "1px solid #d3d9e1",
        boxShadow: "none",
        ...sx,
      }}
    >
      <Box
        className="dashboard-panel__header"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          flexWrap: "nowrap",
          minHeight: 32,
          padding: "0 12px",
          borderBottom: "1px solid #c3ccd7",
          background: "#e4e9ef !important",
          flexShrink: 0,
          margin: 0,
        }}
      >
        <Typography
          className="dashboard-panel__title"
          noWrap
          sx={{
            margin: 0,
            fontFamily: FONT_SANS,
            fontSize: 12.5,
            fontWeight: 700,
            color: "#3c4a5c",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </Typography>
        <Box sx={{ flexShrink: 0, whiteSpace: "nowrap" }}>{action}</Box>
      </Box>
      <Box sx={{ padding: "12px", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {children}
      </Box>
    </Box>
  );
}

function StatusPill({ label, color = "gray" }) {
  const map = {
    green: { bg: T.brandLight, text: T.brandDark, dot: T.brand },
    amber: { bg: T.amberBg, text: T.amber, dot: T.amber },
    red: { bg: T.redBg, text: T.red, dot: T.red },
    blue: { bg: T.blueBg, text: T.blue, dot: T.blue },
    violet: { bg: T.violetBg, text: T.violet, dot: T.violet },
    gray: { bg: T.canvas, text: T.muted, dot: T.ghost },
  };
  const s = map[color] || map.gray;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.6,
      }}
    >
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          bgcolor: s.dot,
        }}
      />
      <Typography
        sx={{
          fontFamily: FONT_SANS,
          fontSize: 12,
          fontWeight: 400,
          color: T.text,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function ActionBtn({
  children,
  variant = "solid",
  color = "brand",
  size = "md",
  sx = {},
  ...props
}) {
  const h = size === "sm" ? 26 : size === "lg" ? 32 : 30;
  const fs = size === "sm" ? 12 : size === "lg" ? 13.5 : 12.5;

  const solidColors = {
    brand: {
      bg: "linear-gradient(180deg, #3a6fa6 0%, #24476e 100%)",
      hover: "linear-gradient(180deg, #2a62a8 0%, #24476e 100%)",
      text: "#fff",
    },
    blue: {
      bg: "linear-gradient(180deg, #3a6fa6 0%, #24476e 100%)",
      hover: "linear-gradient(180deg, #2a62a8 0%, #24476e 100%)",
      text: "#fff",
    },
    violet: { bg: T.violet, hover: "#6d28d9", text: "#fff" },
    red: {
      bg: "linear-gradient(180deg, #fdfdfd 0%, #e6e9ed 100%)",
      hover: "linear-gradient(180deg, #ffffff 0%, #d9dee4 100%)",
      text: "#b42318",
      border: "#b4bcc6",
    },
    slate: { bg: T.ink2, hover: T.ink, text: "#fff" },
  };

  const outlineColors = {
    brand: { bg: T.white, hover: T.brandLight, text: T.brand, border: T.brandBorder },
    blue: { bg: T.white, hover: T.blueBg, text: T.blue, border: T.blueBorder },
    violet: { bg: T.white, hover: T.violetBg, text: T.violet, border: T.violetBorder },
    red: { bg: T.white, hover: T.redBg, text: T.red, border: T.redBorder },
    default: { bg: T.white, hover: T.surface, text: T.text, border: T.line },
  };

  if (variant === "outline") {
    const s = outlineColors[color] || outlineColors.default;
    return (
      <Button
        sx={{
          height: h,
          px: 2,
          borderRadius: "3px",
          fontFamily: FONT_SANS,
          fontSize: fs,
          fontWeight: 600,
          textTransform: "none",
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
          flexShrink: 0,
          color: s.text,
          background: "linear-gradient(180deg, #fdfdfd 0%, #e6e9ed 100%)",
          border: "1px solid #b4bcc6",
          boxShadow: "none",
          "&:hover": { background: "linear-gradient(180deg, #ffffff 0%, #d9dee4 100%)", borderColor: "#8d97a3", boxShadow: "none" },
          "&:disabled": { opacity: 0.4, pointerEvents: "none" },
          ...sx,
        }}
        {...props}
      >
        {children}
      </Button>
    );
  }

  const s = solidColors[color] || solidColors.brand;
  return (
    <Button
      variant="contained"
      sx={{
        height: h,
        px: 2,
        borderRadius: "3px",
        fontFamily: FONT_SANS,
        fontSize: fs,
        fontWeight: 600,
        textTransform: "none",
        letterSpacing: "-0.01em",
        whiteSpace: "nowrap",
        flexShrink: 0,
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border || "#24476e"}`,
        boxShadow: "none",
        "&:hover": { background: s.hover, boxShadow: "none" },
        "&:disabled": { background: T.canvas, color: T.ghost, boxShadow: "none" },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
}

function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 15, height: 15, padding: 0, flexShrink: 0,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        border: `1px solid ${checked ? "#24476e" : "#8d97a3"}`, borderRadius: 2,
        background: checked ? "#24476e" : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {checked && <CheckRoundedIcon sx={{ fontSize: 13, color: "#fff" }} />}
    </button>
  );
}

const fieldStyle = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "2px",
    bgcolor: T.white,
    fontFamily: FONT_SANS,
    fontSize: 13,
    "& fieldset": { borderColor: "#b4bcc6" },
    "&:hover fieldset": { borderColor: "#8d97a3" },
    "&.Mui-focused": { bgcolor: T.white },
    "&.Mui-focused fieldset": { borderColor: T.brand, borderWidth: "1.5px" },
  },
  "& .MuiInputLabel-root": { fontFamily: FONT_SANS, fontSize: 13.5 },
  "& .MuiInputLabel-root.Mui-focused": { color: T.brand },
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function SettingsCard({
  open = true,
  onClose,
  delay: controlledDelay,
  setDelay: setControlledDelay,
  template: controlledTemplate,
  onSaveTemplate,
  gsheetUrl: controlledGsheetUrl,
  onSaveGsheet,
}) {
  const isStandalone = typeof setControlledDelay !== "function";

  const [localDelay, setLocalDelay] = useState(controlledDelay || 4000);
  const [localTemplate, setLocalTemplate] = useState(controlledTemplate || "");
  const [localGsheet, setLocalGsheet] = useState(controlledGsheetUrl || "");
  const [localGsheetConfigured, setLocalGsheetConfigured] = useState(!!controlledGsheetUrl);
  const [localGsheetMeta, setLocalGsheetMeta] = useState({
    selectedSheet: "",
    autoSync: false,
  });

  const [editingUrl, setEditingUrl] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [editingDrive, setEditingDrive] = useState(false);
  const [driveDraft, setDriveDraft] = useState(() => normalizeDriveConfig());

  const [driveConfig, setDriveConfig] = useState(() => normalizeDriveConfig());
  const [driveLoading, setDriveLoading] = useState(false);
  const [hasLogo, setHasLogo] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const logoRef = useRef(null);

  const currentDriveConfig = editingDrive ? driveDraft : driveConfig;
  const currentHasScriptUrl = !!(currentDriveConfig.scriptUrl || currentDriveConfig.hasScriptUrl);
  const currentHasFolderId = !!(currentDriveConfig.folderId || currentDriveConfig.hasFolderId);
  const driveReady = !!currentDriveConfig.enabled && currentHasScriptUrl && currentHasFolderId;
  const driveStatusLabel = driveReady
    ? "Siap upload"
    : currentHasScriptUrl
      ? currentDriveConfig.enabled
        ? "Folder belum diisi"
        : "Nonaktif"
      : currentHasFolderId
        ? "Script belum diisi"
        : "Belum diisi";
  const driveStatusColor = driveReady
    ? "blue"
    : currentHasScriptUrl || currentHasFolderId
      ? "amber"
      : "gray";

  const showToast = (msg, sev = "success") =>
    setToast({ open: true, message: msg, severity: sev });

  useEffect(() => {
    setLocalDelay(controlledDelay || 4000);
  }, [controlledDelay]);

  useEffect(() => {
    setLocalTemplate(controlledTemplate || "");
  }, [controlledTemplate]);

  useEffect(() => {
    setLocalGsheet(controlledGsheetUrl || "");
  }, [controlledGsheetUrl]);

  useEffect(() => {
    if (!isStandalone) return;
    let active = true;

    const loadInitial = async () => {
      try {
        const [templateRes, gsheetRes, driveRes, pdfStatusRes] = await Promise.allSettled([
          api.get("/template"),
          api.get("/gsheet"),
          api.get("/pdf/drive-config"),
          api.get("/pdf/status"),
        ]);

        if (!active) return;

        if (templateRes.status === "fulfilled") {
          setLocalTemplate(templateRes.value?.data?.template || "");
        }

        if (gsheetRes.status === "fulfilled") {
          const d = gsheetRes.value?.data || {};
          setLocalGsheet(d.url || "");
          setLocalGsheetConfigured(!!d.configured);
          setLocalGsheetMeta({
            selectedSheet: d.selectedSheet || "",
            autoSync: !!d.autoSync,
          });
        }

        if (driveRes.status === "fulfilled") {
          const d = driveRes.value?.data || {};
          const nextDriveConfig = normalizeDriveConfig(d);
          setDriveConfig(nextDriveConfig);
          setDriveDraft(nextDriveConfig);
        }

        if (pdfStatusRes.status === "fulfilled") {
          setHasLogo(!!pdfStatusRes.value?.data?.hasLogo);
        }
      } catch {
        // intentional
      }
    };

    loadInitial();

    return () => {
      active = false;
    };
  }, [isStandalone]);

  const currentDelay = isStandalone ? localDelay : controlledDelay;

  const handleDelayChange = (value) => {
    if (isStandalone) setLocalDelay(value);
    else setControlledDelay(value);
  };

  const handleSaveTemplate = async () => {
    try {
      if (typeof onSaveTemplate === "function") {
        onSaveTemplate(localTemplate);
      } else {
        await api.post("/template", { template: localTemplate });
      }
      showToast("Template berhasil disimpan", "success");
    } catch {
      showToast("Gagal menyimpan template", "error");
    }
  };

  const handleSaveGsheet = async () => {
    const urlToSave = urlDraft.trim();
    if (!urlToSave) return;
    try {
      if (typeof onSaveGsheet === "function") {
        onSaveGsheet(urlToSave);
        setLocalGsheetConfigured(true);
      } else {
        const res = await api.post("/gsheet", {
          url: urlToSave,
          selectedSheet: localGsheetMeta.selectedSheet || "",
          autoSync: !!localGsheetMeta.autoSync,
        });
        const cfg = res?.data?.config || {};
        // Server never echoes the raw URL back — only a masked display
        // string — so the real link never lingers in frontend state.
        setLocalGsheet(cfg.url || "");
        setLocalGsheetConfigured(!!cfg.configured);
      }

      setEditingUrl(false);
      setUrlDraft("");
      showToast("URL Google Sheet berhasil disimpan", "success");
    } catch {
      showToast("Gagal menyimpan URL Google Sheet", "error");
    }
  };

  const handleSaveDriveConfig = async () => {
    setDriveLoading(true);
    try {
      await api.post("/pdf/drive-config", driveDraft);
      const refreshed = await api.get("/pdf/drive-config");
      const nextDriveConfig = normalizeDriveConfig(refreshed?.data || {});
      setDriveConfig(nextDriveConfig);
      setDriveDraft(nextDriveConfig);
      setEditingDrive(false);
      showToast("Konfigurasi Google Drive disimpan", "success");
    } catch {
      showToast("Gagal menyimpan konfigurasi Google Drive", "error");
    } finally {
      setDriveLoading(false);
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
      showToast("Logo PDF berhasil disimpan", "success");
    } catch {
      showToast("Gagal upload logo PDF", "error");
    } finally {
      setLogoLoading(false);
    }
  };

  const handleDeleteLogo = async () => {
    setLogoLoading(true);
    try {
      await api.delete("/pdf/logo");
      setHasLogo(false);
      showToast("Logo PDF dihapus", "success");
    } catch {
      showToast("Gagal menghapus logo PDF", "error");
    } finally {
      setLogoLoading(false);
    }
  };

  const handleStartEdit = () => {
    setUrlDraft("");
    setEditingUrl(true);
  };

  const handleCancelEdit = () => {
    setUrlDraft("");
    setEditingUrl(false);
  };

  const handleStartDriveEdit = () => {
    setDriveDraft({ ...driveConfig, scriptUrl: "", folderId: "" });
    setEditingDrive(true);
  };

  const handleCancelDriveEdit = () => {
    setDriveDraft(driveConfig);
    setEditingDrive(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      slotProps={{ backdrop: { sx: { background: "rgba(10, 18, 40, 0.68)" } } }}
      PaperProps={{
        sx: {
          borderRadius: "2px",
          maxHeight: "95vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 8px 30px rgba(10, 18, 40, 0.3)",
          border: "1px solid #1c2a3d",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          px: 2,
          py: 1,
          background: "#1c2a3d",
          borderBottom: "2px solid #d4b06a",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
          <Typography sx={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>
            Pengaturan
          </Typography>
          <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: "rgba(255,255,255,0.7)" }}>
            Aplikasi
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            width: 26,
            height: 26,
            borderRadius: "2px",
            color: "rgba(255,255,255,0.85)",
            "&:hover": { background: "rgba(255,255,255,0.14)", color: "#fff" },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          fontFamily: FONT_SANS,
          p: 1.5,
          bgcolor: "#eef1f5",
          boxSizing: "border-box",
          overflow: "hidden",
          flex: 1,
          minHeight: 0,
          "&, & *": {
            boxSizing: "border-box",
          },
        }}
      >
      <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoUpload} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        <Grid container spacing={1.25}>
          <Grid item xs={12} sm={6} lg={3}>
            <SettingsPanel
              title="Jeda Antar Pesan"
              action={<StatusPill label={`${currentDelay} ms`} color="blue" />}
            >
              <Box sx={{ mb: 1 }}>
                <Typography
                  sx={{
                    fontFamily: FONT_SANS,
                    fontSize: 12,
                    color: T.muted,
                    lineHeight: 1.45,
                  }}
                >
                  Minimal <strong>3000 ms</strong> agar tidak diblokir.
                </Typography>
              </Box>

              <TextField
                label="Jeda Antar Pesan"
                type="number"
                value={currentDelay}
                onChange={(e) => handleDelayChange(e.target.value)}
                fullWidth
                size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography
                        sx={{
                          fontFamily: FONT_MONO,
                          fontSize: 12,
                          color: T.subtle,
                        }}
                      >
                        ms
                      </Typography>
                    </InputAdornment>
                  ),
                }}
                sx={{ ...fieldStyle, mb: 1 }}
              />

              <Typography
                sx={{
                  fontFamily: FONT_SANS,
                  fontSize: 11.5,
                  color: T.subtle,
                  fontStyle: "italic",
                  mt: "auto",
                }}
              >
                Tersimpan otomatis
              </Typography>
            </SettingsPanel>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <SettingsPanel
              title="Template Pesan"
              action={
                <StatusPill
                  label={localTemplate ? "Sudah diisi" : "Belum diisi"}
                  color={localTemplate ? "green" : "gray"}
                />
              }
            >
              <Box sx={{ mb: 1 }}>
                <Typography
                  sx={{
                    fontFamily: FONT_SANS,
                    fontSize: 12,
                    color: T.muted,
                    lineHeight: 1.45,
                  }}
                >
                  Gunakan <strong>{"{nama}"}</strong> untuk personalisasi pesan.
                </Typography>
              </Box>

              <TextField
                multiline
                minRows={3}
                maxRows={3}
                fullWidth
                value={localTemplate}
                onChange={(e) => setLocalTemplate(e.target.value)}
                placeholder="Halo {nama}, berikut informasi untuk Anda..."
                sx={{
                  ...fieldStyle,
                  "& .MuiOutlinedInput-root": {
                    ...fieldStyle["& .MuiOutlinedInput-root"],
                    alignItems: "flex-start",
                    px: 1.5,
                    py: 0.75,
                    "&.Mui-focused fieldset": { borderColor: T.brand, borderWidth: "1.5px" },
                  },
                  "& .MuiOutlinedInput-input": { padding: 0 },
                  "& .MuiInputLabel-root.Mui-focused": { color: T.brand },
                  mb: 1,
                }}
              />

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: "auto" }}>
                <ActionBtn
                  color="brand"
                  size="md"
                  startIcon={<SaveRoundedIcon sx={{ fontSize: "16px !important" }} />}
                  onClick={handleSaveTemplate}
                >
                  Simpan Template
                </ActionBtn>
              </Box>
            </SettingsPanel>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <SettingsPanel
              title="Google Sheet"
              action={
                <StatusPill
                  label={localGsheetConfigured ? "Terhubung" : "Belum diisi"}
                  color={localGsheetConfigured ? "green" : "amber"}
                />
              }
            >
              <Box sx={{ mb: 1 }}>
                <Typography
                  sx={{
                    fontFamily: FONT_SANS,
                    fontSize: 12,
                    color: T.muted,
                    lineHeight: 1.45,
                  }}
                >
                  Tempel URL Google Sheet yang sudah dibagikan.
                </Typography>
              </Box>

              {!editingUrl ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.5,
                    py: 0.75,
                    borderRadius: "3px",
                    bgcolor: T.surface,
                    border: `1px solid ${T.line}`,
                    mb: 1,
                  }}
                >
                  <LockRoundedIcon sx={{ fontSize: 16, color: T.subtle, flexShrink: 0 }} />
                  <Typography
                    sx={{
                      fontFamily: FONT_SANS,
                      fontSize: 13,
                      color: localGsheetConfigured ? T.text : T.subtle,
                      flex: 1,
                      fontStyle: localGsheetConfigured ? "normal" : "italic",
                      letterSpacing: localGsheetConfigured ? "0.02em" : "normal",
                      wordBreak: "break-all",
                    }}
                  >
                    {localGsheetConfigured ? localGsheet : "URL belum diisi"}
                  </Typography>

                  <Tooltip title="Ubah URL" placement="top">
                    <IconButton
                      size="small"
                      onClick={handleStartEdit}
                      sx={{
                        color: "#2b3540",
                        background: "linear-gradient(180deg, #fdfdfd 0%, #e6e9ed 100%)",
                        border: "1px solid #b4bcc6",
                        borderRadius: "3px",
                        width: 26,
                        height: 26,
                        flexShrink: 0,
                        "&:hover": { background: "linear-gradient(180deg, #ffffff 0%, #d9dee4 100%)" },
                      }}
                    >
                      <EditRoundedIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              ) : (
                <Box sx={{ mb: 1 }}>
                  <TextField
                    fullWidth
                    autoFocus
                    size="small"
                    value={urlDraft}
                    onChange={(e) => setUrlDraft(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LinkRoundedIcon sx={{ color: T.brand, fontSize: 18 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Batal" placement="top">
                            <IconButton
                              size="small"
                              onClick={handleCancelEdit}
                              sx={{ color: T.subtle, "&:hover": { color: T.red } }}
                            >
                              <CloseRoundedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      ...fieldStyle,
                      "& .MuiOutlinedInput-root": {
                        ...fieldStyle["& .MuiOutlinedInput-root"],
                        "&.Mui-focused fieldset": {
                          borderColor: T.brand,
                          borderWidth: "1.5px",
                        },
                      },
                      "& .MuiInputLabel-root.Mui-focused": { color: T.brand },
                    }}
                  />
                </Box>
              )}

              {editingUrl && (
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: "auto" }}>
                  <ActionBtn
                    color="brand"
                    size="md"
                    startIcon={<CheckRoundedIcon sx={{ fontSize: "16px !important" }} />}
                    onClick={handleSaveGsheet}
                    disabled={!urlDraft.trim()}
                  >
                    Simpan URL Baru
                  </ActionBtn>
                </Box>
              )}
            </SettingsPanel>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <SettingsPanel
              title="Logo PDF"
              action={<StatusPill label={hasLogo ? "Terpasang" : "Belum ada"} color={hasLogo ? "green" : "gray"} />}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: "3px",
                  bgcolor: T.surface,
                  border: `1px solid ${T.line}`,
                  mb: 1,
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "3px",
                    border: `1px solid ${T.line}`,
                    bgcolor: T.white,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  {hasLogo ? <CheckCircleOutlineRoundedIcon sx={{ fontSize: 18, color: T.brand }} /> : <ImageRoundedIcon sx={{ fontSize: 18, color: T.subtle }} />}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: T.ink2 }}>
                    {hasLogo ? "Logo PDF aktif" : "Belum ada logo PDF"}
                  </Typography>
                  <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>
                    {hasLogo ? "Logo ini akan tampil di header PDF yang digenerate." : "Upload PNG atau JPG untuk dipakai di header PDF."}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: "auto" }}>
                <ActionBtn
                  color="brand"
                  size="md"
                  onClick={() => logoRef.current?.click()}
                  disabled={logoLoading}
                  startIcon={logoLoading ? <CircularProgress size={14} color="inherit" /> : <ImageRoundedIcon sx={{ fontSize: "16px !important" }} />}
                  sx={{ flex: 1, minWidth: 0, flexShrink: 1, px: 1.25 }}
                >
                  {hasLogo ? "Ganti Logo" : "Upload Logo"}
                </ActionBtn>

                {hasLogo && (
                  <ActionBtn
                    color="red"
                    size="md"
                    onClick={handleDeleteLogo}
                    disabled={logoLoading}
                    startIcon={<DeleteForeverRoundedIcon sx={{ fontSize: "16px !important" }} />}
                    sx={{ flex: 1, minWidth: 0, flexShrink: 1, px: 1.25 }}
                  >
                    Hapus Logo
                  </ActionBtn>
                )}
              </Box>
            </SettingsPanel>
          </Grid>
        </Grid>

        <SettingsPanel
          title="Google Drive Integration"
          action={
            <StatusPill
              label={driveStatusLabel}
              color={driveStatusColor}
            />
          }
        >
            <Box sx={{ mb: 1 }}>
              <Typography
                sx={{
                  fontFamily: FONT_SANS,
                  fontSize: 12,
                  color: T.muted,
                  lineHeight: 1.45,
                }}
              >
                Upload otomatis PDF yang digenerate ke folder Google Drive.
              </Typography>
            </Box>

            {!editingDrive ? (
              <>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.5,
                    py: 0.75,
                    borderRadius: "3px",
                    bgcolor: T.surface,
                    border: `1px solid ${T.line}`,
                    mb: 1,
                  }}
                >
                  <LockRoundedIcon sx={{ fontSize: 16, color: T.subtle, flexShrink: 0 }} />
                  <Typography
                    sx={{
                      fontFamily: FONT_SANS,
                      fontSize: 13,
                      color: driveConfig.hasScriptUrl || driveConfig.hasFolderId ? T.text : T.subtle,
                      flex: 1,
                      fontStyle: driveConfig.hasScriptUrl || driveConfig.hasFolderId ? "normal" : "italic",
                      letterSpacing: driveConfig.hasScriptUrl || driveConfig.hasFolderId ? "0.02em" : "normal",
                      wordBreak: "break-all",
                    }}
                  >
                    {driveConfig.hasScriptUrl || driveConfig.hasFolderId
                      ? `Apps Script: ${driveConfig.scriptUrlMasked || "tersimpan"} | Folder: ${driveConfig.folderIdMasked || "tersimpan"}`
                      : "Konfigurasi Drive belum diisi"}
                  </Typography>

                  <Tooltip title="Ubah konfigurasi" placement="top">
                    <IconButton
                      size="small"
                      onClick={handleStartDriveEdit}
                      sx={{
                        color: "#2b3540",
                        background: "linear-gradient(180deg, #fdfdfd 0%, #e6e9ed 100%)",
                        border: "1px solid #b4bcc6",
                        borderRadius: "3px",
                        width: 26,
                        height: 26,
                        flexShrink: 0,
                        "&:hover": { background: "linear-gradient(180deg, #ffffff 0%, #d9dee4 100%)" },
                      }}
                    >
                      <EditRoundedIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </>
            ) : (
              <Box sx={{ mb: 1 }}>
                <TextField
                  label="Apps Script URL"
                  fullWidth
                  size="small"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={driveDraft.scriptUrl}
                  onChange={(e) => setDriveDraft((p) => ({ ...p, scriptUrl: e.target.value }))}
                  helperText={driveDraft.hasScriptUrl ? `Tersimpan: ${driveDraft.scriptUrlMasked || "disembunyikan"}. Kosongkan jika tidak ingin mengubah.` : ""}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LinkRoundedIcon sx={{ fontSize: 18, color: T.subtle }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Batal" placement="top">
                          <IconButton
                            size="small"
                            onClick={handleCancelDriveEdit}
                            sx={{ color: T.subtle, "&:hover": { color: T.red } }}
                          >
                            <CloseRoundedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ ...fieldStyle, mb: 0.75 }}
                />

                <TextField
                  label="Folder ID / Link Folder"
                  fullWidth
                  size="small"
                  placeholder="https://drive.google.com/drive/folders/... atau ID folder"
                  value={driveDraft.folderId}
                  onChange={(e) => setDriveDraft((p) => ({ ...p, folderId: extractDriveFolderId(e.target.value) }))}
                  helperText={driveDraft.hasFolderId ? `Tersimpan: ${driveDraft.folderIdMasked || "disembunyikan"}. Kosongkan jika tidak ingin mengubah.` : ""}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FolderOpenRoundedIcon sx={{ fontSize: 18, color: T.subtle }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ ...fieldStyle, mb: 0.75 }}
                />
              </Box>
            )}

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <ToggleSwitch
                  checked={currentDriveConfig.enabled}
                  onChange={(next) =>
                    editingDrive
                      ? setDriveDraft((p) => ({ ...p, enabled: next }))
                      : setDriveConfig((p) => ({ ...p, enabled: next }))
                  }
                />
                <Typography
                  sx={{
                    fontFamily: FONT_SANS,
                    fontSize: 13,
                    color: currentDriveConfig.enabled ? T.ink2 : T.muted,
                    fontWeight: currentDriveConfig.enabled ? 600 : 400,
                  }}
                >
                  {currentDriveConfig.enabled ? "Upload ke Drive Aktif" : "Upload ke Drive Nonaktif"}
                </Typography>
              </Box>
              <ActionBtn
                color="blue"
                size="lg"
                startIcon={<SaveRoundedIcon sx={{ fontSize: "18px !important" }} />}
                onClick={editingDrive ? handleSaveDriveConfig : handleStartDriveEdit}
                disabled={driveLoading || (editingDrive && !driveDraft.scriptUrl.trim() && !driveDraft.hasScriptUrl)}
              >
                {editingDrive ? "Simpan Config" : "Ubah Setting"}
              </ActionBtn>
            </Box>

            {currentDriveConfig.enabled && !currentHasScriptUrl && (
              <Alert severity="warning" sx={{ fontFamily: FONT_SANS, fontSize: 12.5, mb: 1, borderRadius: "3px" }}>
                Harap isi Apps Script URL agar upload otomatis dapat berfungsi.
              </Alert>
            )}

            {currentDriveConfig.enabled && currentHasScriptUrl && !currentHasFolderId && (
              <Alert severity="warning" sx={{ fontFamily: FONT_SANS, fontSize: 12.5, mb: 1, borderRadius: "3px" }}>
                Isi link atau ID folder Google Drive dulu agar file tahu harus diupload ke folder mana.
              </Alert>
            )}

            {driveReady && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.25,
                  py: 0.75,
                  borderRadius: "3px",
                  bgcolor: "#f4f6f9",
                  border: `1px solid ${T.line}`,
                }}
              >
                <CloudDoneRoundedIcon sx={{ fontSize: 18, color: "#25a244" }} />
                <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12.5, color: T.ink2, fontWeight: 600 }}>
                  Apps Script telah diatur.
                </Typography>
              </Box>
            )}
        </SettingsPanel>
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          sx={{
            fontFamily: FONT_SANS,
            fontWeight: 500,
            fontSize: 13,
            borderRadius: "4px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
            letterSpacing: "-0.01em",
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
      </DialogContent>
    </Dialog>
  );
}
