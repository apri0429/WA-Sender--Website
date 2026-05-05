import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import SettingsCard from "./pages/SettingsCard";
import WaWebFullscreen from "./pages/WaWebFullscreen";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsCard />} />
        </Route>
        <Route path="/wa-fullscreen" element={<WaWebFullscreen />} />
      </Routes>
    </HashRouter>
  );
}
