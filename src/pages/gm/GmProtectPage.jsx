import { Link } from "react-router";
import { useDraftStore } from "../../store/useDraftStore";
import { useGmStore } from "../../store/useGmStore";

// Placeholder: becomes step 2, the protect-8 roster screen.
export default function GmProtectPage() {
  const teams = useDraftStore((s) => s.teams);
  const selectedTeamIds = useGmStore((s) => s.selectedTeamIds);
  const selected = teams.filter((t) => selectedTeamIds.includes(t.id));

  return (
    <div className="p-6 text-ink-500">
      <h1 className="text-2xl font-bold">Protect your rosters</h1>
      <p>Coming next. Teams selected: {selected.map((t) => t.name).join(", ") || "none"}</p>
      <Link to="/gm" className="underline">Back</Link>
    </div>
  );
}
