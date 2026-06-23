import type { Org } from "@/lib/data";
import { formatMoneyFull } from "@/lib/data";

const reportPdf = (year: number | string) => `/taxcredit/cdc-tax-credit-${year}.pdf`;

export function TaxCreditCard({ org }: { org: Org }) {
  const tc = org.taxCredit;
  if (!tc) return null;
  const latest = tc.reportYears[tc.reportYears.length - 1] ?? 2020;

  return (
    <div className="card card-pad" style={{ marginTop: 16 }}>
      <div className="card-head">
        <h3>CDC Tax Credit</h3>
        <span className="meta">City of Philadelphia program</span>
      </div>

      <div className="tc-banner">
        <div>
          <div className="eyebrow">Status</div>
          <div className="lead-name serif">
            {tc.active ? "Active participant" : "Former participant"}
          </div>
          <div className="lead-title">
            In the program since {tc.startYear ?? "—"}
          </div>
        </div>
        {tc.annualAmount ? (
          <div className="kv" style={{ textAlign: "right" }}>
            <div className="k">Annual contribution</div>
            <div className="v tnum">{formatMoneyFull(tc.annualAmount)}</div>
          </div>
        ) : null}
      </div>

      <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 14, marginBottom: 0 }}>
        A business sponsor contributes to this CDC for a tax credit against city business
        tax. Recorded in the{" "}
        {tc.reportYears.map((y, i) => (
          <span key={y}>
            <a href={reportPdf(y)} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
              {y}
            </a>
            {i < tc.reportYears.length - 1 ? ", " : ""}
          </span>
        ))}{" "}
        annual report{tc.reportYears.length > 1 ? "s" : ""}.{" "}
        <a href={reportPdf(latest)} target="_blank" rel="noreferrer" style={{ color: "var(--muted)" }}>
          Source PDF →
        </a>
      </p>
    </div>
  );
}
