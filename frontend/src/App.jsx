import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import PdfPage from "./pages/PdfPage";
import DataPage from "./pages/DataPage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/data" element={<DataPage />} />
          <Route path="/data/:tab" element={<DataPage />} />
          <Route path="/pdf" element={<PdfPage />} />

          {/* Old URLs from before the menu was simplified.
              /chat is hidden for now: it shares the one WhatsApp session used for sending and is heavy.
              To bring it back, route it to pages/ChatInboxPage again and re-add the menu item in AppLayout. */}
          <Route path="/chat" element={<Navigate to="/" replace />} />
          <Route path="/input" element={<Navigate to="/data" replace />} />
          <Route path="/input/periode" element={<Navigate to="/data/periode" replace />} />
          <Route path="/masterdata" element={<Navigate to="/data/master" replace />} />
          <Route path="/pdf/hasil" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
