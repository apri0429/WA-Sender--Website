import { useEffect, useState } from "react";

export default function WaWebFullscreen() {
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    document.title = "WhatsApp Web";
  }, []);

  function openWaWeb() {
    window.open("https://web.whatsapp.com", "_blank", "noopener,noreferrer");
    setOpened(true);
  }

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "#111b21",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{
        background: "#202c33",
        borderRadius: 16,
        padding: "48px 40px",
        maxWidth: 420,
        width: "90%",
        textAlign: "center",
        boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
      }}>
        {/* WA Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "#25d366",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
          boxShadow: "0 4px 20px rgba(37,211,102,0.4)",
        }}>
          <svg viewBox="0 0 24 24" width="38" height="38" fill="white">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.38 1.26 4.79L2.05 22l5.45-1.43c1.36.73 2.9 1.15 4.54 1.15 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2m0 18.18c-1.49 0-2.9-.4-4.12-1.1l-.3-.17-3.08.81.82-3.01-.19-.32a8.24 8.24 0 01-1.28-4.39c0-4.54 3.7-8.23 8.25-8.23s8.25 3.69 8.25 8.23-3.71 8.18-8.25 8.18m4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.54.07-.25-.12-1.05-.39-2-.12-1.36-.72-1.56-1.6-1.56-1.6-.11-.19-.01-.29.08-.39.08-.08.17-.21.26-.32.08-.1.11-.19.17-.32.05-.12.03-.23-.02-.32s-.56-1.35-.77-1.84c-.2-.48-.4-.41-.56-.42h-.48c-.17 0-.43.06-.66.31s-.86.84-.86 2.05.88 2.38 1 2.54c.12.17 1.72 2.63 4.17 3.69.58.25 1.04.4 1.39.51.58.19 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.21-.57.21-1.06.14-1.16-.07-.1-.23-.16-.48-.28"/>
          </svg>
        </div>

        <h2 style={{ color: "#e9edef", fontSize: 20, fontWeight: 700, margin: "0 0 10px" }}>
          WhatsApp Web
        </h2>

        <p style={{ color: "#8696a0", fontSize: 13.5, lineHeight: 1.7, margin: "0 0 28px" }}>
          Buka WhatsApp Web langsung di tab baru untuk pengalaman{" "}
          <span style={{ color: "#25d366", fontWeight: 600 }}>tanpa delay</span>.
          Akun yang sama dengan dashboard — pesan real-time, responsif seperti WA asli.
        </p>

        <button
          onClick={openWaWeb}
          style={{
            width: "100%",
            padding: "14px 0",
            background: "#25d366",
            border: "none",
            borderRadius: 10,
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "background 0.15s",
            marginBottom: 14,
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#1da851"}
          onMouseLeave={e => e.currentTarget.style.background = "#25d366"}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          {opened ? "Buka Tab Baru Lagi" : "Buka WhatsApp Web"}
        </button>

        {opened && (
          <p style={{ color: "#25d366", fontSize: 12.5, margin: "0 0 16px" }}>
            ✓ Tab baru sudah dibuka
          </p>
        )}

        <div style={{
          background: "rgba(255,255,255,0.04)",
          borderRadius: 8,
          padding: "12px 14px",
          textAlign: "left",
        }}>
          <p style={{ color: "#667781", fontSize: 11.5, margin: 0, lineHeight: 1.8 }}>
            <strong style={{ color: "#8696a0" }}>Pertama kali?</strong><br />
            Scan QR yang muncul di tab baru menggunakan HP yang terhubung ke dashboard ini.
            Setelah itu browser kamu otomatis tersimpan — tidak perlu scan lagi.
          </p>
        </div>
      </div>
    </div>
  );
}
