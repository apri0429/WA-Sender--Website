import { useEffect, useRef, useState } from "react";
import socket from "../services/socket";

export default function WaWebPage() {
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const vpRef = useRef({ w: 1280, h: 800 });
  const [connected, setConnected] = useState(false);
  const [waReady, setWaReady] = useState(false);

  // Screencast lifecycle
  useEffect(() => {
    socket.emit("wa-screen-open");

    const onViewport = ({ width, height }) => {
      vpRef.current = { w: width, h: height };
    };

    const onScreen = ({ data, width, height }) => {
      if (!imgRef.current) return;
      if (width && height) vpRef.current = { w: width, h: height };
      imgRef.current.src = `data:image/jpeg;base64,${data}`;
      setConnected(true);
    };

    const onReady = () => setWaReady(true);
    const onDisconnect = () => { setWaReady(false); setConnected(false); };

    socket.on("wa-viewport", onViewport);
    socket.on("wa-screen", onScreen);
    socket.on("wa-ready", onReady);
    socket.on("wa-disconnected", onDisconnect);

    return () => {
      socket.emit("wa-screen-close");
      socket.off("wa-viewport", onViewport);
      socket.off("wa-screen", onScreen);
      socket.off("wa-ready", onReady);
      socket.off("wa-disconnected", onDisconnect);
    };
  }, []);

  // Non-passive wheel listener — satu-satunya cara agar preventDefault() jalan
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (!imgRef.current) return;
      e.preventDefault();
      const rect = imgRef.current.getBoundingClientRect();
      const { w, h } = vpRef.current;
      socket.emit("wa-scroll", {
        x: (e.clientX - rect.left) * (w / rect.width),
        y: (e.clientY - rect.top) * (h / rect.height),
        deltaY: e.deltaY,
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const toVp = (clientX, clientY) => {
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
    socket.emit("wa-click", toVp(e.clientX, e.clientY));
  };

  const handleKeyDown = (e) => {
    const specials = ["Enter","Backspace","Delete","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Tab","Escape"];
    if (specials.includes(e.key)) {
      e.preventDefault();
      socket.emit("wa-key", { key: e.key });
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      socket.emit("wa-type", { text: e.key });
    }
  };

  const statusColor = waReady ? "#22c55e" : connected ? "#f59e0b" : "#94a3b8";
  const statusText = waReady
    ? "WhatsApp Web aktif — klik area chat lalu ketik"
    : connected
    ? "Memuat WhatsApp..."
    : "Belum terhubung — login dulu di halaman Dashboard";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "calc(100vh - 65px)",
      overflow: "hidden",
      background: "#e5ddd5",
    }}>
      {/* Status bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 16px",
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(0,0,0,0.08)",
        flexShrink: 0,
        fontSize: 12.5,
        color: "#475569",
      }}>
        <span style={{
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: statusColor,
          flexShrink: 0,
          boxShadow: waReady ? `0 0 7px ${statusColor}` : "none",
          transition: "background 0.4s, box-shadow 0.4s",
        }} />
        <span style={{ fontWeight: 500 }}>{statusText}</span>
        {connected && (
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8" }}>
            Scroll mouse untuk gulir • Klik untuk fokus
          </span>
        )}
      </div>

      {/* Screencast area */}
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{
          flex: 1,
          overflow: "hidden",
          position: "relative",
          outline: "none",
        }}
      >
        {/* Placeholder saat belum connect */}
        {!connected && (
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            background: "#f0f2f5",
          }}>
            <div style={{ fontSize: 56 }}>📱</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#374151" }}>
              {waReady ? "Memuat tampilan WhatsApp..." : "WhatsApp belum login"}
            </div>
            <div style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", maxWidth: 280 }}>
              {waReady
                ? "Harap tunggu, sedang menghubungkan layar..."
                : "Buka halaman Dashboard, lalu scan QR atau pilih akun yang sudah tersimpan."}
            </div>
          </div>
        )}

        {/* Gambar screencast */}
        <img
          ref={imgRef}
          alt="WhatsApp Web"
          onClick={handleClick}
          draggable={false}
          style={{
            display: connected ? "block" : "none",
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "top left",
            userSelect: "none",
            cursor: "default",
            WebkitUserDrag: "none",
          }}
        />
      </div>
    </div>
  );
}
