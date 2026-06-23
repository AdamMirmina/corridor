import { getOrgs, getDataset } from "@/lib/data";
import { RosterTable } from "@/components/RosterTable";

export const metadata = { title: "Organizations · Corridor" };

export default function OrganizationsPage() {
  const orgs = getOrgs();
  const { summary } = getDataset();
  return (
    <section className="section">
      <div className="container">
        <div className="eyebrow">The roster</div>
        <h1 className="serif" style={{ fontSize: 38, marginTop: 10 }}>
          {summary.total} CDCs
        </h1>
        <p className="lede" style={{ marginTop: 12, fontSize: 15.5 }}>
          Every Community Development Corporation in the study. Search, filter, and sort.
          Open any organization for its full financial and leadership history.
        </p>
        <div style={{ marginTop: 26 }}>
          <RosterTable orgs={orgs} />
        </div>
      </div>
    </section>
  );
}
