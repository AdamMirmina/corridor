"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Org } from "@/lib/data";
import { formatMoney, incomeTier, sizeTier, latestAssets } from "@/lib/data";
import { StatusBadge, TierBadge } from "@/components/Bits";

type SortKey = "name" | "yearsFiled" | "latestRevenue" | "assets" | "lastYear" | "instability";
type Filter = "all" | "cdc" | "bid" | "signal" | "lookup" | "archives";

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "signal", label: "Has signal" },
  { key: "lookup", label: "Needs lookup" },
  { key: "archives", label: "New from Temple archives" },
];

export function RosterTable({ orgs }: { orgs: Org[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("name");
  const [dir, setDir] = useState<1 | -1>(1);

  const rows = useMemo(() => {
    let r = orgs;
    const needle = q.trim().toLowerCase();
    if (needle)
      r = r.filter(
        (o) =>
          o.name.toLowerCase().includes(needle) ||
          o.irsName.toLowerCase().includes(needle) ||
          (o.executive?.name.toLowerCase().includes(needle) ?? false)
      );
    if (filter === "cdc") r = r.filter((o) => o.type === "CDC");
    if (filter === "bid") r = r.filter((o) => o.type === "BID");
    if (filter === "signal") r = r.filter((o) => o.filingGaps.length || o.compJumpYears.length);
    if (filter === "lookup") r = r.filter((o) => !o.ein);
    if (filter === "archives") r = r.filter((o) => o.source === "Temple archives");

    const val = (o: Org): number | string => {
      switch (sort) {
        case "name": return o.name.toLowerCase();
        case "yearsFiled": return o.yearsFiled;
        case "latestRevenue": return o.latestRevenue ?? -1;
        case "assets": return latestAssets(o) ?? -1;
        case "lastYear": return o.lastYear ?? -1;
        case "instability": return o.instability;
      }
    };
    return [...r].sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [orgs, q, filter, sort, dir]);

  const toggleSort = (k: SortKey) => {
    if (sort === k) setDir((d) => (d === 1 ? -1 : 1));
    else {
      setSort(k);
      setDir(k === "name" ? 1 : -1);
    }
  };

  const arrow = (k: SortKey) => (sort === k ? <span className="arrow">{dir === 1 ? "↑" : "↓"}</span> : null);

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <input
          className="search"
          style={{ maxWidth: 320 }}
          placeholder="Search organizations…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="chip-row">
          {filters.map((f) => (
            <button key={f.key} className={`chip ${filter === f.key ? "on" : ""}`} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--muted)" }} className="hide-sm tnum">
          {rows.length} shown
        </span>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th className="sortable" onClick={() => toggleSort("name")}>Organization {arrow("name")}</th>
              <th className="hide-sm">Executive director</th>
              <th>Status</th>
              <th className="sortable num" onClick={() => toggleSort("lastYear")}>Active {arrow("lastYear")}</th>
              <th className="sortable num" onClick={() => toggleSort("yearsFiled")}>Years {arrow("yearsFiled")}</th>
              <th className="sortable num" onClick={() => toggleSort("latestRevenue")}>Income {arrow("latestRevenue")}</th>
              <th className="sortable num" onClick={() => toggleSort("assets")}>Size {arrow("assets")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const clickable = !!o.ein;
              return (
                <tr
                  key={o.name}
                  className={clickable ? "clickable" : ""}
                  onClick={() => clickable && router.push(`/organizations/${o.ein}`)}
                >
                  <td>
                    <div className="cell-name">{o.name}</div>
                    {o.irsName && o.irsName.toLowerCase() !== o.name.toLowerCase() && (
                      <div className="cell-sub">{o.irsName}</div>
                    )}
                  </td>
                  <td className="hide-sm">
                    {o.executive ? (
                      <span style={{ fontSize: 13.5 }}>{o.executive.name}</span>
                    ) : (
                      <span style={{ color: "var(--faint)" }}>—</span>
                    )}
                  </td>
                  <td><StatusBadge org={o} /></td>
                  <td className="num tnum">
                    {o.firstYear ? `${o.firstYear}–${o.lastYear}` : "—"}
                  </td>
                  <td className="num tnum">{o.yearsFiled || "—"}</td>
                  <td className="num">
                    <div className="cell-metric">
                      <TierBadge tier={incomeTier(o)} />
                      <span className="cell-sub tnum">{formatMoney(o.latestRevenue)}</span>
                    </div>
                  </td>
                  <td className="num">
                    <div className="cell-metric">
                      <TierBadge tier={sizeTier(o)} />
                      <span className="cell-sub tnum">{formatMoney(latestAssets(o))}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="empty">
            <b>No organizations match.</b>
            Try a different search or clear the filter.
          </div>
        )}
      </div>
    </div>
  );
}
