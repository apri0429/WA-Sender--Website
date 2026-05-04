import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2"
    },
    secondary: {
      main: "#10b981"
    },
    background: {
      default: "#f4f7fb",
      paper: "#ffffff"
    }
  },
  shape: {
    borderRadius: 16
  },
  typography: {
    fontFamily: `"Inter", "Roboto", "Arial", sans-serif`
  }
});

export default theme;