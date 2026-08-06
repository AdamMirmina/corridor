import { getOrgs, getDataset } from "@/lib/data";
import { buildMap } from "@/lib/map";
import { CdcMap } from "@/components/CdcMap";

export const metadata = { title: "Map · Corridor" };

export default function MapPage() {
  const orgs = getOrgs();
  const { summary } = getDataset();
  const map = buildMap(orgs);
  const active = map.pins.filter((p) => p.active).length;
  const inactive = map.pins.length - active;
  const unmapped = summary.total - map.pins.length;

  return (
    <section className="section">
      <div className="container">
        <div className="eyebrow">Where the CDCs are</div>
        <h1 className="serif" style={{ fontSize: 38, marginTop: 10 }}>
          {map.pins.length} organizations mapped
        </h1>
        <p className="lede" style={{ marginTop: 12, fontSize: 15.5, maxWidth: 640 }}>
          Every CDC with a confirmed street address, plotted where it is (or was)
          headquartered. Green means a matched IRS record with no closure signal; rust
          means it&apos;s flagged as likely closed, or has no confirmed current IRS activity
          at all.
        </p>

        <div className="map-stat-row">
          <div className="map-stat active"><b>{active}</b><span>active</span></div>
          <div className="map-stat inactive"><b>{inactive}</b><span>inactive / unconfirmed</span></div>
          <div className="map-stat"><b>{unmapped}</b><span>no confirmed address</span></div>
        </div>

        <CdcMap map={map} />

        <p className="footnote">
          Addresses come from direct research and independent verification (see the{" "}
          <a href="/about">About page</a> and the spreadsheet&apos;s About sheet for full
          sourcing), geocoded via OpenStreetMap Nominatim. Historical or dissolved
          organizations are placed at the best-confirmed address found for them, which is
          sometimes a successor organization&apos;s current location rather than the exact
          original site.
        </p>
      </div>
    </section>
  );
}
