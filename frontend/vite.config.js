import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../backend/frontend_dist",
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8098",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:8098",
        ws: true,
        changeOrigin: true,
      },
      "/wa-web": {
        target: "http://localhost:8098",
        changeOrigin: true,
      },
    },
  },
});
