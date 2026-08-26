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
  const Page = PAGES[phase] || SetupPage;

  return (
    <AppShell>
      <Page />
    </AppShell>
  );
}
