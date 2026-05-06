import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { BarChartSquare02, Settings01 } from "@untitledui/icons";

import TemplateSidebar from "../templateComponents/Sidebar";
import TemplateHeader from "../templateComponents/Header";
import BackgroundMain from "../templateComponents/BackgroundMain";
import socket from "../services/socket";

const FONT = "'Plus Jakarta Sans', 'Inter', sans-serif";

const waPrimaryItems = [
  { label: "Dashboard", href: "/", icon: BarChartSquare02 },
  { label: "Settings", href: "/settings", icon: Settings01 },
];

const pageBreadcrumbs = {
  "/": [{ label: "Dashboard", active: true }],
  "/settings": [{ label: "Settings", active: true }],
};

function MainFooter() {
  return (
    <div
      style={{
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderTop: "1px solid rgba(226,232,240,0.9)",
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          fontFamily: FONT,
          fontSize: 12,
          fontWeight: 700,
          color: "#334155",
          letterSpacing: "-0.1px",
          textAlign: "center",
        }}
      >
        <span>&copy; 2026 PT Pilar Niaga Makmur. All rights reserved.</span>
        <span>Developed by IT Team PT Pilar Niaga Makmur.</span>
      </div>
    </div>
  );
}

function WaFloatingButton() {
  const [waReady, setWaReady] = useState(false);

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

  return (
    <button
      onClick={() => window.open("/wa-web", "_blank", "noopener,noreferrer")}
      title={waReady ? "Buka WhatsApp Web" : "WhatsApp belum login"}
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        width: 54,
        height: 54,
        borderRadius: "50%",
        background: waReady ? "#25d366" : "#94a3b8",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: waReady
          ? "0 4px 20px rgba(37,211,102,0.45)"
          : "0 4px 16px rgba(0,0,0,0.2)",
        zIndex: 1000,
        transition: "transform 0.15s, background 0.3s, box-shadow 0.3s",
        color: "#fff",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.12)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.38 1.26 4.79L2.05 22l5.45-1.43c1.36.73 2.9 1.15 4.54 1.15 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2m0 18.18c-1.49 0-2.9-.4-4.12-1.1l-.3-.17-3.08.81.82-3.01-.19-.32a8.24 8.24 0 01-1.28-4.39c0-4.54 3.7-8.23 8.25-8.23s8.25 3.69 8.25 8.23-3.71 8.18-8.25 8.18m4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.54.07-.25-.12-1.05-.39-2-.12-1.36-.72-1.56-1.6-1.56-1.6-.11-.19-.01-.29.08-.39.08-.08.17-.21.26-.32.08-.1.11-.19.17-.32.05-.12.03-.23-.02-.32s-.56-1.35-.77-1.84c-.2-.48-.4-.41-.56-.42h-.48c-.17 0-.43.06-.66.31s-.86.84-.86 2.05.88 2.38 1 2.54c.12.17 1.72 2.63 4.17 3.69.58.25 1.04.4 1.39.51.58.19 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.21-.57.21-1.06.14-1.16-.07-.1-.23-.16-.48-.28"/>
      </svg>
    </button>
  );
}

export default function Layout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const breadcrumb =
    pageBreadcrumbs[location.pathname] ?? [{ label: "Halaman", active: true }];

  useEffect(() => {
    if (!document.getElementById("plus-jakarta-sans-font")) {
      const link = document.createElement("link");
      link.id = "plus-jakarta-sans-font";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div
      className={`dashboard-shell${
        collapsed ? " dashboard-shell--sidebar-collapsed" : ""
      }`}
    >
      <TemplateSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        activePath={location.pathname}
        primaryItems={waPrimaryItems}
        secondaryItems={[]}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={`sidebar-overlay${mobileOpen ? " active" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      <div className="dashboard-stage">
        <TemplateHeader
          title="WA Sender"
          breadcrumb={breadcrumb}
          showMenuButton={true}
          onMenuToggle={() => setMobileOpen((v) => !v)}
        />

        <main
          className="dashboard-main"
          style={{ position: "relative", padding: 0 }}
        >
          <BackgroundMain position="absolute" zIndex={0} />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              minHeight: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Outlet />
            <MainFooter />
          </div>
        </main>
      </div>

      <WaFloatingButton />
    </div>
  );
}
