import { useRef, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

const BRAND = "#233971";
const BRAND_DARK = "#1c2f5c";
const BRAND_LIGHT = "#eaeff7";
const BRAND_BORDER = "#b3c1d8";

export default function UploadCard({ onUpload, fileInfo }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handlePick = () => inputRef.current?.click();

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    // reset so same file can be re-uploaded
    e.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <Box>
      {/* Drop zone */}
      <Box
        onClick={handlePick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          border: dragging ? `2px dashed ${BRAND}` : `2px dashed ${BRAND_BORDER}`,
          borderRadius: "16px",
          p: 3,
          textAlign: "center",
          bgcolor: dragging ? BRAND_LIGHT : "#ffffff",
          backgroundImage: dragging
            ? "radial-gradient(circle, rgba(35,57,113,0.18) 1px, transparent 1px)"
            : "radial-gradient(circle, rgba(179,193,216,0.55) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          cursor: "pointer",
          transition: "all 0.22s ease",
          boxShadow: dragging
            ? "0 0 0 4px rgba(35,57,113,0.08)"
            : "0 1px 4px rgba(35,57,113,0.08)",
          "&:hover": {
            borderColor: BRAND,
            bgcolor: "#f8fafe",
            backgroundImage: "radial-gradient(circle, rgba(35,57,113,0.18) 1px, transparent 1px)",
            boxShadow: "0 0 0 4px rgba(35,57,113,0.08)",
          },
          "&:hover .upload-icon-wrap": {
            transform: "scale(1.08)",
            bgcolor: "#dce5f5",
          },
        }}
      >
        <Box>
          {/* Icon */}
          <Box
            className="upload-icon-wrap"
            sx={{
              width: 56,
              height: 56,
              borderRadius: "16px",
              bgcolor: BRAND_LIGHT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 1.5,
              transition: "all 0.2s ease",
              boxShadow: { xs: "none", md: "0 10px 24px rgba(35,57,113,0.14)" },
              "& svg": { fontSize: 28, color: BRAND },
            }}
          >
            <UploadFileRoundedIcon />
          </Box>

          <Typography
            fontWeight={700}
            fontSize={14}
            sx={{ color: "#0f172a", fontFamily: "'DM Sans', sans-serif", mb: 0.5 }}
          >
            {dragging ? "Lepaskan file di sini" : "Upload file Excel"}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: "#94a3b8",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              mb: 2,
            }}
          >
            Drag & drop atau klik untuk memilih {"\u00b7"} <strong>.xlsx</strong>{" "}
            &amp; <strong>.xls</strong>
          </Typography>

          <Button
            variant="contained"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handlePick();
            }}
            sx={{
              borderRadius: "10px",
              fontWeight: 700,
              textTransform: "none",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              px: 2.5,
              py: 0.9,
              bgcolor: BRAND,
              boxShadow: "0 4px 12px rgba(35,57,113,0.28)",
              "&:hover": {
                bgcolor: BRAND_DARK,
                boxShadow: "0 6px 16px rgba(35,57,113,0.34)",
              },
            }}
          >
            Pilih File
          </Button>
        </Box>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          hidden
          onChange={handleChange}
        />
      </Box>

      {/* File info */}
      {fileInfo && (
        <Box
          sx={{
            mt: 2,
            p: 1.75,
            borderRadius: "14px",
            bgcolor: BRAND_LIGHT,
            border: `1px solid ${BRAND_BORDER}`,
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
          }}
        >
          {/* File icon */}
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              bgcolor: "#dce5f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              "& svg": { fontSize: 18, color: BRAND },
            }}
          >
            <InsertDriveFileRoundedIcon />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.25 }}>
              <CheckCircleRoundedIcon sx={{ fontSize: 14, color: BRAND }} />
              <Typography
                fontWeight={700}
                fontSize={13}
                sx={{
                  color: BRAND_DARK,
                  fontFamily: "'DM Sans', sans-serif",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {fileInfo.fileName}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: BRAND,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                opacity: 0.9,
              }}
            >
              {fileInfo.message}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
