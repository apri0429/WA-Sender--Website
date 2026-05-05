import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import SettingsCard from "./pages/SettingsCard";
import WaWebPage from "./pages/WaWebPage";
import ChatPage from "./pages/ChatPage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsCard />} />
          <Route path="/wa-web" element={<WaWebPage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
