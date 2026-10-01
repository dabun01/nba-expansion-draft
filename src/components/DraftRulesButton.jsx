import { useCallback, useState } from "react";
import { useLocation } from "react-router";
import DraftRulesDialog from "./DraftRulesDialog";

// How far up the button sits on each page, so it floats above that page's
// bottom bar (Next, Submit, Share...) instead of covering its buttons.
function bottomOffset(pathname) {
  if (pathname === "/gm/share") return "bottom-44";
  if (pathname.startsWith("/gm/results")) return "bottom-24";
  if (pathname.startsWith("/gm")) return "bottom-28";
  return "bottom-6";
}

// A floating ? in the bottom-right corner of every page that opens the
// expansion draft rules.
export default function DraftRulesButton() {
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);

  if (isOpen) return <DraftRulesDialog onClose={close} />;

  return (
    <button
      type="button"
      onClick={() => setIsOpen(true)}
      aria-label="Draft rules"
      title="Draft rules"
      className={`fixed right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-tunnel-600 bg-tunnel-800 font-display text-xl font-bold text-ink-100 shadow-lg shadow-black/40 transition-colors hover:border-clock-500 hover:text-clock-500 sm:right-6 ${bottomOffset(pathname)}`}
    >
      ?
    </button>
  );
}
