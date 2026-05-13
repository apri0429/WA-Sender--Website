import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import SettingsCard from "./pages/SettingsCard";
import ChatInboxPage from "./pages/ChatInboxPage";
import PdfPage from "./pages/PdfPage";
import HasilPdfPage from "./pages/HasilPdfPage";
import InputPage from "./pages/InputPage";
import PeriodePage from "./pages/PeriodePage";
import MasterDataPage from "./pages/MasterDataPage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/chats" element={<ChatInboxPage />} />
          <Route path="/input" element={<InputPage />} />
          <Route path="/input/periode" element={<PeriodePage />} />
          <Route path="/masterdata" element={<MasterDataPage />} />
          <Route path="/pdf" element={<PdfPage />} />
          <Route path="/pdf/hasil" element={<HasilPdfPage />} />
          <Route path="/settings" element={<SettingsCard />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
