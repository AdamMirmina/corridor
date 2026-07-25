"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectedMap, MapPin } from "@/lib/map";

export function CdcMap({ map }: { map: ProjectedMap }) {
  const router = useRouter();
  const boardRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<MapPin | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent) => {
    const r = boardRef.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top - 10 });
  };

  return (
    <div className="board" ref={boardRef} onMouseMove={onMove}>
      <svg viewBox={map.viewBox} className="cdc-map-svg" xmlns="http://www.w3.org/2000/svg">
        <path d={map.boundaryPath} className="cdc-map-boundary" />
        {map.pins.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hover === p ? 8 : 5.5}
            className={`cdc-map-pin ${p.active ? "active" : "inactive"}`}
            onMouseEnter={() => setHover(p)}
            onMouseLeave={() => setHover((h) => (h === p ? null : h))}
            onClick={() => p.ein && router.push(`/organizations/${p.ein}`)}
          />
        ))}
      </svg>
      {hover && (
        <div className="cdc-map-tooltip" style={{ left: pos.x, top: pos.y }}>
          <b>{hover.name}</b>
          {hover.address}
          <span className={`status ${hover.active ? "active" : "inactive"}`}>
            {hover.active ? "Active" : "Closed / unconfirmed"}
          </span>
        </div>
      )}
      <div className="cdc-map-legend">
        <div className="legend-item"><span className="dot active" />Active</div>
        <div className="legend-item"><span className="dot inactive" />Closed / unconfirmed</div>
        <div className="legend-item hint">Hover a pin for details · click to open its record</div>
      </div>
    </div>
  );
}
