import { useRef, useState } from "react";
import { useDraftStore } from "../../store/useDraftStore";
import { PROTECT_COUNT } from "../../lib/draftEngine";

const logoModules = import.meta.glob(
  "../../assets/team-logos/*.{png,jpg,jpeg,svg,webp,gif}",
  {
    eager: true,
    import: "default",
  },
);

const logoByKey = new Map();

const logoAliases = {
  LAC: "LOSANGELESCLIPPERS",
  OKC: "OKCTHUNDER",
};

for (const [path, url] of Object.entries(logoModules)) {
  const fileName = path.split("/").pop() || "";
  const baseName = fileName.replace(/\.[^.]+$/, "");
  const key = baseName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/LOGOS?$/, "");
  logoByKey.set(key, url);
}

function normalizeTeamKey(value) {
  if (typeof value !== "string") return "";
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/LOGOS?$/, "");
}

function getTeamLogoSrc(team) {
  const candidates = [team.id, team.abbreviation, team.name].map(
    normalizeTeamKey,
  );
  for (const candidate of candidates) {
    if (logoByKey.has(candidate)) return logoByKey.get(candidate);
    if (logoAliases[candidate] && logoByKey.has(logoAliases[candidate])) {
      return logoByKey.get(logoAliases[candidate]);
    }
  }
  return null;
}

function TeamLogo({ teamId, name, src, className = "" }) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-tunnel-700 bg-tunnel-800 font-mono text-[10px] font-semibold text-ink-400 ${className}`}
      >
        {teamId}
      </span>
    );
  }

  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-tunnel-700 bg-tunnel-800 ${className}`}
    >
      <img
        src={src}
        alt={`${name} logo`}
        className="h-full w-full object-contain p-1"
        onError={() => setHasError(true)}
      />
    </span>
  );
}

