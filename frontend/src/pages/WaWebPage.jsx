import { useEffect, useRef, useState } from "react";
import socket from "../services/socket";

export default function WaWebPage() {
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [waReady, setWaReady] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ w: 1440, h: 900 });
  const lastFrame = useRef(null);

  useEffect(() => {
    socket.emit("wa-screen-open");
    return () => socket.emit("wa-screen-close");
  }, []);

  useEffect(() => {
    const onScreen = ({ data, width, height }) => {
      if (!imgRef.current) return;
      setConnected(true);
      lastFrame.current = { w: width, h: height };
      setNaturalSize({ w: width, h: height });
      imgRef.current.src = `data:image/jpeg;base64,${data}`;
    };

    const onReady = () => setWaReady(true);
    const onDisconnect = () => { setWaReady(false); setConnected(false); };

    socket.on("wa-screen", onScreen);
    socket.on("wa-ready", onReady);
    socket.on("wa-disconnected", onDisconnect);

    return () => {
      socket.off("wa-screen", onScreen);
      socket.off("wa-ready", onReady);
      socket.off("wa-disconnected", onDisconnect);
    };
  }, []);

  const toVpCoords = (clientX, clientY) => {
    const rect = imgRef.current.getBoundingClientRect();
    const { w, h } = lastFrame.current || naturalSize;
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
    // Kirim karakter biasa via wa-type, tombol spesial via wa-key
    const specialKeys = [
      "Enter", "Backspace", "Delete", "ArrowUp", "ArrowDown",
      "ArrowLeft", "ArrowRight", "Tab", "Escape",
    ];
    if (specialKeys.includes(e.key)) {
      e.preventDefault();
      socket.emit("wa-key", { key: e.key });
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      socket.emit("wa-type", { text: e.key });
    } else if (e.ctrlKey && e.key === "a") {
      socket.emit("wa-key", { key: "a" }); // select all
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        height: "100%",
        overflow: "hidden",
        background: "#f0f2f5",
      }}
    >
      {/* Status bar */}
      <div style={{
        padding: "6px 16px",
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(226,232,240,0.9)",
        display: "flex", alignItems: "center", gap: 8,
        fontSize: 12, color: "#64748b", flexShrink: 0,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%",
          background: waReady ? "#22c55e" : connected ? "#f59e0b" : "#94a3b8",
          flexShrink: 0,
        }} />
        {waReady
          ? "WhatsApp Web aktif — klik untuk berinteraksi"
          : connected
          ? "Menunggu WhatsApp..."
          : "Belum terhubung ke WhatsApp"}
        <span style={{ marginLeft: "auto", opacity: 0.6 }}>
          Klik area chat untuk fokus, lalu ketik langsung
        </span>
      </div>

      {/* Screencast area */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: "hidden",
          position: "relative",
          outline: "none",
        }}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onWheel={handleWheel}
      >
        {!connected && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 12, color: "#94a3b8",
          }}>
            <div style={{ fontSize: 48 }}>📱</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              {waReady ? "Memuat tampilan..." : "WhatsApp belum login"}
            </div>
            <div style={{ fontSize: 12 }}>Login dulu di halaman Dashboard</div>
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
            objectFit: "contain",
            objectPosition: "top left",
            userSelect: "none",
            cursor: "default",
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}
