import { useEffect, useRef, useState } from "react";
import socket from "../services/socket";

export default function WaWebModal() {
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [waReady, setWaReady] = useState(false);
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const frameSize = useRef({ w: 1280, h: 800 });

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

  // Screencast listener
  useEffect(() => {
    if (!open) return;

    const onScreen = ({ data, width, height }) => {
      if (!imgRef.current) return;
      frameSize.current = { w: width, h: height };
      imgRef.current.src = `data:image/jpeg;base64,${data}`;
      setConnected(true);
    };

    socket.on("wa-screen", onScreen);
    socket.emit("wa-screen-open");

    return () => {
      socket.off("wa-screen", onScreen);
      socket.emit("wa-screen-close");
      setConnected(false);
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const getCoords = (e) => {
    const rect = imgRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      vpW: rect.width,
      vpH: rect.height,
    };
  };

  const handleClick = (e) => {
    if (!imgRef.current) return;
    containerRef.current?.focus();
    socket.emit("wa-click", getCoords(e));
  };

  const handleWheel = (e) => {
    if (!imgRef.current) return;
    socket.emit("wa-scroll", { ...getCoords(e), deltaY: e.deltaY });
  };

  const handleKeyDown = (e) => {
    const special = ["Enter","Backspace","Delete","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Tab","Escape"];
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
      {/* Floating button */}
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
          boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
          zIndex: 1000,
          transition: "background 0.2s, transform 0.15s",
          color: "#fff",
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.08)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.557 4.118 1.529 5.845L.057 23.928l6.235-1.635A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.85 0-3.587-.485-5.089-1.333l-.361-.214-3.742.981.999-3.648-.235-.374A9.952 9.952 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
        </svg>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{
            width: "min(1100px, 96vw)",
            height: "min(720px, 92vh)",
            background: "#fff",
            borderRadius: 14,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
          }}>
            {/* Modal header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 16px",
              borderBottom: "1px solid #e2e8f0",
              background: "#f8fafc",
              flexShrink: 0,
              gap: 10,
            }}>
              <span style={{
                width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
                background: waReady && connected ? "#22c55e" : "#f59e0b",
              }} />
              <span style={{ fontWeight: 600, fontSize: 13.5, color: "#1e293b", flex: 1 }}>
                WhatsApp Web
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                {connected ? "Live — klik area chat lalu ketik" : "Memuat..."}
              </span>
              <button
                onClick={() => setOpen(false)}
                style={{
                  border: "none", background: "none", cursor: "pointer",
                  color: "#64748b", fontSize: 18, lineHeight: 1, padding: "2px 6px",
                  borderRadius: 6,
                }}
                title="Tutup (Esc)"
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
                cursor: "default",
              }}
            >
              {!connected && (
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: 10, color: "#94a3b8",
                }}>
                  <div style={{ fontSize: 40 }}>📱</div>
                  <div style={{ fontSize: 13 }}>
                    {waReady ? "Memuat tampilan WhatsApp..." : "WhatsApp belum login"}
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
