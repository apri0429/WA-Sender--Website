import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { BarChartSquare02, MessageChatSquare, Settings01 } from "@untitledui/icons";

import TemplateSidebar from "../templateComponents/Sidebar";
import TemplateHeader from "../templateComponents/Header";
import BackgroundMain from "../templateComponents/BackgroundMain";

const FONT = "'Plus Jakarta Sans', 'Inter', sans-serif";

const waPrimaryItems = [
  { label: "Dashboard", href: "/", icon: BarChartSquare02 },
  { label: "Chats", href: "/chats", icon: MessageChatSquare },
  { label: "Settings", href: "/settings", icon: Settings01 },
];

const pageBreadcrumbs = {
  "/": [{ label: "Dashboard", active: true }],
  "/chats": [{ label: "Chats", active: true }],
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

      {/* Mobile backdrop */}
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
    </div>
  );
}