export default function TeamSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [conference, setConference] = useState("all");
  const teams = useDraftStore((s) => s.teams);
  const expansionTeams = useDraftStore((s) => s.expansionTeams);
  const selectedTeamId = useDraftStore((s) => s.selectedTeamId);
  const setSelectedTeamId = useDraftStore((s) => s.setSelectedTeamId);
  const phase = useDraftStore((s) => s.phase);
  const protectionModeByTeam = useDraftStore((s) => s.protectionModeByTeam);
  const manualProtectedIdsByTeam = useDraftStore(
    (s) => s.manualProtectedIdsByTeam,
  );
  const filteredTeams = teams.filter((team) => {
    if (conference === "all") return true;
    return team.conference?.toLowerCase() === conference;
  });
  const visibleTeamIds = [
    ...filteredTeams.map((team) => team.id),
    ...(phase === "draft" || phase === "recap"
      ? expansionTeams.map((team) => team.id)
      : []),
  ];
  const teamButtonRefs = useRef(new Map());

  const handleTeamKeyDown = (event, teamId) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    const currentIndex = visibleTeamIds.indexOf(teamId);
    if (currentIndex === -1 || visibleTeamIds.length === 0) return;

    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? visibleTeamIds.length - 1
          : (currentIndex +
              (event.key === "ArrowDown" ? 1 : -1) +
              visibleTeamIds.length) %
            visibleTeamIds.length;
    const nextTeamId = visibleTeamIds[nextIndex];

    setSelectedTeamId(nextTeamId);
    teamButtonRefs.current.get(nextTeamId)?.focus();
  };
  const conferenceOptions = [
    { id: "east", label: "Eastern", shortLabel: "E" },
    { id: "west", label: "Western", shortLabel: "W" },
    { id: "all", label: "All", shortLabel: "A" },
  ];

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-tunnel-700 bg-tunnel-900 transition-[width] duration-200 ${
        isCollapsed ? "w-16" : "w-60"
      }`}
    >
      <div
        className={`flex items-center border-b border-tunnel-700 py-4 ${
          isCollapsed ? "justify-center px-2" : "justify-between px-4"
        }`}
      >
        {!isCollapsed ? (
          <p className="font-display text-xs uppercase tracking-widest text-ink-500">
            Existing franchises
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => setIsCollapsed((collapsed) => !collapsed)}
          aria-label={
            isCollapsed ? "Expand team sidebar" : "Collapse team sidebar"
          }
          aria-pressed={isCollapsed}
          title={isCollapsed ? "Expand team sidebar" : "Collapse team sidebar"}
          className="flex h-8 w-8 items-center justify-center rounded border border-tunnel-700 font-mono text-sm text-ink-500 transition-colors hover:border-tunnel-500 hover:text-ink-100"
        >
          {isCollapsed ? ">" : "<"}
        </button>
      </div>
      {!isCollapsed ? (
        <div className="border-b border-tunnel-700 px-3 py-2">
          <div className="flex gap-1">
            {conferenceOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setConference(option.id)}
                aria-label={`${option.label} conference teams`}
                aria-pressed={conference === option.id}
                title={`${option.label} conference teams`}
                className={`flex-1 rounded px-1 py-1.5 font-display text-[10px] uppercase tracking-wide transition-colors ${
                  conference === option.id
                    ? "bg-tunnel-700 text-ink-100"
                    : "text-ink-500 hover:bg-tunnel-800 hover:text-ink-300"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {filteredTeams.map((team) => {
          const mode = protectionModeByTeam[team.id] || "auto";
          const needsProtection =
            mode === "manual" &&
            (manualProtectedIdsByTeam[team.id] || []).length < PROTECT_COUNT;

          return (
            <div
              key={team.id}
              className={`flex items-center ${
                selectedTeamId === team.id ? "bg-tunnel-800" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedTeamId(team.id)}
                onKeyDown={(event) => handleTeamKeyDown(event, team.id)}
                ref={(element) => {
                  if (element) teamButtonRefs.current.set(team.id, element);
                  else teamButtonRefs.current.delete(team.id);
                }}
                title={isCollapsed ? team.name : undefined}
                className={`flex min-w-0 flex-1 items-center py-2.5 text-left text-sm transition-colors ${
                  isCollapsed ? "justify-center px-2" : "gap-3 px-4"
                } ${
                  selectedTeamId === team.id
                    ? "text-ink-100"
                    : "text-ink-500 hover:bg-tunnel-800/60 hover:text-ink-300"
                }`}
              >
                <TeamLogo
                  teamId={team.id}
                  name={team.name}
                  src={getTeamLogoSrc(team)}
                />
                {!isCollapsed ? (
                  <span className="flex min-w-0 items-center gap-2 truncate">
                    <span className="truncate">{team.name}</span>
                    {phase === "protection" ? (
                      <span
                        aria-label={
                          needsProtection
                            ? "Needs players protected"
                            : "Ready for draft"
                        }
                        title={
                          needsProtection
                            ? "Needs players protected"
                            : "Ready for draft"
                        }
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          needsProtection ? "bg-exposed-500" : "bg-protect-500"
                        }`}
                      />
                    ) : null}
                  </span>
                ) : null}
              </button>
            </div>
          );
        })}
      </nav>
      {phase === "draft" || phase === "recap" ? (
        <div
          className={`border-t border-tunnel-700 py-4 ${
            isCollapsed ? "px-2" : "px-4"
          }`}
        >
          {!isCollapsed ? (
            <p className="mb-2 font-display text-xs uppercase tracking-widest text-ink-500">
              Expansion teams
            </p>
          ) : null}
          {expansionTeams.map((et) => (
            <button
              key={et.id}
              type="button"
              onClick={() => setSelectedTeamId(et.id)}
              onKeyDown={(event) => handleTeamKeyDown(event, et.id)}
              ref={(element) => {
                if (element) teamButtonRefs.current.set(et.id, element);
                else teamButtonRefs.current.delete(et.id);
              }}
              title={isCollapsed ? et.name : undefined}
              className={`flex w-full items-center rounded py-1.5 text-left text-sm ${
                isCollapsed ? "justify-center px-0" : "gap-2 px-2"
              } ${
                selectedTeamId === et.id
                  ? "bg-tunnel-800"
                  : "hover:bg-tunnel-800/60"
              }`}
            >
              <TeamLogo
                teamId={et.id}
                name={et.name}
                src={getTeamLogoSrc(et)}
              />
              {!isCollapsed ? (
                <>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      et.id === "SEA" ? "bg-seattle-500" : "bg-vegas-500"
                    }`}
                  />
                  {et.name}
                </>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </aside>
  );
}
