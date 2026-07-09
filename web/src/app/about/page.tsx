import { getDataset } from "@/lib/data";

export const metadata = { title: "About · Corridor" };

export default function AboutPage() {
  const { summary, generatedAt } = getDataset();
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <div className="eyebrow">About this dataset</div>
        <h1 className="serif" style={{ fontSize: 40, marginTop: 10 }}>
          How it was built, and what it can and can&apos;t tell you
        </h1>

        <Prose>
          <p>
            Corridor is a research dataset on what drives executive-director turnover in
            Philadelphia&apos;s Community Development Corporations. It tracks {summary.total}
            {" "}CDCs from public records.
          </p>

          <h3>Where the data comes from</h3>
          <p>
            Each organization is matched to its IRS employer identification number, then
            enriched with every digitized Form 990 on file through the{" "}
            <a href="https://projects.propublica.org/nonprofits/" target="_blank" rel="noreferrer">ProPublica Nonprofit Explorer</a>,
            which also supplies the current officer and board roster from Part VII. Recent
            news, including a dedicated search of{" "}
            <a href="https://www.inquirer.com/" target="_blank" rel="noreferrer">The Philadelphia Inquirer</a>,{" "}
            comes from{" "}
            <a href="https://news.google.com/" target="_blank" rel="noreferrer">Google News</a>.
            Some organizations were also identified from finding aids at{" "}
            <a href="https://library.temple.edu/scrc" target="_blank" rel="noreferrer">Temple University&apos;s Special Collections Research Center</a>,
            which holds the records of several Philadelphia CDCs, including some long since
            dissolved. Every source is public and free.
          </p>

          <h3>What it does well</h3>
          <p>
            <b>Current leadership.</b> For {summary.withNamedExecutive} organizations the
            tracker names the executive director and lists the full officer and board roster
            from the latest Form 990 Part VII. Titles carrying a &ldquo;(To MM/YYYY)&rdquo;
            note are officers the filing recorded on their way out, a documented transition.
          </p>
          <p>
            <b>Tax credit participation.</b> {summary.everTaxCredit} CDCs are matched to the
            City of Philadelphia&apos;s{" "}
            <a href="https://www.phila.gov/services/payments-assistance-taxes/taxes/tax-credits/business-tax-credits/community-development-corporation-cdc-tax-credit/" target="_blank" rel="noreferrer">CDC Tax Credit program</a>,
            with the year each entered and its annual contribution, parsed from the City&apos;s
            annual reports (2015, 2019, 2020). This is a funding-and-activity record
            independent of the 990s, and it reaches organizations that do not file their own.
          </p>
          <p>
            <b>The actual Form 990 documents.</b> Every organization links to each year&apos;s
            original Form 990 PDF, {summary.form990Pdfs} in all, so the source is one click
            away rather than a citation.
          </p>
          <p>
            <b>Structural size and operational lifespan.</b> The Form 990 history reaches
            back roughly two decades for most organizations, with revenue, expenses,
            assets, and staff counts each year. When filings stop, that is a strong signal
            of dormancy or dissolution.
          </p>
          <p>
            <b>News and primary sources.</b> Each organization links to its own website, its
            ProPublica filings, and recent Google News coverage, with {summary.newsArticles}
            {" "}articles gathered across the roster. Reported executive changes usually show
            up here first.
          </p>
          <p>
            <b>Transition leads.</b> A year-over-year jump of 30 percent or more in total
            officer compensation often marks an executive-director change, since a new
            director usually arrives at a different salary. The tracker flags those years so
            the manual lookup starts where a transition most likely happened. It is a lead,
            not proof.
          </p>

          <h3>The honest limitation</h3>
          <p>
            Leadership names are <em>current</em>, not a full year-by-year history. Director
            names for each past year live in Part VII of that year&apos;s 990, and as of 2026
            there is no free, lightweight way to pull them at scale: the AWS 990 mirror was
            retired at the end of 2021, the IRS per-file XML URLs now 404, and ProPublica
            blocks scripted PDF downloads. So for historical changes the tracker pairs the
            current executive with the pay-shift years (when a change most likely happened)
            and the news links (where the named change is reported).
          </p>

          <h3>The spreadsheet</h3>
          <p>
            Everything here is also a formatted spreadsheet, downloadable from the home page,
            with sheets for the roster, leadership, financial history, news, and signals. It
            is built from the same data as this site in one step, so the two never drift.
          </p>

          <h3>The review pile</h3>
          <p>
            {summary.needsLookup} organizations could not be matched to an IRS record with
            confidence. Acronym-named groups and fiscally sponsored districts land here.
            They are left unmatched rather than tied to a wrong EIN, because a wrong match
            silently corrupts the data. They appear under the &ldquo;Needs lookup&rdquo;
            filter on the organizations page.
          </p>

          <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 32 }}>
            Data snapshot {generatedAt}. Re-running the scraper refreshes against the latest
            IRS filings.
          </p>
        </Prose>
      </div>
    </section>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ marginTop: 24, fontSize: 16, lineHeight: 1.65, color: "var(--ink-soft)" }}
      className="prose"
    >
      {children}
    </div>
  );
}
