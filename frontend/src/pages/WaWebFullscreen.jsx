import { useEffect } from "react";

export default function WaWebFullscreen() {
  useEffect(() => {
    document.title = "WhatsApp Web";
  }, []);

  return (
    <iframe
      src="/wa-web"
      title="WhatsApp Web"
      style={{
        width: "100vw",
        height: "100vh",
        border: "none",
        display: "block",
        background: "#111b21",
      }}
      allow="clipboard-read; clipboard-write"
    />
  );
}
