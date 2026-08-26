import { cloneElement, useState } from "react";
import TeamSidebar from "../sidebar/TeamSidebar";
import { useDraftStore } from "../../store/useDraftStore";

const PHASE_LABELS = {
  setup: "Start Setup",
  protection: "Protection",
  draft: "Expansion Draft",
  recap: "Draft Recap",
};

export default function AppShell({ children }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const phase = useDraftStore((s) => s.phase);
  const page = cloneElement(children, {
    isSettingsOpen,
    setIsSettingsOpen,
  });

  return (
    <div className="flex h-screen bg-tunnel-950 text-ink-100">
      <TeamSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-tunnel-700 bg-tunnel-900 px-6 py-4">
          <div>
            <p className="font-display text-2xl uppercase tracking-wide text-ink-100">
              Expansion Draft <span className="text-clock-500">GM</span>
            </p>
            <p className="text-xs text-ink-500">
              Seattle &amp; Las Vegas expansion simulation
            </p>
          </div>
          <button
            type="button"
            onClick={() => phase === "setup" && setIsSettingsOpen(true)}
            disabled={phase !== "setup"}
            className="rounded-full border border-tunnel-600 px-4 py-1.5 font-display text-sm uppercase tracking-wider text-ink-300 transition-colors hover:border-clock-500 hover:text-clock-500 disabled:cursor-default disabled:hover:border-tunnel-600 disabled:hover:text-ink-300"
          >
            {PHASE_LABELS[phase] || phase}
          </button>
        </header>
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {page}
        </main>
      </div>
    </div>
  );
}
