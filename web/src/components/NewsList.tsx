import type { NewsItem, Org } from "@/lib/data";

function fmtDate(d: string): string {
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m) return "";
  const mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1];
  return `${mon} ${day || ""}, ${y}`.replace(" ,", ",");
}

export function NewsList({ org }: { org: Org }) {
  const items: NewsItem[] = org.news ?? [];
  const newsSearch = `https://news.google.com/search?q=${encodeURIComponent(
    `"${org.name}" Philadelphia`
  )}`;

  if (!items.length) {
    return (
      <div className="card card-pad" style={{ marginTop: 16 }}>
        <div className="card-head">
          <h3>In the news</h3>
          <a className="meta" style={{ color: "var(--accent)" }} href={newsSearch} target="_blank" rel="noreferrer">
            Search Google News →
          </a>
        </div>
        <p style={{ fontSize: 13.5, color: "var(--muted)", margin: 0 }}>
          No recent coverage surfaced for this organization.
        </p>
      </div>
    );
  }

  return (
    <div className="card card-pad" style={{ marginTop: 16 }}>
      <div className="card-head">
        <h3>In the news</h3>
        <a className="meta" style={{ color: "var(--accent)" }} href={newsSearch} target="_blank" rel="noreferrer">
          More on Google News →
        </a>
      </div>
      <div className="news-list">
        {items.map((n, i) => (
          <a key={i} className="news-item" href={n.url} target="_blank" rel="noreferrer">
            <div className="news-meta">
              {[fmtDate(n.date), n.source].filter(Boolean).join("  ·  ")}
            </div>
            <div className="news-title">{n.title}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
