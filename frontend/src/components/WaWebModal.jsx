import { useEffect, useRef, useState } from "react";
import socket from "../services/socket";

export default function WaWebModal() {
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [waReady, setWaReady] = useState(false);
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  // Dimensi viewport Puppeteer yang sebenarnya — untuk scaling koordinat
  const vpRef = useRef({ w: 1280, h: 800 });

  // Track WA ready state
  useEffect(() => {
    const onReady = () => setWaReady(true);
    const onDisconnect = () => setWaReady(false);
    socket.on("wa-ready", onReady);
    socket.on("wa-disconnected", onDisconnect);
    return () => {
      socket.off("wa-ready", onReady);
      socket.off("wa-disconnected", onDisconnect);
    };
  }, []);

  // Screencast + viewport listener — hanya aktif saat modal terbuka
  useEffect(() => {
    if (!open) return;

    const onViewport = ({ width, height }) => {
      vpRef.current = { w: width, h: height };
    };

    const onScreen = ({ data }) => {
      if (!imgRef.current) return;
      imgRef.current.src = `data:image/jpeg;base64,${data}`;
      setConnected(true);
    };

    socket.on("wa-viewport", onViewport);
    socket.on("wa-screen", onScreen);
    socket.emit("wa-screen-open");

    return () => {
      socket.off("wa-viewport", onViewport);
      socket.off("wa-screen", onScreen);
      socket.emit("wa-screen-close");
      setConnected(false);
    };
  }, [open]);

  // Tutup dengan Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Konversi posisi klik/scroll dari display pixel → Puppeteer viewport pixel
  const toVpCoords = (clientX, clientY) => {
    const rect = imgRef.current.getBoundingClientRect();
    const { w, h } = vpRef.current;
    return {
      x: (clientX - rect.left) * (w / rect.width),
      y: (clientY - rect.top) * (h / rect.height),
    };
  };

  const handleClick = (e) => {
    if (!imgRef.current || !connected) return;
    containerRef.current?.focus();
    socket.emit("wa-click", toVpCoords(e.clientX, e.clientY));
  };

  const handleWheel = (e) => {
    if (!imgRef.current || !connected) return;
    e.preventDefault();
    const { x, y } = toVpCoords(e.clientX, e.clientY);
    socket.emit("wa-scroll", { x, y, deltaY: e.deltaY });
  };

  const handleKeyDown = (e) => {
    const special = [
      "Enter", "Backspace", "Delete",
      "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
      "Tab",
    ];
    if (e.key === "Escape") { setOpen(false); return; }
    if (special.includes(e.key)) {
      e.preventDefault();
      socket.emit("wa-key", { key: e.key });
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      socket.emit("wa-type", { text: e.key });
    }
  };

  return (
    <>
      {/* Floating WA button */}
      <button
        onClick={() => setOpen(true)}
        title="Buka WhatsApp Web"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: waReady ? "#25d366" : "#94a3b8",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.22)",
          zIndex: 1000,
          transition: "transform 0.15s, background 0.2s",
          color: "#fff",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {/* WhatsApp icon */}
        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.38 1.26 4.79L2.05 22l5.45-1.43c1.36.73 2.9 1.15 4.54 1.15 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2m0 18.18c-1.49 0-2.9-.4-4.12-1.1l-.3-.17-3.08.81.82-3.01-.19-.32a8.24 8.24 0 01-1.28-4.39c0-4.54 3.7-8.23 8.25-8.23s8.25 3.69 8.25 8.23-3.71 8.18-8.25 8.18m4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.54.07-.25-.12-1.05-.39-2-.12-1.36-.72-1.56-1.6-1.56-1.6-.11-.19-.01-.29.08-.39.08-.08.17-.21.26-.32.08-.1.11-.19.17-.32.05-.12.03-.23-.02-.32s-.56-1.35-.77-1.84c-.2-.48-.4-.41-.56-.42h-.48c-.17 0-.43.06-.66.31s-.86.84-.86 2.05.88 2.38 1 2.54c.12.17 1.72 2.63 4.17 3.69.58.25 1.04.4 1.39.51.58.19 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.21-.57.21-1.06.14-1.16-.07-.1-.23-.16-.48-.28"/>
        </svg>
      </button>

      {/* Modal */}
      {open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{
            width: "min(1120px, 96vw)",
            height: "min(740px, 94vh)",
            background: "#fff",
            borderRadius: 14,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
          }}>
            {/* Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 14px",
              background: "#075e54",
              flexShrink: 0,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: connected ? "#25d366" : "#fbbf24",
                flexShrink: 0,
              }} />
              <span style={{ fontWeight: 600, fontSize: 13.5, color: "#fff", flex: 1 }}>
                WhatsApp Web
              </span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>
                {connected ? "Klik area lalu ketik untuk berinteraksi" : "Memuat..."}
              </span>
              <button
                onClick={() => setOpen(false)}
                title="Tutup (Esc)"
                style={{
                  border: "none", background: "rgba(255,255,255,0.15)",
                  cursor: "pointer", color: "#fff", fontSize: 14,
                  borderRadius: 6, padding: "3px 8px", lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* Screencast */}
            <div
              ref={containerRef}
              tabIndex={0}
              onKeyDown={handleKeyDown}
              onWheel={handleWheel}
              style={{
                flex: 1,
                overflow: "hidden",
                outline: "none",
                background: "#f0f2f5",
                position: "relative",
              }}
            >
              {!connected && (
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: 12, color: "#94a3b8",
                }}>
                  <div style={{ fontSize: 44 }}>📱</div>
                  <div style={{ fontSize: 13 }}>
                    {waReady ? "Memuat tampilan WhatsApp..." : "WhatsApp belum login — buka Dashboard dulu"}
                  </div>
                </div>
              )}
              <img
                ref={imgRef}
                alt="WhatsApp Web"
                onClick={handleClick}
                style={{
                  display: connected ? "block" : "none",
                  width: "100%",
                  height: "100%",
                  objectFit: "fill",
                  userSelect: "none",
                  cursor: "default",
                  WebkitUserDrag: "none",
                }}
                draggable={false}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
