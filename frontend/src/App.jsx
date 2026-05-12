import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import SettingsCard from "./pages/SettingsCard";
import ChatInboxPage from "./pages/ChatInboxPage";
import PdfPage from "./pages/PdfPage";
import InputPage from "./pages/InputPage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/chats" element={<ChatInboxPage />} />
          <Route path="/input" element={<InputPage />} />
          <Route path="/pdf" element={<PdfPage />} />
          <Route path="/settings" element={<SettingsCard />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
