import type { Org, Tier } from "@/lib/data";

/** Income / size category chip. Ordered light -> dark so bigger reads heavier. */
export function TierBadge({ tier }: { tier: Tier }) {
  if (!tier) return <span className="badge badge-muted">No filing</span>;
  const cls = {
    Small: "tier-1",
    Medium: "tier-2",
    Large: "tier-3",
    Major: "tier-4",
  }[tier];
  return <span className={`badge tier ${cls}`}>{tier}</span>;
}

export function TypeBadge({ type }: { type: string }) {
  if (type === "BID") return <span className="badge badge-bid">BID</span>;
  return <span className="badge badge-cdc">CDC</span>;
}

export function StatusBadge({ org }: { org: Org }) {
  if (!org.ein) return <span className="badge badge-muted">Needs lookup</span>;
  if (org.closedCandidate) return <span className="badge badge-closed">Closure candidate</span>;
  const signals = org.filingGaps.length + org.compJumpYears.length;
  if (signals === 0) return <span className="badge badge-stable">Stable</span>;
  return (
    <span className="badge badge-signal">
      {signals} signal{signals > 1 ? "s" : ""}
    </span>
  );
}

/** Per-year strip: filed years in blue, gaps hatched, transition years in orange. */
export function LifespanTimeline({ org }: { org: Org }) {
  if (!org.firstYear || !org.lastYear) {
    return <div style={{ fontSize: 13, color: "var(--muted)" }}>No filing history available.</div>;
  }
  const filed = new Set(org.history.map((h) => h.year));
  const jumps = new Set(org.compJumpYears);
  const gapYears = new Set<number>();
  for (const g of org.filingGaps) {
    for (let yr = g.from + 1; yr < g.to; yr++) gapYears.add(yr);
  }
  const years: number[] = [];
  for (let yr = org.firstYear; yr <= org.lastYear; yr++) years.push(yr);

  return (
    <div>
      <div className="timeline">
        {years.map((yr) => {
          let cls = "tl-cell tl-filed";
          let title = `${yr}: filed`;
          if (gapYears.has(yr) || !filed.has(yr)) {
            cls = "tl-cell tl-gap";
            title = `${yr}: no filing`;
          }
          if (jumps.has(yr)) {
            cls = "tl-cell tl-jump";
            title = `${yr}: officer-pay shift (possible transition)`;
          }
          return <div key={yr} className={cls} title={title} />;
        })}
      </div>
      <div className="tl-years">
        <span>{org.firstYear}</span>
        <span>{org.lastYear}</span>
      </div>
    </div>
  );
}
