import Link from "next/link";
import { notFound } from "next/navigation";
import { detailOrgs, getOrg, formatMoneyFull, incomeTier, sizeTier, latestAssets } from "@/lib/data";
import { MetricChart } from "@/components/Charts";
import { TypeBadge, StatusBadge, TierBadge, LifespanTimeline } from "@/components/Bits";
import { Leadership } from "@/components/Leadership";
import { NewsList } from "@/components/NewsList";
import { TaxCreditCard } from "@/components/TaxCreditCard";
import { Filings } from "@/components/Filings";

export function generateStaticParams() {
  return detailOrgs().map((o) => ({ ein: o.ein }));
}

export async function generateMetadata({ params }: { params: Promise<{ ein: string }> }) {
  const { ein } = await params;
  const org = getOrg(ein);
  return { title: org ? `${org.name} · Corridor` : "Organization" };
}

export default async function OrgDetail({ params }: { params: Promise<{ ein: string }> }) {
  const { ein } = await params;
  const org = getOrg(ein);
  if (!org || org.history.length === 0) notFound();

  const years = org.history.map((h) => h.year as number);
  const pdfByYear = new Map(org.filings.map((f) => [f.year, f.pdfUrl]));
  const einFmt = ein.length === 9 ? `${ein.slice(0, 2)}-${ein.slice(2)}` : ein;
  const tenureNote = describeSignals(org.compJumpYears, org.filingGaps);

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 920 }}>
        <Link href="/organizations" className="back">← All organizations</Link>

        <div className="detail-head">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <TypeBadge type={org.type} />
              <StatusBadge org={org} />
            </div>
            <h1 className="serif">{org.name}</h1>
            {org.irsName && org.irsName.toLowerCase() !== org.name.toLowerCase() && (
              <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 6 }}>
                Filed as {org.irsName}
              </div>
            )}
            <div className="detail-meta">
              <span className="badge badge-muted">EIN {einFmt}</span>
              {org.irsCity && <span className="badge badge-muted">{org.irsCity}, PA</span>}
            </div>
            {org.address && (
              <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 6 }}>{org.address}</div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <a className="outlink" href={`https://projects.propublica.org/nonprofits/organizations/${ein}`} target="_blank" rel="noreferrer">
              IRS filings on ProPublica →
            </a>
            {org.website && (
              <a className="outlink" href={`https://${org.website.replace(/^https?:\/\//, "")}`} target="_blank" rel="noreferrer">
                {org.website.replace(/^https?:\/\//, "")} →
              </a>
            )}
            <a className="outlink" href={`https://news.google.com/search?q=${encodeURIComponent(`"${org.name}" Philadelphia`)}`} target="_blank" rel="noreferrer">
              News coverage →
            </a>
          </div>
        </div>

        <div className="kv-row">
          <div className="kv"><div className="k">First on record</div><div className="v tnum">{org.firstYear}</div></div>
          <div className="kv"><div className="k">Latest filing</div><div className="v tnum">{org.lastYear}</div></div>
          <div className="kv"><div className="k">Years filed</div><div className="v tnum">{org.yearsFiled}</div></div>
          <div className="kv">
            <div className="k">Income</div>
            <div className="v tnum">{formatMoneyFull(org.latestRevenue)}</div>
            <div className="kv-tag"><TierBadge tier={incomeTier(org)} /></div>
          </div>
          <div className="kv">
            <div className="k">Size (assets)</div>
            <div className="v tnum">{formatMoneyFull(latestAssets(org))}</div>
            <div className="kv-tag"><TierBadge tier={sizeTier(org)} /></div>
          </div>
        </div>

        {org.notes && (
          <div className="callout" style={{ marginTop: 16 }}>
            <b>
              {org.source === "Temple archives"
                ? `From the archives${org.archiveCollection ? ` (${org.archiveCollection})` : ""}`
                : `Source note (${org.source})`}
              .
            </b>{" "}
            {org.notes}
          </div>
        )}

        {/* Current leadership */}
        <Leadership org={org} />

        {/* CDC Tax Credit participation */}
        <TaxCreditCard org={org} />

        {/* Lifespan */}
        <div className="card card-pad" style={{ marginTop: 26 }}>
          <div className="card-head">
            <h3>Operational lifespan</h3>
            <span className="meta">Each block is one year</span>
          </div>
          <LifespanTimeline org={org} />
          {org.closedCandidate && (
            <div className="callout" style={{ marginTop: 16 }}>
              <b>Closure candidate.</b> No Form 990 on record after {org.lastYear}. This may
              signal dissolution, a merger, or a drop below the filing threshold. Confirm
              against the PA Department of State registry.
            </div>
          )}
        </div>

        {/* Financial size */}
        <div className="card card-pad" style={{ marginTop: 16 }}>
          <div className="card-head">
            <h3>Revenue and expenses</h3>
            <span className="meta">Structural size over time</span>
          </div>
          <MetricChart
            years={years}
            markers={org.compJumpYears}
            series={[
              { key: "rev", label: "Revenue", color: "var(--accent)", values: org.history.map((h) => h.revenue), fill: true },
              { key: "exp", label: "Expenses", color: "var(--ink-soft)", values: org.history.map((h) => h.expenses) },
            ]}
          />
        </div>

        {/* Leadership signal */}
        <div className="card card-pad" style={{ marginTop: 16 }}>
          <div className="card-head">
            <h3>Officer compensation</h3>
            <span className="meta">Leadership-transition signal</span>
          </div>
          <MetricChart
            years={years}
            markers={org.compJumpYears}
            series={[
              { key: "comp", label: "Total officer pay", color: "var(--signal)", values: org.history.map((h) => h.officerComp), fill: true },
            ]}
          />
          <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginTop: 14, marginBottom: 0 }}>
            {tenureNote}
          </p>
        </div>

        {/* In the news */}
        <NewsList org={org} />

        {/* Yearly table */}
        <div className="card card-pad" style={{ marginTop: 16 }}>
          <div className="card-head">
            <h3>Year by year</h3>
            <span className="meta">From IRS Form 990</span>
          </div>
          <div className="table-wrap" style={{ boxShadow: "none" }}>
            <table className="data">
              <thead>
                <tr>
                  <th className="num">Year</th>
                  <th className="num">Revenue</th>
                  <th className="num">Expenses</th>
                  <th className="num">Assets</th>
                  <th className="num">Officer pay</th>
                  <th className="num hide-sm">Staff</th>
                  <th className="num">990</th>
                </tr>
              </thead>
              <tbody>
                {[...org.history].reverse().map((h) => {
                  const jump = h.year && org.compJumpYears.includes(h.year);
                  const pdf = h.year ? pdfByYear.get(h.year) : undefined;
                  return (
                    <tr key={h.year}>
                      <td className="num tnum" style={{ fontWeight: 600 }}>
                        {h.year}
                        {jump && <span title="Possible transition" style={{ color: "var(--signal)", marginLeft: 6 }}>●</span>}
                      </td>
                      <td className="num tnum">{money(h.revenue)}</td>
                      <td className="num tnum">{money(h.expenses)}</td>
                      <td className="num tnum">{money(h.assets)}</td>
                      <td className="num tnum">{money(h.officerComp)}</td>
                      <td className="num tnum hide-sm">{h.employees ?? "—"}</td>
                      <td className="num">
                        {pdf ? (
                          <a href={pdf} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontWeight: 500 }}>
                            PDF
                          </a>
                        ) : (
                          <span style={{ color: "var(--faint)" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* All Form 990 documents */}
        <Filings org={org} />
      </div>
    </section>
  );
}

function money(n: number | null) {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function describeSignals(jumps: number[], gaps: { from: number; to: number }[]): string {
  const parts: string[] = [];
  if (jumps.length) {
    parts.push(
      `Officer compensation shifted sharply in ${listYears(jumps)}, each a candidate year for an executive-director change worth confirming against the 990 itself.`
    );
  } else {
    parts.push("Officer compensation stayed steady year to year, suggesting leadership continuity.");
  }
  if (gaps.length) {
    parts.push(
      `Filing gaps (${gaps.map((g) => `${g.from}–${g.to}`).join(", ")}) interrupt the record and may coincide with instability.`
    );
  }
  return parts.join(" ");
}

function listYears(ys: number[]): string {
  if (ys.length === 1) return String(ys[0]);
  if (ys.length === 2) return `${ys[0]} and ${ys[1]}`;
  return `${ys.slice(0, -1).join(", ")}, and ${ys[ys.length - 1]}`;
}
