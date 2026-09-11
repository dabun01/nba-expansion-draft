import { useState } from "react";

const logoModules = import.meta.glob(
  "../assets/team-logos/*.{png,jpg,jpeg,svg,webp,gif}",
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

export default function TeamLogo({
  team,
  sizeClassName = "h-12 w-12",
  className = "",
  showFrame = true,
}) {
  const [hasError, setHasError] = useState(false);
  const src = getTeamLogoSrc(team);

  if (hasError || !src) {
    return (
      <span
        className={`flex ${sizeClassName} shrink-0 items-center justify-center font-mono text-xs font-semibold text-ink-400 ${showFrame ? "rounded-full border border-tunnel-700 bg-tunnel-800" : ""} ${className}`}
      >
        {team.abbreviation || team.id}
      </span>
    );
  }

  return (
    <span
      className={`flex ${sizeClassName} shrink-0 items-center justify-center overflow-hidden ${showFrame ? "rounded-full border border-tunnel-700 bg-tunnel-800" : ""} ${className}`}
    >
      <img
        src={src}
        alt={`${team.name} logo`}
        className="h-full w-full object-contain p-1"
        onError={() => setHasError(true)}
      />
    </span>
  );
}
