import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#24476e",
      dark: "#1c2a3d",
      light: "#3a6fa6"
    },
    secondary: {
      main: "#b8955a"
    },
    background: {
      default: "#f4f5f7",
      paper: "#ffffff"
    }
  },
  shape: {
    borderRadius: 4
  },
  typography: {
    fontFamily: `"Inter", "Segoe UI", system-ui, -apple-system, Arial, sans-serif`,
    fontSize: 13
  }
});

export default theme;