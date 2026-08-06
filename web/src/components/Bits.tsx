import type { Org, Tier } from "@/lib/data";

const TIER_LEVEL: Record<NonNullable<Tier>, number> = {
  Small: 1,
  Medium: 2,
  Large: 3,
  Major: 4,
};

/** Income / size category, as a small magnitude meter instead of a colored pill. */
export function TierBadge({ tier }: { tier: Tier }) {
  if (!tier) return <span className="tier-meter-empty">No filing</span>;
  const level = TIER_LEVEL[tier];
  return (
    <span className="tier-meter" title={tier}>
      <span className="tier-meter-bars">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={`tm-bar${n <= level ? " filled" : ""}`} />
        ))}
      </span>
      <span className="tier-meter-label">{tier}</span>
    </span>
  );
}

/** Status, as a colored dot + plain text rather than a filled pill. */
export function StatusBadge({ org }: { org: Org }) {
  if (!org.ein)
    return (
      <span className="status-ind status-lookup">
        <i className="status-dot" />
        Needs lookup
      </span>
    );
  if (org.closedCandidate)
    return (
      <span className="status-ind status-closed">
        <i className="status-dot" />
        Closure candidate
      </span>
    );
  const signals = org.filingGaps.length + org.compJumpYears.length;
  if (signals === 0)
    return (
      <span className="status-ind status-stable">
        <i className="status-dot" />
        Stable
      </span>
    );
  return (
    <span className="status-ind status-signal">
      <i className="status-dot" />
      {signals} signal{signals > 1 ? "s" : ""}
    </span>
  );
}

/** Shared per-year cell data: filed years, gaps, and officer-pay-shift years. */
function timelineCells(org: Org) {
  if (!org.firstYear || !org.lastYear) return null;
  const filed = new Set(org.history.map((h) => h.year));
  const jumps = new Set(org.compJumpYears);
  const gapYears = new Set<number>();
  for (const g of org.filingGaps) {
    for (let yr = g.from + 1; yr < g.to; yr++) gapYears.add(yr);
  }
  const years: number[] = [];
  for (let yr = org.firstYear; yr <= org.lastYear; yr++) years.push(yr);

  return years.map((yr) => {
    let cls = "tl-filed";
    let title = `${yr}: filed`;
    if (gapYears.has(yr) || !filed.has(yr)) {
      cls = "tl-gap";
      title = `${yr}: no filing`;
    }
    if (jumps.has(yr)) {
      cls = "tl-jump";
      title = `${yr}: officer-pay shift (possible transition)`;
    }
    return { yr, cls, title };
  });
}

/** Full per-year strip: filed years in blue, gaps hatched, transition years in orange. */
export function LifespanTimeline({ org }: { org: Org }) {
  const cells = timelineCells(org);
  if (!cells) {
    return <div style={{ fontSize: 13, color: "var(--muted)" }}>No filing history available.</div>;
  }
  return (
    <div>
      <div className="timeline">
        {cells.map((c) => (
          <div key={c.yr} className={`tl-cell ${c.cls}`} title={c.title} />
        ))}
      </div>
      <div className="tl-years">
        <span>{org.firstYear}</span>
        <span>{org.lastYear}</span>
      </div>
    </div>
  );
}

/** Compact, label-free version of the same strip for list rows — same visual language as LifespanTimeline. */
export function MiniTimeline({ org }: { org: Org }) {
  const cells = timelineCells(org);
  if (!cells) return <span className="mini-timeline-empty">No history</span>;
  return (
    <div
      className="mini-timeline"
      title={`${org.firstYear}–${org.lastYear} · orange marks a possible leadership change`}
    >
      {cells.map((c) => (
        <span key={c.yr} className={`mt-cell ${c.cls}`} />
      ))}
    </div>
  );
}

/** Explains the mini-timeline's colors once, so the strip isn't a mystery on first look. */
export function TimelineLegend() {
  return (
    <span className="timeline-legend">
      Each block is one year on file:
      <span className="key"><i className="sw sw-filed" />filed</span>
      <span className="key"><i className="sw sw-gap" />gap</span>
      <span className="key"><i className="sw sw-jump" />pay shift</span>
    </span>
  );
}
