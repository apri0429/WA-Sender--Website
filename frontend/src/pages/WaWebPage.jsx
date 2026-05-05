import { useEffect, useRef, useState, useCallback } from "react";
import socket from "../services/socket";

export default function WaWebPage() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const vpRef = useRef({ w: 1280, h: 800 });
  const scaleRef = useRef({ scale: 1, renderW: 1280, renderH: 800, offsetX: 0, offsetY: 0 });
  const [connected, setConnected] = useState(false);
  const [waReady, setWaReady] = useState(false);

  // ─── ANTI-ZOOM: blokir Ctrl+Wheel & pinch di level document ───────────────
  useEffect(() => {
    const blockZoom = (e) => {
      if (e.ctrlKey) e.preventDefault();
    };
    const blockGesture = (e) => e.preventDefault();

    document.addEventListener("wheel", blockZoom, { passive: false });
    document.addEventListener("gesturestart", blockGesture);
    document.addEventListener("gesturechange", blockGesture);
    document.addEventListener("gestureend", blockGesture);

    return () => {
      document.removeEventListener("wheel", blockZoom);
      document.removeEventListener("gesturestart", blockGesture);
      document.removeEventListener("gesturechange", blockGesture);
      document.removeEventListener("gestureend", blockGesture);
    };
  }, []);

  // ─── HITUNG SCALE: object-fit contain manual ──────────────────────────────
  // Gambar backend (1280x800) di-scale down agar muat di container
  // tanpa terpotong, dengan letterbox di sisi kosong
  const recalcScale = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const { w, h } = vpRef.current;
    const cw = container.clientWidth;
    const ch = container.clientHeight;

    const scale = Math.min(cw / w, ch / h);
    const renderW = Math.round(w * scale);
    const renderH = Math.round(h * scale);
    const offsetX = Math.round((cw - renderW) / 2);
    const offsetY = Math.round((ch - renderH) / 2);

    scaleRef.current = { scale, renderW, renderH, offsetX, offsetY };

    // Canvas resolusi = ukuran container penuh (gambar digambar dengan offset)
    const canvas = canvasRef.current;
    if (canvas && (canvas.width !== cw || canvas.height !== ch)) {
      canvas.width = cw;
      canvas.height = ch;
    }
  }, []);

  // ─── RESIZE OBSERVER ──────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    recalcScale();
    const ro = new ResizeObserver(recalcScale);
    ro.observe(container);
    return () => ro.disconnect();
  }, [recalcScale]);

  // ─── SCREENCAST: render via canvas + requestAnimationFrame ────────────────
  useEffect(() => {
    socket.emit("wa-screen-open");

    let pendingFrame = null;
    let rafId = null;

    const renderLoop = () => {
      if (pendingFrame && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const frame = pendingFrame;
        pendingFrame = null;

        // Update vp size jika resolusi backend berubah
        if (frame.w !== vpRef.current.w || frame.h !== vpRef.current.h) {
          vpRef.current = { w: frame.w, h: frame.h };
          recalcScale();
        }

        const img = new Image();
        img.onload = () => {
          const { renderW, renderH, offsetX, offsetY } = scaleRef.current;
          // Clear canvas dulu (hapus frame lama + letterbox area)
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Gambar dengan contain scaling + center offset
          ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
        };
        img.src = `data:image/jpeg;base64,${frame.data}`;
      }
      rafId = requestAnimationFrame(renderLoop);
    };
    rafId = requestAnimationFrame(renderLoop);

    const onViewport = ({ width, height }) => {
      vpRef.current = { w: width, h: height };
      recalcScale();
    };

    const onScreen = ({ data, width, height }) => {
      // Simpan frame terbaru saja, frame lama dibuang otomatis
      pendingFrame = {
        data,
        w: width || vpRef.current.w,
        h: height || vpRef.current.h,
      };
      if (width && height) vpRef.current = { w: width, h: height };
      setConnected(true);
    };

    const onReady = () => setWaReady(true);
    const onDisconnect = () => {
      setWaReady(false);
      setConnected(false);
    };

    socket.on("wa-viewport", onViewport);
    socket.on("wa-screen", onScreen);
    socket.on("wa-ready", onReady);
    socket.on("wa-disconnected", onDisconnect);

    return () => {
      cancelAnimationFrame(rafId);
      socket.emit("wa-screen-close");
      socket.off("wa-viewport", onViewport);
      socket.off("wa-screen", onScreen);
      socket.off("wa-ready", onReady);
      socket.off("wa-disconnected", onDisconnect);
    };
  }, [recalcScale]);

  // ─── SCROLL: throttle emit ────────────────────────────────────────────────
  const scrollThrottleRef = useRef(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e) => {
      if (!canvasRef.current) return;
      e.preventDefault();
      if (e.ctrlKey) return;

      if (scrollThrottleRef.current) return;
      scrollThrottleRef.current = setTimeout(() => {
        scrollThrottleRef.current = null;
      }, 16);

      // Konversi posisi mouse → koordinat di viewport backend
      const { offsetX, offsetY, renderW, renderH } = scaleRef.current;
      const { w, h } = vpRef.current;
      const rect = canvasRef.current.getBoundingClientRect();
      const localX = e.clientX - rect.left - offsetX;
      const localY = e.clientY - rect.top - offsetY;

      socket.emit("wa-scroll", {
        x: Math.max(0, localX * (w / renderW)),
        y: Math.max(0, localY * (h / renderH)),
        deltaY: e.deltaY,
      });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // ─── KOORDINAT: client mouse → viewport backend ───────────────────────────
  const toVp = useCallback((clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const { offsetX, offsetY, renderW, renderH } = scaleRef.current;
    const { w, h } = vpRef.current;
    const localX = clientX - rect.left - offsetX;
    const localY = clientY - rect.top - offsetY;
    return {
      x: Math.max(0, Math.min(w, localX * (w / renderW))),
      y: Math.max(0, Math.min(h, localY * (h / renderH))),
    };
  }, []);

  // ─── CLICK ────────────────────────────────────────────────────────────────
  const handleClick = useCallback((e) => {
    if (!canvasRef.current || !connected) return;
    containerRef.current?.focus();
    socket.emit("wa-click", toVp(e.clientX, e.clientY));
  }, [connected, toVp]);

  // ─── KEYBOARD: batching karakter ──────────────────────────────────────────
  const keyBatchRef = useRef("");
  const keyBatchTimerRef = useRef(null);

  const flushKeyBatch = useCallback(() => {
    if (keyBatchRef.current) {
      socket.emit("wa-type", { text: keyBatchRef.current });
      keyBatchRef.current = "";
    }
    keyBatchTimerRef.current = null;
  }, []);

  const handleKeyDown = useCallback((e) => {
    const specials = [
      "Enter", "Backspace", "Delete",
      "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
      "Tab", "Escape",
    ];

    if (specials.includes(e.key)) {
      e.preventDefault();
      flushKeyBatch();
      socket.emit("wa-key", { key: e.key });
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      keyBatchRef.current += e.key;
      clearTimeout(keyBatchTimerRef.current);
      keyBatchTimerRef.current = setTimeout(flushKeyBatch, 30);
    }
  }, [flushKeyBatch]);

  // ─── STATUS ───────────────────────────────────────────────────────────────
  const statusColor = waReady ? "#22c55e" : connected ? "#f59e0b" : "#94a3b8";
  const statusText = waReady
    ? "WhatsApp Web aktif — klik area chat lalu ketik"
    : connected
    ? "Memuat WhatsApp..."
    : "Belum terhubung — login dulu di halaman Dashboard";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 5,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#e5ddd5",
        touchAction: "none",
      }}
    >
      {/* Status bar */}
      <div
        style={{
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
        }}
      >
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: statusColor,
            flexShrink: 0,
            boxShadow: waReady ? `0 0 7px ${statusColor}` : "none",
            transition: "background 0.4s, box-shadow 0.4s",
          }}
        />
        <span style={{ fontWeight: 500 }}>{statusText}</span>
        <button
          onClick={() => window.open("/#/wa-fullscreen", "_blank")}
          title="Buka WhatsApp Web di tab baru (lebih nyaman)"
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 10px",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            background: "#fff",
            cursor: "pointer",
            fontSize: 11.5,
            fontWeight: 600,
            color: "#1f4e8c",
            whiteSpace: "nowrap",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          Buka Tab Baru
        </button>
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
          userSelect: "none",
          WebkitUserSelect: "none",
          background: "#0f172a", // letterbox gelap di area kosong
        }}
      >
        {/* Placeholder saat belum connect */}
        {!connected && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              background: "#f0f2f5",
            }}
          >
            <div style={{ fontSize: 56 }}>📱</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#374151" }}>
              {waReady ? "Memuat tampilan WhatsApp..." : "WhatsApp belum login"}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#9ca3af",
                textAlign: "center",
                maxWidth: 280,
              }}
            >
              {waReady
                ? "Harap tunggu, sedang menghubungkan layar..."
                : "Buka halaman Dashboard, lalu scan QR atau pilih akun yang sudah tersimpan."}
            </div>
          </div>
        )}

        {/* Canvas — full container size, gambar di-contain dengan offset */}
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          style={{
            display: connected ? "block" : "none",
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            cursor: "default",
            pointerEvents: connected ? "auto" : "none",
          }}
        />
      </div>
    </div>
  );
}