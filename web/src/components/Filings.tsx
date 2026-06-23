import type { Org } from "@/lib/data";

export function Filings({ org }: { org: Org }) {
  if (!org.filings.length) return null;
  return (
    <div className="card card-pad" style={{ marginTop: 16 }}>
      <div className="card-head">
        <h3>Form 990 documents</h3>
        <span className="meta">{org.filings.length} filings on record</span>
      </div>
      <div className="filing-grid">
        {org.filings.map((f) => (
          <a key={`${f.year}-${f.pdfUrl}`} className="filing-chip" href={f.pdfUrl} target="_blank" rel="noreferrer">
            <span className="tnum">{f.year}</span>
            <span className="filing-ext">PDF</span>
          </a>
        ))}
      </div>
      <p style={{ fontSize: 12.5, color: "var(--faint)", marginTop: 12, marginBottom: 0 }}>
        Each opens the original Form 990 document on ProPublica.
      </p>
    </div>
  );
}
