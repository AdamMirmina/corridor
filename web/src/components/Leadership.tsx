import type { Org } from "@/lib/data";
import { formatMoneyFull } from "@/lib/data";

const DEPARTED = /\(to\b/i; // titles like "(To 07/2024)" mark a recorded exit

export function Leadership({ org }: { org: Org }) {
  if (!org.officers.length) {
    return (
      <div className="card card-pad" style={{ marginTop: 16 }}>
        <div className="card-head">
          <h3>Current leadership</h3>
        </div>
        <p style={{ fontSize: 13.5, color: "var(--muted)", margin: 0 }}>
          No officer roster is on record for this organization&apos;s latest filing. Small
          organizations that file the short Form 990-EZ do not report a Part VII roster.
        </p>
      </div>
    );
  }
  const ex = org.executive;
  return (
    <div className="card card-pad" style={{ marginTop: 16 }}>
      <div className="card-head">
        <h3>Current leadership</h3>
        <span className="meta">
          Form 990 Part VII{org.leadershipAsOf ? `, FY ${org.leadershipAsOf}` : ""}
        </span>
      </div>

      {ex && (
        <div className="lead-exec">
          <div>
            <div className="eyebrow">Executive</div>
            <div className="lead-name serif">{ex.name}</div>
            <div className="lead-title">{ex.title}</div>
          </div>
          {ex.comp ? (
            <div className="kv" style={{ textAlign: "right" }}>
              <div className="k">Reported pay</div>
              <div className="v tnum">{formatMoneyFull(ex.comp)}</div>
            </div>
          ) : null}
        </div>
      )}

      <div className="table-wrap" style={{ boxShadow: "none", marginTop: 16 }}>
        <table className="data">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th className="num hide-sm">Reported pay</th>
            </tr>
          </thead>
          <tbody>
            {org.officers.map((o) => (
              <tr key={o.name} className={o.isExecutive ? "row-exec" : ""}>
                <td className="cell-name">{o.name}</td>
                <td>
                  {o.title.replace(/\s*\(to[^)]*\)/i, "")}
                  {DEPARTED.test(o.title) && (
                    <span className="badge badge-muted" style={{ marginLeft: 8 }}>
                      departed {o.title.match(/\(to ([^)]*)\)/i)?.[1] ?? ""}
                    </span>
                  )}
                </td>
                <td className="num tnum hide-sm">{o.comp ? formatMoneyFull(o.comp) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--faint)", marginTop: 12, marginBottom: 0 }}>
        Current as of the latest Form 990. A &ldquo;departed&rdquo; tag is the date that
        filing recorded an officer leaving, a documented transition.
      </p>
    </div>
  );
}
