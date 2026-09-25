import { Link, useParams } from "react-router";
import { useDraftStore } from "../../store/useDraftStore";

// Placeholder: becomes the "How GMs protected" view.
export default function GmResultsPage() {
  const { teamId } = useParams();
  const teams = useDraftStore((s) => s.teams);
  const team = teams.find((t) => t.id === teamId?.toUpperCase());

  if (!team) {
    return (
      <div className="p-6 text-ink-500">
        <p>No team called "{teamId}".</p>
        <Link to="/gm" className="underline">Back</Link>
      </div>
    );
  }

  return (
    <div className="p-6 text-ink-500">
      <h1 className="text-2xl font-bold">{team.name}</h1>
      <p>Community results will show here.</p>
      <Link to="/gm" className="underline">Back</Link>
    </div>
  );
}
