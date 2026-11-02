import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import AppHeader from "./components/AppHeader";
import SettingsCard from "../pages/SettingsCard";
import { OPEN_SETTINGS_EVENT } from "../components/PageTools";

// NetSuite-style menu bar. Follows the workflow order: pull data -> generate PDF -> send.
const menuItems = [
  {
    label: "Data",
    href: "/data",
    children: [
      { label: "Input", href: "/data" },
      { label: "Periode", href: "/data/periode" },
      { label: "Master Data", href: "/data/master" },
    ],
  },
  { label: "Generate PDF", href: "/pdf" },
  { label: "Kirim Tagihan", href: "/" },
  // Chat hidden: replies are read on the phone / WhatsApp Web (see App.jsx to restore).
  { label: "Settings", action: "open-settings" },
];

export default function AppLayout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Pages ask for Settings (e.g. "Google Sheet belum diatur") through a window event.
  useEffect(() => {
    const open = () => setSettingsOpen(true);
    window.addEventListener(OPEN_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, open);
  }, []);

  const handleAction = (action) => {
    if (action === "open-settings") setSettingsOpen(true);
  };

  return (
    <div className="dashboard-shell dashboard-shell--topnav">
      <SettingsCard open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <div className="dashboard-stage">
        <AppHeader
          title="Sendline"
          breadcrumb={[]}
          showMenuButton
          onMenuToggle={() => setMenuOpen((v) => !v)}
          menuItems={menuItems}
          activePath={location.pathname}
          menuOpen={menuOpen}
          onMenuAction={handleAction}
          onMenuNavigate={() => setMenuOpen(false)}
        />

        <main className="dashboard-main" style={{ position: "relative", padding: 0, overflow: "hidden", background: "var(--ns-page-bg)" }}>
          <div
            style={{
              position: "relative",
              zIndex: 1,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
