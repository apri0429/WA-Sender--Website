import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import SettingsCard from "./pages/SettingsCard";
import ChatPage from "./pages/ChatPage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/chats" element={<ChatPage />} />
          <Route path="/settings" element={<SettingsCard />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
