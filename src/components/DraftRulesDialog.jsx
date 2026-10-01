import { useEffect } from "react";

// The expansion draft rules ("Commissioner's briefing"). Shown when the
// simulator opens and from the floating ? button on every page.
export default function DraftRulesDialog({ onClose }) {
  // Escape closes it, like the backdrop and the close buttons.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close draft guide"
        className="fixed inset-0 z-40 cursor-default bg-tunnel-950/80"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="draft-guide-title"
        className="fixed inset-x-4 top-1/2 z-50 max-h-[calc(100vh-2rem)] max-w-2xl -translate-y-1/2 overflow-y-auto rounded-lg border border-tunnel-600 bg-tunnel-900 shadow-2xl sm:inset-x-8 sm:mx-auto"
      >
        <div className="flex items-start justify-between gap-6 border-b border-tunnel-700 px-5 py-5 sm:px-7">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-clock-500">
              Commissioner&apos;s briefing
            </p>
            <h2
              id="draft-guide-title"
              className="font-display text-2xl uppercase tracking-wide text-ink-100 sm:text-3xl"
            >
              What is an expansion draft?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close draft guide"
            title="Close draft guide"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-tunnel-700 font-mono text-lg text-ink-500 transition-colors hover:border-tunnel-500 hover:text-ink-100"
          >
            &times;
          </button>
        </div>

        <div className="space-y-6 px-5 py-6 sm:px-7">
          <p className="max-w-xl text-sm leading-6 text-ink-300">
            When new franchises join the league, they build their first rosters
            by selecting eligible players from existing teams. You are the GM
            for one expansion team; the other team is simulated by the game.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <article className="rounded border border-tunnel-700 bg-tunnel-800/60 p-4">
              <p className="mb-2 font-display text-sm uppercase tracking-wide text-clock-500">
                Before the draft
              </p>
              <p className="text-sm leading-6 text-ink-300">
                Every existing franchise protects 8 players. Only its
                unprotected players can be selected.
              </p>
            </article>
            <article className="rounded border border-tunnel-700 bg-tunnel-800/60 p-4">
              <p className="mb-2 font-display text-sm uppercase tracking-wide text-clock-500">
                On the clock
              </p>
              <p className="text-sm leading-6 text-ink-300">
                The two expansion teams alternate picks. Each can draft up to 15
                players in total.
              </p>
            </article>
          </div>

          <div>
            <p className="mb-3 font-display text-sm uppercase tracking-wide text-ink-100">
              The rules of the room
            </p>
            <ul className="space-y-3 text-sm leading-6 text-ink-300">
              <li className="flex gap-3">
                <span className="font-mono text-clock-500">01</span>
                <span>
                  Each expansion team may take at most one player from each
                  existing franchise.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-clock-500">02</span>
                <span>
                  A player can be selected only once, by whichever expansion
                  team gets to them first.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-clock-500">03</span>
                <span>
                  Your choices are manual. The rival team follows the strategy
                  you choose in setup.
                </span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded bg-clock-500 px-4 py-3 font-display text-base uppercase tracking-wide text-tunnel-950 transition-colors hover:bg-clock-400"
          >
            Enter the war room
          </button>
        </div>
      </section>
    </>
  );
}
