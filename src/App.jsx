import { useEffect } from "react";
import AppShell from "./components/layout/AppShell";
import { useDraftStore } from "./store/useDraftStore";
import SetupPage from "./pages/SetupPage";
import ProtectionPage from "./pages/ProtectionPage";
import DraftPage from "./pages/DraftPage";
import RecapPage from "./pages/RecapPage";

const PAGES = {
  setup: SetupPage,
  protection: ProtectionPage,
  draft: DraftPage,
  recap: RecapPage,
};

export default function App() {
  const phase = useDraftStore((s) => s.phase);
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

  const Page = PAGES[phase] || SetupPage;

  return (
    <AppShell>
      <Page />
    </AppShell>
  );
}
