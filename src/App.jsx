import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router";
import AppShell from "./components/layout/AppShell";
import { useDraftStore } from "./store/useDraftStore";
import SetupPage from "./pages/SetupPage";
import ProtectionPage from "./pages/ProtectionPage";
import DraftPage from "./pages/DraftPage";
import RecapPage from "./pages/RecapPage";
import GmHomePage from "./pages/gm/GmHomePage";
import GmResultsPage from "./pages/gm/GmResultsPage";

const PAGES = {
  setup: SetupPage,
  protection: ProtectionPage,
  draft: DraftPage,
  recap: RecapPage,
};

// The existing simulator, unchanged: still switches pages by Zustand phase.
function Simulator() {
  const phase = useDraftStore((s) => s.phase);
  const Page = PAGES[phase] || SetupPage;

  return (
    <AppShell>
      <Page />
    </AppShell>
  );
}

export default function App() {
  const isDataLoading = useDraftStore((s) => s.isDataLoading);
  const dataError = useDraftStore((s) => s.dataError);
  const initializeData = useDraftStore((s) => s.initializeData);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  if (isDataLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center text-ink-500">
        <span className="text-lg font-semibold">Loading draft data...</span>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="flex h-screen w-screen items-center justify-center text-ink-500">
        <span className="text-lg font-semibold">
          Error loading draft data: {dataError}
        </span>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Simulator />} />
      <Route path="/gm" element={<GmHomePage />} />
      <Route path="/gm/results/:teamId" element={<GmResultsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
