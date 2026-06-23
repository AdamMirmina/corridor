import { formatMoney } from "@/lib/data";

/* ---------------- Sparkline (compact, for the leaderboard) ---------------- */

export function Sparkline({
  values,
  width = 84,
  height = 28,
  color = "var(--accent)",
}: {
  values: (number | null)[];
  width?: number;
  height?: number;
  color?: string;
}) {
  const pts = values.filter((v): v is number => v !== null);
  if (pts.length < 2) {
    return <svg width={width} height={height} aria-hidden />;
  }
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const step = width / (pts.length - 1);
  const y = (v: number) => height - 3 - ((v - min) / span) * (height - 6);
  const d = pts.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg width={width} height={height} aria-hidden style={{ display: "block" }}>
      <path d={d} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={(pts.length - 1) * step} cy={y(pts[pts.length - 1])} r={2.4} fill={color} />
    </svg>
  );
}

/* ---------------- Multi-series line / area chart ---------------- */

type Series = {
  key: string;
  label: string;
  color: string;
  values: (number | null)[];
  fill?: boolean;
};

export function MetricChart({
  years,
  series,
  markers = [],
  height = 230,
  money = true,
}: {
  years: number[];
  series: Series[];
  markers?: number[];
  height?: number;
  money?: boolean;
}) {
  const W = 760;
  const H = height;
  const padL = 8;
  const padR = 14;
  const padT = 18;
  const padB = 26;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const all = series.flatMap((s) => s.values).filter((v): v is number => v !== null);
  const maxV = all.length ? Math.max(...all) : 1;
  const minV = 0;
  const span = maxV - minV || 1;

  const x = (i: number) => padL + (years.length === 1 ? innerW / 2 : (i / (years.length - 1)) * innerW);
  const y = (v: number) => padT + innerH - ((v - minV) / span) * innerH;

  const gridVals = [0, 0.5, 1].map((f) => minV + f * span);

  function linePath(values: (number | null)[]) {
    let d = "";
    let started = false;
    values.forEach((v, i) => {
      if (v === null) return;
      d += `${!started ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)} `;
      started = true;
    });
    return d.trim();
  }
  function areaPath(values: (number | null)[]) {
    const present = values.map((v, i) => ({ v, i })).filter((p) => p.v !== null) as { v: number; i: number }[];
    if (present.length < 2) return "";
    let d = `M${x(present[0].i).toFixed(1)},${(padT + innerH).toFixed(1)} `;
    present.forEach((p) => (d += `L${x(p.i).toFixed(1)},${y(p.v).toFixed(1)} `));
    d += `L${x(present[present.length - 1].i).toFixed(1)},${(padT + innerH).toFixed(1)} Z`;
    return d;
  }

  const yearTicks = (() => {
    const idx = new Set<number>([0, years.length - 1]);
    markers.forEach((m) => {
      const i = years.indexOf(m);
      if (i >= 0) idx.add(i);
    });
    if (years.length > 6) idx.add(Math.floor((years.length - 1) / 2));
    return [...idx].sort((a, b) => a - b);
  })();

  const fmt = (v: number) => (money ? formatMoney(v) : Math.round(v).toLocaleString());

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" style={{ display: "block" }}>
        {/* gridlines + y labels */}
        {gridVals.map((gv, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={y(gv)} y2={y(gv)} stroke="var(--hairline)" strokeWidth={1} />
            <text x={padL + 2} y={y(gv) - 4} fontSize={10.5} fill="var(--faint)">
              {fmt(gv)}
            </text>
          </g>
        ))}

        {/* marker verticals (leadership signal years) */}
        {markers.map((m) => {
          const i = years.indexOf(m);
          if (i < 0) return null;
          return (
            <g key={m}>
              <line
                x1={x(i)}
                x2={x(i)}
                y1={padT - 4}
                y2={padT + innerH}
                stroke="var(--signal)"
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.55}
              />
              <circle cx={x(i)} cy={padT - 4} r={3} fill="var(--signal)" />
            </g>
          );
        })}

        {/* series */}
        {series.map((s) => (
          <g key={s.key}>
            {s.fill && <path d={areaPath(s.values)} fill={s.color} opacity={0.1} />}
            <path d={linePath(s.values)} fill="none" stroke={s.color} strokeWidth={2.1} strokeLinejoin="round" strokeLinecap="round" />
            {s.values.map((v, i) =>
              v === null ? null : <circle key={i} cx={x(i)} cy={y(v)} r={2.2} fill={s.color} />
            )}
          </g>
        ))}

        {/* x ticks */}
        {yearTicks.map((i) => (
          <text key={i} x={x(i)} y={H - 8} fontSize={10.5} fill="var(--muted)" textAnchor={i === 0 ? "start" : i === years.length - 1 ? "end" : "middle"}>
            {years[i]}
          </text>
        ))}
      </svg>

      <div className="chart-legend">
        {series.map((s) => (
          <span className="li" key={s.key}>
            <span className="sw" style={{ background: s.color }} /> {s.label}
          </span>
        ))}
        {markers.length > 0 && (
          <span className="li">
            <span className="sw" style={{ background: "var(--signal)" }} /> Possible leadership transition
          </span>
        )}
      </div>
    </div>
  );
}
