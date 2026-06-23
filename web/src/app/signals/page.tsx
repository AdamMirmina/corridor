import Link from "next/link";
import { rankedByInstability } from "@/lib/data";
import { Sparkline } from "@/components/Charts";
import { TypeBadge } from "@/components/Bits";

export const metadata = { title: "Signals · Philadelphia CDC & BID Tracker" };

export default function SignalsPage() {
  const ranked = rankedByInstability().filter((o) => o.instability > 0);

  return (
    <section className="section">
      <div className="container">
        <div className="eyebrow">Leadership-transition signals</div>
        <h1 className="serif" style={{ fontSize: 38, marginTop: 10 }}>
          Where leadership likely moved
        </h1>
        <p className="lede" style={{ marginTop: 12, fontSize: 15.5 }}>
          Organizations ranked by how much their record suggests instability. These are
          leads to investigate, not conclusions. Open any one to see the evidence.
        </p>

        <div className="callout" style={{ marginTop: 22, borderLeftColor: "var(--accent)" }}>
          <b>How the score works.</b> A filing gap counts twice, a sharp officer-pay shift
          counts once, and an organization whose filings stop early adds three. Officer pay
          is the proxy because a new executive director usually arrives at a different
          salary, which surfaces in the next Form 990.
        </div>

        <div className="table-wrap" style={{ marginTop: 22 }}>
          <table className="data">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Signals</th>
                <th className="num hide-sm">Officer pay</th>
                <th className="num">Score</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((o) => (
                <tr key={o.ein} className="clickable">
                  <td>
                    <Link href={`/organizations/${o.ein}`} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <TypeBadge type={o.type} />
                      <span className="cell-name">{o.name}</span>
                    </Link>
                  </td>
                  <td>
                    <div className="chip-row">
                      {o.compJumpYears.length > 0 && (
                        <span className="badge badge-signal">
                          {o.compJumpYears.length} pay shift{o.compJumpYears.length > 1 ? "s" : ""}
                        </span>
                      )}
                      {o.filingGaps.length > 0 && (
                        <span className="badge badge-muted">
                          {o.filingGaps.length} gap{o.filingGaps.length > 1 ? "s" : ""}
                        </span>
                      )}
                      {o.closedCandidate && <span className="badge badge-closed">Closure candidate</span>}
                    </div>
                  </td>
                  <td className="num hide-sm">
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <Sparkline values={o.history.map((h) => h.officerComp)} color="var(--signal)" />
                    </div>
                  </td>
                  <td className="num tnum" style={{ fontWeight: 650 }}>{o.instability}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
