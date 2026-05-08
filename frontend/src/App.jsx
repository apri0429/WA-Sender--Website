import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import SettingsCard from "./pages/SettingsCard";
import ChatInboxPage from "./pages/ChatInboxPage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/inbox" element={<ChatInboxPage />} />
          <Route path="/settings" element={<SettingsCard />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
