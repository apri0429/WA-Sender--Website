import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import {
  Alert,
  Box,
  Button,
  CardContent,
  CircularProgress,
  Chip,
  Grid,
  InputAdornment,
  Snackbar,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  Switch,
} from "@mui/material";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import CloudDoneRoundedIcon from "@mui/icons-material/CloudDoneRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";

// ─────────────────────────────────────────────
// Design Tokens (disamakan dengan Code 1)
// ─────────────────────────────────────────────
const FONT_SANS = "'Plus Jakarta Sans', 'Inter', sans-serif";
const FONT_MONO = "'JetBrains Mono', 'Fira Code', monospace";

const T = {
  brand: "#233971",
  brandLight: "#eaeff7",
  brandBorder: "#b3c1d8",
  brandDark: "#1c2f5c",

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
  tealBg: "#eaeff7",
  tealBorder: "#b3c1d8",

  rose: "#e11d48",
  roseBg: "#fff1f2",
  roseBorder: "#fecdd3",

  ink: "#0c111b",
  ink2: "#1c2433",
  text: "#374151",
  muted: "#6b7280",
  subtle: "#9ca3af",
  ghost: "#d1d5db",
  line: "#e5e7eb",
  surface: "#f9fafb",
  canvas: "#f3f4f6",
  white: "#ffffff",
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function maskGsheetUrl(url) {
  if (!url) return "";
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const masked = parts
      .map((p, i) => {
        if (i === 2) return "••••••••••••";
        return p;
      })
      .join("/");
    return `${u.hostname}/${masked}`;
  } catch {
    const clean = url.replace(/^https?:\/\//, "");
    return clean.slice(0, 22) + "••••••••••••";
  }
}

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
function Panel({ children, sx = {}, ...props }) {
  return (
    <Box
      sx={{
        background: T.white,
        borderRadius: "16px",
        border: `1px solid ${T.line}`,
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)",
        transition: "box-shadow 0.25s ease, transform 0.25s ease",
        "&:hover": {
          boxShadow: "0 8px 30px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)",
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}

function SectionTitle({ icon, children, action, accentColor }) {
  const accent = accentColor || T.brand;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2.5,
        py: 2,
        borderBottom: `1px solid ${T.line}`,
        background: `linear-gradient(135deg, ${accent}08 0%, ${accent}03 100%)`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <Box
          sx={{
            width: 5,
            height: 18,
            borderRadius: "3px",
            background: `linear-gradient(180deg, ${accent} 0%, ${accent}99 100%)`,
            flexShrink: 0,
          }}
        />
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "8px",
            background: `linear-gradient(135deg, ${accent}18 0%, ${accent}08 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "& svg": { fontSize: 15, color: accent },
          }}
        >
          {icon}
        </Box>
        <Typography
          sx={{
            fontFamily: FONT_SANS,
            fontSize: 13.5,
            fontWeight: 600,
            color: T.ink,
            letterSpacing: "-0.01em",
          }}
        >
          {children}
        </Typography>
      </Box>
      {action}
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
        px: 1.25,
        py: 0.5,
        borderRadius: "20px",
        bgcolor: s.bg,
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
          fontSize: 11.5,
          fontWeight: 600,
          color: s.text,
          letterSpacing: "0.01em",
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
  const h = size === "sm" ? 32 : size === "lg" ? 44 : 38;
  const fs = size === "sm" ? 12.5 : size === "lg" ? 14 : 13;

  const solidColors = {
    brand: { bg: T.brand, hover: T.brandDark, text: "#fff" },
    blue: { bg: T.blue, hover: "#233971", text: "#fff" },
    violet: { bg: T.violet, hover: "#6d28d9", text: "#fff" },
    red: { bg: T.red, hover: "#b91c1c", text: "#fff" },
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
          borderRadius: "8px",
          fontFamily: FONT_SANS,
          fontSize: fs,
          fontWeight: 500,
          textTransform: "none",
          letterSpacing: "-0.01em",
          color: s.text,
          bgcolor: s.bg,
          border: `1px solid ${s.border}`,
          boxShadow: "none",
          "&:hover": { bgcolor: s.hover, boxShadow: "none" },
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
        borderRadius: "8px",
        fontFamily: FONT_SANS,
        fontSize: fs,
        fontWeight: 500,
        textTransform: "none",
        letterSpacing: "-0.01em",
        bgcolor: s.bg,
        color: s.text,
        boxShadow: "none",
        "&:hover": { bgcolor: s.hover, boxShadow: "none" },
        "&:disabled": { bgcolor: T.canvas, color: T.ghost, boxShadow: "none" },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
}

function DataRow({ label, value, mono = false }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        py: 1.1,
        borderBottom: `1px solid ${T.line}`,
        "&:last-child": { borderBottom: "none" },
        gap: 2,
      }}
    >
      <Typography
        sx={{
          fontFamily: FONT_SANS,
          fontSize: 12.5,
          color: T.subtle,
          flexShrink: 0,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: mono ? FONT_MONO : FONT_SANS,
          fontSize: mono ? 11.5 : 12.5,
          fontWeight: 500,
          color: T.ink2,
          textAlign: "right",
          wordBreak: "break-all",
        }}
      >
        {value || "—"}
      </Typography>
    </Box>
  );
}

const fieldStyle = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    bgcolor: T.white,
    fontFamily: FONT_SANS,
    fontSize: 13.5,
    "& fieldset": { borderColor: T.line },
    "&:hover fieldset": { borderColor: T.ghost },
    "&.Mui-focused fieldset": { borderColor: T.brand, borderWidth: "1.5px" },
  },
  "& .MuiInputLabel-root": { fontFamily: FONT_SANS, fontSize: 13.5 },
  "& .MuiInputLabel-root.Mui-focused": { color: T.brand },
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function SettingsCard({
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
  const [localGsheetMeta, setLocalGsheetMeta] = useState({
    selectedSheet: "",
    autoSync: false,
  });

  const [editingUrl, setEditingUrl] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [editingDrive, setEditingDrive] = useState(false);
  const [driveDraft, setDriveDraft] = useState({ folderId: "", enabled: false, scriptUrl: "" });

  const [driveConfig, setDriveConfig] = useState({ folderId: "", enabled: false, scriptUrl: "" });
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
  const driveReady = !!currentDriveConfig.enabled && !!currentDriveConfig.scriptUrl && !!currentDriveConfig.folderId;
  const driveStatusLabel = driveReady
    ? "Siap upload"
    : currentDriveConfig.scriptUrl
      ? currentDriveConfig.enabled
        ? "Folder belum diisi"
        : "Nonaktif"
      : currentDriveConfig.folderId
        ? "Script belum diisi"
        : "Belum diisi";
  const driveStatusColor = driveReady
    ? "blue"
    : currentDriveConfig.scriptUrl || currentDriveConfig.folderId
      ? "amber"
      : "gray";

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!document.getElementById("plus-jakarta-sans-font")) {
      const link = document.createElement("link");
      link.id = "plus-jakarta-sans-font";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;500&display=swap";
      document.head.appendChild(link);
    }
  }, []);

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
          setLocalGsheetMeta({
            selectedSheet: d.selectedSheet || "",
            autoSync: !!d.autoSync,
          });
        }

        if (driveRes.status === "fulfilled") {
          const d = driveRes.value?.data || {};
          const nextDriveConfig = { folderId: d.folderId || "", enabled: !!d.enabled, scriptUrl: d.scriptUrl || "" };
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
    try {
      const urlToSave = editingUrl ? urlDraft.trim() : localGsheet;

      if (typeof onSaveGsheet === "function") {
        onSaveGsheet(urlToSave);
      } else {
        await api.post("/gsheet", {
          url: urlToSave,
          selectedSheet: localGsheetMeta.selectedSheet || "",
          autoSync: !!localGsheetMeta.autoSync,
        });
      }

      setLocalGsheet(urlToSave);
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
      setDriveConfig(driveDraft);
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
    setDriveDraft(driveConfig);
    setEditingDrive(true);
  };

  const handleCancelDriveEdit = () => {
    setDriveDraft(driveConfig);
    setEditingDrive(false);
  };

  return (
    <Box
      sx={{
        fontFamily: FONT_SANS,
        p: 2,
        boxSizing: "border-box",
        "&, & *": {
          boxSizing: "border-box",
        },
      }}
    >
      <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoUpload} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} lg={4}>
            <Panel sx={{ height: "100%" }}>
          <SectionTitle
            icon={<AccessTimeRoundedIcon />}
            accentColor={T.brand}
            action={<StatusPill label="Min. 3000 ms" color="blue" />}
          >
            Jeda Antar Pesan
          </SectionTitle>

          <Box sx={{ p: 2.5 }}>
            <Box
              sx={{
                p: 1.75,
                borderRadius: "8px",
                bgcolor: T.brandLight,
                border: `1px solid ${T.brandBorder}`,
                mb: 2,
              }}
            >
              <Typography
                sx={{
                  fontFamily: FONT_SANS,
                  fontSize: 12.5,
                  color: T.brandDark,
                  lineHeight: 1.7,
                }}
              >
                Waktu tunggu sebelum pesan berikutnya dikirim. Minimal <strong>3000 ms</strong>{" "}
                untuk membantu menghindari pemblokiran.
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
              sx={fieldStyle}
            />
          </Box>
        </Panel>
          </Grid>

          <Grid item xs={12} lg={8}>
            <Panel sx={{ height: "100%" }}>
          <SectionTitle
            icon={<DescriptionRoundedIcon />}
            accentColor={T.brand}
            action={
              <StatusPill
                label={localTemplate ? "Sudah diisi" : "Belum diisi"}
                color={localTemplate ? "green" : "gray"}
              />
            }
          >
            Template Pesan
          </SectionTitle>

          <Box sx={{ p: 2.5 }}>
            <Box
              sx={{
                p: 1.75,
                borderRadius: "8px",
                bgcolor: T.brandLight,
                border: `1px solid ${T.brandBorder}`,
                mb: 2,
              }}
            >
              <Typography
                sx={{
                  fontFamily: FONT_SANS,
                  fontSize: 12.5,
                  color: T.brandDark,
                  lineHeight: 1.7,
                }}
              >
                Gunakan <strong>{"{nama}"}</strong> atau variabel lain untuk personalisasi pesan
                ke setiap pelanggan.
              </Typography>
            </Box>

            <TextField
              multiline
              minRows={8}
              fullWidth
              value={localTemplate}
              onChange={(e) => setLocalTemplate(e.target.value)}
              placeholder="Halo {nama}, berikut informasi untuk Anda..."
              sx={{
                ...fieldStyle,
                "& .MuiOutlinedInput-root": {
                  ...fieldStyle["& .MuiOutlinedInput-root"],
                  alignItems: "flex-start",
                  "&.Mui-focused fieldset": { borderColor: T.brand, borderWidth: "1.5px" },
                },
                "& .MuiInputLabel-root.Mui-focused": { color: T.brand },
                mb: 1.5,
              }}
            />

            <ActionBtn
              color="brand"
              size="md"
              startIcon={<SaveRoundedIcon sx={{ fontSize: "16px !important" }} />}
              onClick={handleSaveTemplate}
            >
              Simpan Template
            </ActionBtn>
          </Box>
        </Panel>
          </Grid>

          <Grid item xs={12} lg={7}>
            <Panel sx={{ height: "100%" }}>
          <SectionTitle
            icon={<TableChartRoundedIcon />}
            accentColor={T.brand}
            action={
              <StatusPill
                label={localGsheet ? "Terhubung" : "Belum diisi"}
                color={localGsheet ? "green" : "amber"}
              />
            }
          >
            Google Sheet
          </SectionTitle>

          <Box sx={{ p: 2.5 }}>
            <Box
              sx={{
                p: 1.75,
                borderRadius: "8px",
                bgcolor: T.brandLight,
                border: `1px solid ${T.brandBorder}`,
                mb: 2,
              }}
            >
              <Typography
                sx={{
                  fontFamily: FONT_SANS,
                  fontSize: 12.5,
                  color: T.brandDark,
                  lineHeight: 1.7,
                }}
              >
                Tempelkan URL Google Sheet yang sudah dibagikan secara publik atau memiliki akses
                yang sesuai.
              </Typography>
            </Box>

            {!editingUrl ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 1.25,
                  borderRadius: "8px",
                  bgcolor: T.surface,
                  border: `1px solid ${T.line}`,
                  mb: 1.5,
                }}
              >
                <LockRoundedIcon sx={{ fontSize: 16, color: T.subtle, flexShrink: 0 }} />
                <Typography
                  sx={{
                    fontFamily: FONT_SANS,
                    fontSize: 13,
                    color: localGsheet ? T.text : T.subtle,
                    flex: 1,
                    fontStyle: localGsheet ? "normal" : "italic",
                    letterSpacing: localGsheet ? "0.02em" : "normal",
                    wordBreak: "break-all",
                  }}
                >
                  {localGsheet ? maskGsheetUrl(localGsheet) : "URL belum diisi"}
                </Typography>

                <Tooltip title="Ubah URL" placement="top">
                  <IconButton
                    size="small"
                    onClick={handleStartEdit}
                    sx={{
                      color: T.brand,
                      bgcolor: T.brandLight,
                      border: `1px solid ${T.brandBorder}`,
                      borderRadius: "8px",
                      width: 30,
                      height: 30,
                      flexShrink: 0,
                      "&:hover": { bgcolor: "#d4ddef" },
                    }}
                  >
                    <EditRoundedIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            ) : (
              <Box sx={{ mb: 1.5 }}>
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

                <Typography
                  sx={{
                    fontFamily: FONT_SANS,
                    fontSize: 12,
                    color: T.subtle,
                    mt: 0.75,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <LockRoundedIcon sx={{ fontSize: 13 }} />
                  URL tidak akan ditampilkan penuh setelah disimpan demi keamanan.
                </Typography>
              </Box>
            )}

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
              <ActionBtn
                color="brand"
                size="md"
                startIcon={
                  editingUrl ? (
                    <CheckRoundedIcon sx={{ fontSize: "16px !important" }} />
                  ) : (
                    <SaveRoundedIcon sx={{ fontSize: "16px !important" }} />
                  )
                }
                onClick={handleSaveGsheet}
                disabled={editingUrl && !urlDraft.trim()}
              >
                {editingUrl ? "Simpan URL Baru" : "Simpan URL"}
              </ActionBtn>
            </Box>

            <Box
              sx={{
                borderRadius: "8px",
                border: `1px solid ${T.line}`,
                overflow: "hidden",
                bgcolor: T.surface,
                px: 1.5,
              }}
            >
              <DataRow label="Status koneksi" value={localGsheet ? "Terhubung" : "Belum diisi"} />
              <DataRow label="Sheet aktif" value={localGsheetMeta.selectedSheet || "—"} />
              <DataRow label="Auto sync" value={localGsheetMeta.autoSync ? "Aktif" : "Nonaktif"} />
            </Box>
          </Box>
        </Panel>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Panel sx={{ height: "100%" }}>
          <SectionTitle
            icon={<ImageRoundedIcon />}
            accentColor={T.brand}
            action={<StatusPill label={hasLogo ? "Terpasang" : "Belum ada"} color={hasLogo ? "green" : "gray"} />}
          >
            Logo PDF
          </SectionTitle>

          <Box sx={{ p: 2.5 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.75,
                borderRadius: "10px",
                bgcolor: T.surface,
                border: `1px solid ${T.line}`,
                mb: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "10px",
                  border: `1px solid ${T.line}`,
                  bgcolor: T.white,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                {hasLogo ? <CheckCircleOutlineRoundedIcon sx={{ fontSize: 24, color: T.brand }} /> : <ImageRoundedIcon sx={{ fontSize: 24, color: T.subtle }} />}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: T.ink2 }}>
                  {hasLogo ? "Logo PDF aktif" : "Belum ada logo PDF"}
                </Typography>
                <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
                  {hasLogo ? "Logo ini akan tampil di header PDF yang digenerate." : "Upload PNG atau JPG untuk dipakai di header PDF."}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <ActionBtn
                color="brand"
                size="md"
                onClick={() => logoRef.current?.click()}
                disabled={logoLoading}
                startIcon={logoLoading ? <CircularProgress size={14} color="inherit" /> : <ImageRoundedIcon sx={{ fontSize: "16px !important" }} />}
              >
                {hasLogo ? "Ganti Logo" : "Upload Logo"}
              </ActionBtn>

              {hasLogo && (
                <ActionBtn
                  variant="outline"
                  color="red"
                  size="md"
                  onClick={handleDeleteLogo}
                  disabled={logoLoading}
                  startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: "16px !important" }} />}
                >
                  Hapus Logo
                </ActionBtn>
              )}
            </Box>
          </Box>
        </Panel>
          </Grid>
        </Grid>

        <Panel>
          <SectionTitle
            icon={<CloudUploadRoundedIcon />}
            accentColor="#1a73e8"
            action={
              <StatusPill
                label={driveStatusLabel}
                color={driveStatusColor}
              />
            }
          >
            Google Drive Integration
          </SectionTitle>

          <Box sx={{ p: 2.5 }}>
            <Box
              sx={{
                p: 1.75,
                borderRadius: "8px",
                bgcolor: "#f0f4fc",
                border: "1px solid #d2e3fc",
                mb: 2,
              }}
            >
              <Typography
                sx={{
                  fontFamily: FONT_SANS,
                  fontSize: 12.5,
                  color: "#1a73e8",
                  lineHeight: 1.7,
                }}
              >
                Atur pengunggahan otomatis setiap PDF yang digenerate langsung ke folder Google Drive Anda.
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
                    py: 1.25,
                    borderRadius: "8px",
                    bgcolor: T.surface,
                    border: `1px solid ${T.line}`,
                    mb: 2,
                  }}
                >
                  <LockRoundedIcon sx={{ fontSize: 16, color: T.subtle, flexShrink: 0 }} />
                  <Typography
                    sx={{
                      fontFamily: FONT_SANS,
                      fontSize: 13,
                      color: driveConfig.scriptUrl || driveConfig.folderId ? T.text : T.subtle,
                      flex: 1,
                      fontStyle: driveConfig.scriptUrl || driveConfig.folderId ? "normal" : "italic",
                      letterSpacing: driveConfig.scriptUrl || driveConfig.folderId ? "0.02em" : "normal",
                      wordBreak: "break-all",
                    }}
                  >
                    {driveConfig.scriptUrl || driveConfig.folderId
                      ? `Apps Script: ${maskSecret(driveConfig.scriptUrl, 10)} | Folder: ${maskSecret(driveConfig.folderId, 8)}`
                      : "Konfigurasi Drive belum diisi"}
                  </Typography>

                  <Tooltip title="Ubah konfigurasi" placement="top">
                    <IconButton
                      size="small"
                      onClick={handleStartDriveEdit}
                      sx={{
                        color: "#1a73e8",
                        bgcolor: "#e8f0fe",
                        border: "1px solid #c5d8fb",
                        borderRadius: "8px",
                        width: 30,
                        height: 30,
                        flexShrink: 0,
                        "&:hover": { bgcolor: "#dbe7fd" },
                      }}
                    >
                      <EditRoundedIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Typography
                  sx={{
                    fontFamily: FONT_SANS,
                    fontSize: 12,
                    color: T.subtle,
                    mt: -1.1,
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <LockRoundedIcon sx={{ fontSize: 13 }} />
                  Konfigurasi tidak akan ditampilkan penuh setelah disimpan demi keamanan.
                </Typography>
              </>
            ) : (
              <Box sx={{ mb: 2 }}>
                <TextField
                  label="Apps Script URL"
                  fullWidth
                  size="small"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={driveDraft.scriptUrl}
                  onChange={(e) => setDriveDraft((p) => ({ ...p, scriptUrl: e.target.value }))}
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
                  sx={{ ...fieldStyle, mb: 1.5 }}
                />

                <TextField
                  label="Folder ID / Link Folder"
                  fullWidth
                  size="small"
                  placeholder="https://drive.google.com/drive/folders/... atau ID folder"
                  value={driveDraft.folderId}
                  onChange={(e) => setDriveDraft((p) => ({ ...p, folderId: extractDriveFolderId(e.target.value) }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FolderOpenRoundedIcon sx={{ fontSize: 18, color: T.subtle }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ ...fieldStyle, mb: 1.25 }}
                />

                <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12, color: T.subtle, display: "flex", alignItems: "center", gap: 0.5 }}>
                  <LockRoundedIcon sx={{ fontSize: 13 }} />
                  Link Drive tetap bisa ditempel langsung, tapi setelah disimpan akan ditampilkan dalam bentuk aman.
                </Typography>
              </Box>
            )}

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Switch
                  size="small"
                  checked={currentDriveConfig.enabled}
                  onChange={(e) =>
                    editingDrive
                      ? setDriveDraft((p) => ({ ...p, enabled: e.target.checked }))
                      : setDriveConfig((p) => ({ ...p, enabled: e.target.checked }))
                  }
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": { color: "#1a73e8" },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#1a73e8" },
                  }}
                />
                <Typography
                  sx={{
                    fontFamily: FONT_SANS,
                    fontSize: 13,
                    color: currentDriveConfig.enabled ? "#1a73e8" : T.muted,
                    fontWeight: currentDriveConfig.enabled ? 600 : 400,
                  }}
                >
                  {currentDriveConfig.enabled ? "Upload ke Drive Aktif" : "Upload ke Drive Nonaktif"}
                </Typography>
              </Box>
              <ActionBtn
                color="blue"
                size="md"
                startIcon={<SaveRoundedIcon sx={{ fontSize: "16px !important" }} />}
                onClick={editingDrive ? handleSaveDriveConfig : handleStartDriveEdit}
                disabled={driveLoading || (editingDrive && !driveDraft.scriptUrl.trim())}
              >
                {editingDrive ? "Simpan Config" : "Ubah Config"}
              </ActionBtn>
            </Box>

            {currentDriveConfig.enabled && !currentDriveConfig.scriptUrl && (
              <Alert severity="warning" sx={{ fontFamily: FONT_SANS, fontSize: 12.5, mb: 2, borderRadius: "8px" }}>
                Harap isi Apps Script URL agar upload otomatis dapat berfungsi.
              </Alert>
            )}

            {currentDriveConfig.enabled && currentDriveConfig.scriptUrl && !currentDriveConfig.folderId && (
              <Alert severity="warning" sx={{ fontFamily: FONT_SANS, fontSize: 12.5, mb: 2, borderRadius: "8px" }}>
                Isi link atau ID folder Google Drive dulu agar file tahu harus diupload ke folder mana.
              </Alert>
            )}

            {driveReady && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  px: 1.75,
                  py: 1.25,
                  borderRadius: "8px",
                  bgcolor: "#e8f0fe",
                  border: "1px solid #c5d8fb",
                }}
              >
                <CloudDoneRoundedIcon sx={{ fontSize: 18, color: "#1a73e8" }} />
                <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12.5, color: "#1a73e8", fontWeight: 600 }}>
                  Apps Script telah diatur.
                </Typography>
              </Box>
            )}
          </Box>
        </Panel>
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
            borderRadius: "10px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
            letterSpacing: "-0.01em",
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
