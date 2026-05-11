import { useEffect, useState } from "react";
import api from "../services/api";
import {
  Alert,
  Box,
  Button,
  CardContent,
  Chip,
  InputAdornment,
  Snackbar,
  TextField,
  Typography,
  IconButton,
  Tooltip,
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

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

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
        const [templateRes, gsheetRes] = await Promise.allSettled([
          api.get("/template"),
          api.get("/gsheet"),
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

  const handleStartEdit = () => {
    setUrlDraft("");
    setEditingUrl(true);
  };

  const handleCancelEdit = () => {
    setUrlDraft("");
    setEditingUrl(false);
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
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Panel>
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

        <Panel>
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

        <Panel>
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

              {localGsheet && !editingUrl && (
                <ActionBtn
                  variant="outline"
                  color="brand"
                  size="md"
                  component="a"
                  href={localGsheet}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<OpenInNewRoundedIcon sx={{ fontSize: "15px !important" }} />}
                >
                  Buka Sheet
                </ActionBtn>
              )}
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
