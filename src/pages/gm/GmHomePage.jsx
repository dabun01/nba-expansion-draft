import { Link } from "react-router";

// Placeholder: becomes the how-it-works overlay + team selector.
export default function GmHomePage() {
  return (
    <div className="p-6 text-ink-500">
      <h1 className="text-2xl font-bold">Expansion Draft GM</h1>
      <p>Community protection lists are coming soon.</p>
      <Link to="/gm/results/ATL" className="underline">
        Test link: Hawks results
      </Link>
    </div>
  );
}
