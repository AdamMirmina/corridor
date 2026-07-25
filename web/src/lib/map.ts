import boundaryRaw from "@/data/phl-boundary.json";
import type { Org } from "@/lib/data";

export type MapPin = {
  x: number;
  y: number;
  name: string;
  ein: string;
  address: string;
  active: boolean;
};

export type ProjectedMap = {
  viewBox: string;
  boundaryPath: string;
  pins: MapPin[];
};

const VIEW = 1000;
const PAD = 40;

/** Equirectangular projection with a cos(lat) correction, fit to the
 *  boundary's own bounding box so the shape reads correctly at this
 *  latitude instead of stretching east-west. */
export function buildMap(orgs: Org[]): ProjectedMap {
  const boundary = boundaryRaw as [number, number][]; // [lon, lat]
  const lons = boundary.map((p) => p[0]);
  const lats = boundary.map((p) => p[1]);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const cosLat = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));

  const wDeg = (maxLon - minLon) * cosLat;
  const hDeg = maxLat - minLat;
  const scale = Math.min((VIEW - 2 * PAD) / wDeg, (VIEW - 2 * PAD) / hDeg);
  const drawW = wDeg * scale;
  const drawH = hDeg * scale;
  const offX = (VIEW - drawW) / 2;
  const offY = (VIEW - drawH) / 2;

  const project = (lon: number, lat: number) => {
    const x = offX + (lon - minLon) * cosLat * scale;
    const y = offY + (maxLat - lat) * scale;
    return [Math.round(x * 100) / 100, Math.round(y * 100) / 100] as const;
  };

  const boundaryPath =
    "M " + boundary.map(([lon, lat]) => project(lon, lat).join(",")).join(" L ") + " Z";

  const pins: MapPin[] = [];
  for (const o of orgs) {
    if (o.lat == null || o.lon == null) continue;
    const [x, y] = project(o.lon, o.lat);
    pins.push({
      x, y, name: o.name, ein: o.ein, address: o.address,
      active: !!o.ein && !o.closedCandidate,
    });
  }

  return { viewBox: `0 0 ${VIEW} ${VIEW}`, boundaryPath, pins };
}
