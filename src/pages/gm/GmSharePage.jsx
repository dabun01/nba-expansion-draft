import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation } from "react-router";
import { toBlob } from "html-to-image";
import { useDraftStore } from "../../store/useDraftStore";
import { useGmStore } from "../../store/useGmStore";
import TeamLogo from "../../components/TeamLogo";
import { getAge } from "../../lib/age";
import { getTeamColors } from "../../lib/teamColors";
import { useLoopingCarousel } from "../../lib/useLoopingCarousel";

// "Atlanta Hawks" -> "Hawks", "Portland Trail Blazers" -> "Blazers"
const nickname = (team) => team.name.split(" ").pop();

function ShareIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M4 20h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// The card that becomes the shared image. Everything it shows must be
// inside this element, since only this element gets turned into a PNG.
function ShareCard({ team, players, cardRef }) {
  const [primary, secondary] = getTeamColors(team);
  return (
    <div
      ref={cardRef}
      className="overflow-hidden rounded-2xl border border-tunnel-700 bg-tunnel-900"
    >
      <div
        className="relative overflow-hidden px-6 pb-5 pt-5 text-center"
        style={{
          backgroundColor: primary,
          boxShadow: `inset 0 -5px 0 ${secondary}`,
        }}
      >
        <div
          className="pointer-events-none absolute -left-16 top-8 h-48 w-48 rounded-[3rem] border-[18px] opacity-15"
          style={{ borderColor: secondary }}
        />
        <TeamLogo
          team={team}
          sizeClassName="h-16 w-16"
          showFrame={false}
          className="relative mx-auto mb-2"
        />
        <h2 className="relative font-display text-3xl font-bold uppercase tracking-wide text-white">
          {team.name}
        </h2>
        <p className="relative mt-1 font-mono text-xs font-semibold uppercase tracking-[0.25em] text-white/80">
          My 8 protected players
        </p>
      </div>
      <ol className="px-6 py-2">
        {players.map((p, i) => {
          const age = getAge(p.birthDate);
          return (
            <li
              key={p.id}
              className="flex items-center gap-4 border-b border-tunnel-800 py-2.5 last:border-b-0"
            >
              <span className="w-6 font-mono text-sm font-semibold text-clock-500">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1 truncate text-base font-semibold">
                {p.name}
              </span>
              <span className="shrink-0 font-mono text-xs text-ink-500">
                {p.position}
                {age !== null ? ` · ${age}y` : ""}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="flex items-center justify-between gap-3 border-t border-tunnel-800 px-6 py-3.5">
        <p className="shrink-0 whitespace-nowrap font-display text-sm font-bold uppercase tracking-wide">
          Expansion Draft <span className="text-clock-500">GM</span>
        </p>
        <p className="truncate font-mono text-xs text-ink-500">
          {window.location.host}
        </p>
      </div>
    </div>
  );
}

// Renders a card element to a PNG. pixelRatio 3 turns the ~360px-wide card
// into a ~1080px image, sharp enough for stories and group chats. Waiting
// for fonts first stops the image coming out in a fallback font.
async function renderCard(node) {
  await document.fonts.ready;
  return toBlob(node, {
    pixelRatio: 3,
    backgroundColor: getComputedStyle(document.body).backgroundColor,
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Step 5 of the GM flow: an image card of your 8 protected players for each
// team you submitted, to save or send.
export default function GmSharePage() {
  const location = useLocation();
  const teams = useDraftStore((s) => s.teams);
  const playersById = useDraftStore((s) => s.playersById);
  const submittedTeamIds = useGmStore((s) => s.submittedTeamIds);
  const protections = useGmStore((s) => s.protections);
  const cardRefs = useRef(new Map()); // teamId -> card element (real panels only)
  const [images, setImages] = useState({}); // teamId -> PNG blob
  const [note, setNote] = useState(null);

  const shareTeams = teams
    .filter((t) => submittedTeamIds.includes(t.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  const { scrollerProps, slots, index, goTo, looping } = useLoopingCarousel(
    shareTeams.length,
    shareTeams.findIndex((t) => t.id === location.state?.teamId),
  );
  const team = shareTeams[index];
  const n = shareTeams.length;
  const prevTeam = looping ? shareTeams[(index - 1 + n) % n] : null;
  const nextTeam = looping ? shareTeams[(index + 1) % n] : null;
  const image = team ? images[team.id] : null;

  // Build the visible card's PNG ahead of time. Safari only opens the share
  // sheet straight from a tap, so the file has to be ready before the tap,
  // not rendered after it.
  useEffect(() => {
    if (!team || images[team.id]) return;
    let active = true;
    const timer = setTimeout(async () => {
      const node = cardRefs.current.get(team.id);
      if (!node) return;
      try {
        const blob = await renderCard(node);
        if (active && blob) setImages((prev) => ({ ...prev, [team.id]: blob }));
      } catch (err) {
        console.error("Rendering share card failed:", err);
      }
    }, 300); // let a swipe finish settling before doing the work
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [team, images]);

  if (shareTeams.length === 0) return <Navigate to="/gm" replace />;

  const flashNote = (text) => {
    setNote(text);
    setTimeout(() => setNote(null), 2500);
  };
  const filename = `${team.id.toLowerCase()}-protected-8.png`;
  const resultsUrl = `${window.location.origin}/gm/results/${team.id}`;

  const handleSave = () => {
    downloadBlob(image, filename);
    flashNote("Image saved");
  };

  // Phones share the image itself. Where files can't be shared (most
  // desktops), the image downloads instead.
  const handleShare = async () => {
    const file = new File([image], filename, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `My ${team.name} protected list`,
          text: `My 8 protected ${nickname(team)}. Build yours: ${resultsUrl}`,
        });
      } catch (err) {
        // AbortError just means the user closed the share sheet. Anything
        // else (e.g. the browser refused), save the image so the tap still
        // gets them something.
        if (err.name !== "AbortError") {
          downloadBlob(image, filename);
          flashNote("Couldn't open sharing, so the image was saved");
        }
      }
      return;
    }
    downloadBlob(image, filename);
    flashNote("Sharing isn't supported here, so the image was saved");
  };

  const buttonsDisabled = !image;

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col border-tunnel-800 bg-tunnel-950 sm:border-x">
      <header className="flex items-center justify-between px-3 py-3">
        <Link
          to={`/gm/results/${team.id}`}
          aria-label="Close"
          className="flex h-11 w-11 items-center justify-center rounded-full text-2xl text-ink-300 transition-colors hover:text-ink-100"
        >
          ✕
        </Link>
        <h1 className="font-display text-lg font-bold uppercase tracking-wide">
          Share my choices
        </h1>
        <button
          type="button"
          onClick={handleShare}
          disabled={buttonsDisabled}
          aria-label="Share image"
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink-300 transition-colors hover:text-ink-100 disabled:opacity-40"
        >
          <ShareIcon className="h-6 w-6" />
        </button>
      </header>

      <main
        {...scrollerProps}
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-none [scrollbar-width:none]"
      >
        {slots.map(({ index: i, pos, isClone }) => {
          const t = shareTeams[i];
          const players = t.playerIds
            .filter((id) => protections[t.id]?.includes(id))
            .map((id) => playersById.get(id))
            .filter(Boolean);
          return (
            <section
              key={isClone ? `copy-${pos}` : t.id}
              aria-label={isClone ? undefined : `${t.name} share card`}
              aria-hidden={isClone || undefined}
              inert={isClone}
              className="scrollbar-thin h-full w-full shrink-0 snap-center snap-always overflow-y-auto px-5 py-2"
            >
              <ShareCard
                team={t}
                players={players}
                cardRef={
                  isClone
                    ? undefined
                    : (node) => {
                        if (node) cardRefs.current.set(t.id, node);
                        else cardRefs.current.delete(t.id);
                      }
                }
              />
            </section>
          );
        })}
      </main>

      <footer className="px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        {looping ? (
          <div className="mb-4 flex items-center justify-between font-mono text-sm text-ink-300">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label={`Previous team: ${prevTeam.name}`}
              className="flex items-center gap-2 uppercase transition-colors hover:text-ink-100"
            >
              ‹ {prevTeam.abbreviation}
            </button>
            <div className="flex gap-1.5" aria-hidden="true">
              {shareTeams.map((t, i) => (
                <span
                  key={t.id}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-5 bg-clock-500" : "w-1.5 bg-tunnel-600"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label={`Next team: ${nextTeam.name}`}
              className="flex items-center gap-2 uppercase transition-colors hover:text-ink-100"
            >
              {nextTeam.abbreviation} ›
            </button>
          </div>
        ) : null}
        {note ? (
          <p role="status" className="mb-3 text-center text-sm text-ink-300">
            {note}
          </p>
        ) : null}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={buttonsDisabled}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-tunnel-600 py-4 font-display font-bold uppercase tracking-wider transition-colors hover:border-tunnel-500 disabled:opacity-40"
          >
            <DownloadIcon className="h-5 w-5" />
            Save image
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={buttonsDisabled}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-clock-500 py-4 font-display font-bold uppercase tracking-wider text-tunnel-950 transition-colors hover:bg-clock-400 disabled:opacity-40"
          >
            <ShareIcon className="h-5 w-5" />
            {image ? "Share" : "Preparing…"}
          </button>
        </div>
      </footer>
    </div>
  );
}
