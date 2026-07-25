export function DownloadBar() {
  return (
    <div className="dl-bar">
      <div className="dl-text">
        <b>Download the full dataset</b>
        <span>
          Ten-sheet spreadsheet: roster, Temple archives finds, an executive-director timeline
          sample, leadership, financials, tax credit, Form 990 links, news, and signals. Built
          from the same data as this site, so it never drifts.
        </span>
      </div>
      <a className="dl-btn" href="/corridor_dataset.xlsx" download>
        Spreadsheet (.xlsx)
      </a>
      <a className="dl-link" href="/data/roster.csv" download>roster.csv</a>
      <a className="dl-link" href="/data/leadership.csv" download>leadership.csv</a>
      <a className="dl-link" href="/data/leadership_history.csv" download>leadership_history.csv</a>
      <a className="dl-link" href="/data/taxcredit.csv" download>taxcredit.csv</a>
      <a className="dl-link" href="/data/filings.csv" download>990-links.csv</a>
      <a className="dl-link" href="/data/news.csv" download>news.csv</a>
      <a className="dl-link" href="/storyline.docx" download>storyline draft (.docx)</a>
    </div>
  );
}
