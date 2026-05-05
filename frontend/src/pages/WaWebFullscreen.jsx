import { useEffect, useRef, useState } from "react";
import socket from "../services/socket";

export default function WaWebFullscreen() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const vpRef = useRef({ w: 1280, h: 800 });
  const pendingRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [waReady, setWaReady] = useState(false);

  useEffect(() => { document.title = "WhatsApp Web"; }, []);

  // Blokir Ctrl+Wheel agar browser tidak zoom
  useEffect(() => {
    const block = (e) => { if (e.ctrlKey) e.preventDefault(); };
    document.addEventListener("wheel", block, { passive: false });
    return () => document.removeEventListener("wheel", block);
  }, []);

  // Resize canvas saat container berubah ukuran
  useEffect(() => {
    const resize = () => {
      const el = containerRef.current;
      const canvas = canvasRef.current;
      if (!el || !canvas) return;
      canvas.width = el.clientWidth;
      canvas.height = el.clientHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Kirim ukuran layar ke backend → resize viewport Puppeteer → tidak ada garis hitam
  useEffect(() => {
    const send = () => {
      const el = containerRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) socket.emit("wa-set-viewport", { width: w, height: h });
    };
    const t = setTimeout(send, 200);
    window.addEventListener("resize", send);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", send);
      socket.emit("wa-set-viewport", { width: 1280, height: 800 });
    };
  }, []);

  // RAF render loop — gambar frame terbaru ke canvas
  useEffect(() => {
    let rafId;
    const loop = () => {
      const frame = pendingRef.current;
      const canvas = canvasRef.current;
      if (frame && canvas) {
        pendingRef.current = null;
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        img.src = `data:image/jpeg;base64,${frame}`;
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Socket screencast
  useEffect(() => {
    socket.emit("wa-screen-open");

    const onViewport = ({ width, height }) => { vpRef.current = { w: width, h: height }; };
    const onScreen = ({ data, width, height }) => {
      pendingRef.current = data;
      if (width && height) vpRef.current = { w: width, h: height };
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

  // Scroll — non-passive, throttle 16ms
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let last = 0;
    const onWheel = (e) => {
      if (e.ctrlKey) return;
      e.preventDefault();
      const now = Date.now();
      if (now - last < 16) return;
      last = now;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
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
    const rect = canvasRef.current.getBoundingClientRect();
    const { w, h } = vpRef.current;
    return {
      x: Math.max(0, Math.min(w, (clientX - rect.left) * (w / rect.width))),
      y: Math.max(0, Math.min(h, (clientY - rect.top) * (h / rect.height))),
    };
  };

  const handleClick = (e) => {
    if (!connected) return;
    containerRef.current?.focus();
    socket.emit("wa-click", toVp(e.clientX, e.clientY));
  };

  // Keyboard batching
  const buf = useRef("");
  const timer = useRef(null);
  const flush = () => {
    if (buf.current) { socket.emit("wa-type", { text: buf.current }); buf.current = ""; }
    timer.current = null;
  };
  const handleKeyDown = (e) => {
    const specials = ["Enter","Backspace","Delete","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Tab","Escape"];
    if (specials.includes(e.key)) {
      e.preventDefault(); flush();
      socket.emit("wa-key", { key: e.key });
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      buf.current += e.key;
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, 30);
    }
  };

  const dot = waReady ? "#22c55e" : connected ? "#f59e0b" : "#94a3b8";

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: "#000" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 14px", background: "#075e54", flexShrink: 0 }}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff" style={{ flexShrink: 0 }}>
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.38 1.26 4.79L2.05 22l5.45-1.43c1.36.73 2.9 1.15 4.54 1.15 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2m0 18.18c-1.49 0-2.9-.4-4.12-1.1l-.3-.17-3.08.81.82-3.01-.19-.32a8.24 8.24 0 01-1.28-4.39c0-4.54 3.7-8.23 8.25-8.23s8.25 3.69 8.25 8.23-3.71 8.18-8.25 8.18m4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.54.07-.25-.12-1.05-.39-2-.12-1.36-.72-1.56-1.6-1.56-1.6-.11-.19-.01-.29.08-.39.08-.08.17-.21.26-.32.08-.1.11-.19.17-.32.05-.12.03-.23-.02-.32s-.56-1.35-.77-1.84c-.2-.48-.4-.41-.56-.42h-.48c-.17 0-.43.06-.66.31s-.86.84-.86 2.05.88 2.38 1 2.54c.12.17 1.72 2.63 4.17 3.69.58.25 1.04.4 1.39.51.58.19 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.21-.57.21-1.06.14-1.16-.07-.1-.23-.16-.48-.28"/>
        </svg>
        <span style={{ color: "#fff", fontWeight: 600, fontSize: 13, flex: 1 }}>WhatsApp Web</span>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot, boxShadow: waReady ? `0 0 6px ${dot}` : "none", flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
          {waReady ? "Aktif" : connected ? "Memuat..." : "Belum login"}
        </span>
      </div>

      {/* Area screencast */}
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{ flex: 1, overflow: "hidden", position: "relative", outline: "none", background: "#f0f2f5" }}
      >
        {!connected && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
          }}>
            <div style={{ fontSize: 60 }}>📱</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#374151" }}>
              {waReady ? "Memuat tampilan..." : "WhatsApp belum login"}
            </div>
            <div style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", maxWidth: 300 }}>
              {waReady ? "Harap tunggu..." : "Login dulu di halaman Dashboard, lalu buka halaman ini kembali."}
            </div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          style={{
            display: connected ? "block" : "none",
            position: "absolute", top: 0, left: 0,
            width: "100%", height: "100%",
            cursor: "default",
          }}
        />
      </div>
    </div>
  );
}
