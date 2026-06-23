import Link from "next/link";
import {
  getDataset,
  longevityBuckets,
  rankedByInstability,
} from "@/lib/data";
import { Sparkline } from "@/components/Charts";
import { TypeBadge, StatusBadge } from "@/components/Bits";

export default function Overview() {
  const { summary } = getDataset();
  const longevity = longevityBuckets();
  const maxBucket = Math.max(...longevity.map((d) => d.count), 1);
  const volatile = rankedByInstability().filter((o) => o.instability > 0).slice(0, 8);

  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="eyebrow">Drexel STAR Scholars &middot; Summer 2026</div>
          <h1 className="serif" style={{ marginTop: 14 }}>
            Leadership and longevity in Philadelphia&apos;s neighborhoods
          </h1>
          <p className="lede">
            A tracked history of the Community Development Corporations and Business
            Improvement Districts that hold up Philadelphia&apos;s commercial corridors and
            affordable housing. Structural size, operational lifespan, and the moments
            leadership likely changed hands.
          </p>
          <div className="q">
            <b>Research question.</b> What factors determine leadership transitions in
            community economic development organizations in Philadelphia?
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="stat-grid">
            <div className="stat">
              <div className="v tnum">{summary.total}</div>
              <div className="k">Organizations tracked</div>
              <div className="sub">
                {summary.cdcs} CDCs &middot; {summary.bids} BIDs
              </div>
            </div>
            <div className="stat">
              <div className="v tnum">{summary.withFinancialData}</div>
              <div className="k">With filing history</div>
              <div className="sub">
                {summary.earliestYear}&ndash;{summary.latestYear} from IRS Form 990
              </div>
            </div>
            <div className="stat">
              <div className="v tnum">{summary.withSignal}</div>
              <div className="k">Flagged for a transition</div>
              <div className="sub">Pay shift or filing gap</div>
            </div>
            <div className="stat">
              <div className="v tnum">{summary.closureCandidates}</div>
              <div className="k">Closure candidates</div>
              <div className="sub">Filings stopped before 2022</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid-2">
          <div className="card card-pad">
            <div className="card-head">
              <h3>Filing longevity</h3>
              <span className="meta">Years of Form 990 on record</span>
            </div>
            <div className="bars">
              {longevity.map((d) => (
                <div className="bar-row" key={d.label}>
                  <span className="lbl">{d.label}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(d.count / maxBucket) * 100}%` }} />
                  </div>
                  <span className="cnt">{d.count}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12.5, color: "var(--faint)", marginTop: 14, marginBottom: 0 }}>
              How many years each organization has filed. The IRS digitized record begins
              around 2010, so this measures recent continuity, not total age.
            </p>
          </div>

          <div className="card card-pad">
            <div className="card-head">
              <h3>Coverage</h3>
              <span className="meta">Match quality</span>
            </div>
            <CoverageRow label="Matched to an IRS record" value={summary.matched} total={summary.total} color="var(--accent)" />
            <CoverageRow label="High-confidence match" value={summary.highConfidence} total={summary.total} color="var(--stable)" />
            <CoverageRow label="Needs manual lookup" value={summary.needsLookup} total={summary.total} color="var(--signal)" />
            <div className="callout" style={{ marginTop: 18 }}>
              Acronym-named and fiscally sponsored organizations are left unmatched rather
              than tied to a wrong EIN. A wrong match would quietly corrupt the data.
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card card-pad">
            <div className="card-head">
              <h3>Most volatile organizations</h3>
              <Link href="/signals" className="meta" style={{ color: "var(--accent)" }}>
                See all signals &rarr;
              </Link>
            </div>
            <div className="lb">
              {volatile.map((o, i) => (
                <div className="lb-item" key={o.ein}>
                  <span className="lb-rank tnum">{i + 1}</span>
                  <div className="lb-body">
                    <Link href={`/organizations/${o.ein}`} className="lb-name">
                      {o.name}
                    </Link>
                    <div className="lb-tags">
                      <TypeBadge type={o.type} />
                      <StatusBadge org={o} />
                    </div>
                  </div>
                  <div className="lb-spark">
                    <Sparkline values={o.history.map((h) => h.officerComp)} color="var(--signal)" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function CoverageRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = Math.round((value / total) * 100);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 6 }}>
        <span style={{ color: "var(--ink-soft)" }}>{label}</span>
        <span className="tnum" style={{ color: "var(--muted)" }}>
          {value} <span style={{ color: "var(--faint)" }}>/ {total}</span>
        </span>
      </div>
      <div className="bar-track" style={{ height: 8 }}>
        <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
