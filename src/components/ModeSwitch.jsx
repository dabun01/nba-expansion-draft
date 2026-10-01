import { NavLink } from "react-router";

const MODES = [
  // `end` makes "/" match only the homepage, not every path under it.
  { to: "/", label: "Simulator", end: true },
  { to: "/gm", label: "Community" },
];

// Switches between the draft simulator (/) and the community GM lists
// (/gm). NavLink marks the link for the current section as active.
export default function ModeSwitch({ className = "" }) {
  return (
    <nav
      aria-label="Site sections"
      className={`flex rounded-full border border-tunnel-700 bg-tunnel-950 p-1 ${className}`}
    >
      {MODES.map((mode) => (
        <NavLink
          key={mode.to}
          to={mode.to}
          end={mode.end}
          className={({ isActive }) =>
            `flex-1 whitespace-nowrap rounded-full px-4 py-1.5 text-center font-display text-sm font-semibold uppercase tracking-wider transition-colors ${
              isActive
                ? "bg-clock-500 text-tunnel-950"
                : "text-ink-500 hover:text-ink-100"
            }`
          }
        >
          {mode.label}
        </NavLink>
      ))}
    </nav>
  );
}
