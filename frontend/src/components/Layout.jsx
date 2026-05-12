import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { BarChartSquare02, MessageChatSquare, Settings01, FilePlus02, Table } from "@untitledui/icons";

import TemplateSidebar from "../templateComponents/Sidebar";
import TemplateHeader from "../templateComponents/Header";
import BackgroundMain from "../templateComponents/BackgroundMain";

const waPrimaryItems = [
  { label: "Dashboard", href: "/", icon: BarChartSquare02 },
  { label: "Chat Inbox", href: "/chats", icon: MessageChatSquare },
  { label: "Input Data", href: "/input", icon: Table },
  { label: "Generate PDF", href: "/pdf", icon: FilePlus02 },
  { label: "Settings", href: "/settings", icon: Settings01 },
];

const pageBreadcrumbs = {
  "/": [{ label: "Dashboard", active: true }],
  "/chats": [{ label: "Chat Inbox", active: true }],
  "/input": [{ label: "Input Data", active: true }],
  "/pdf": [{ label: "Generate PDF", active: true }],
  "/settings": [{ label: "Settings", active: true }],
};


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
          style={{ position: "relative", padding: 0, overflow: "hidden" }}
        >
          <BackgroundMain position="absolute" zIndex={0} />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
}
