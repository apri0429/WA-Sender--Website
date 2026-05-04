import { AppBar, Box, Chip, Toolbar, Typography } from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

export default function Header({ whatsappReady }) {
  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: "white", color: "text.primary", borderBottom: "1px solid #e5e7eb" }}>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "14px",
              display: "grid",
              placeItems: "center",
              bgcolor: "#e8f5e9",
              color: "#25D366"
            }}
          >
            <WhatsAppIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              WhatsApp Invoice Blast
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Website React + MUI untuk kirim tagihan massal
            </Typography>
          </Box>
        </Box>

        <Chip
          label={whatsappReady ? "WhatsApp Connected" : "Not Connected"}
          color={whatsappReady ? "success" : "error"}
          variant="filled"
        />
      </Toolbar>
    </AppBar>
  );
}