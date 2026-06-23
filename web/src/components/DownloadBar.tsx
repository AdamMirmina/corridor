export function DownloadBar() {
  return (
    <div className="dl-bar">
      <div className="dl-text">
        <b>Download the full dataset</b>
        <span>
          Eight-sheet spreadsheet: roster, leadership, financials, tax credit, Form 990
          links, news, and signals. Built from the same data as this site, so it never drifts.
        </span>
      </div>
      <a className="dl-btn" href="/corridor_dataset.xlsx" download>
        Spreadsheet (.xlsx)
      </a>
      <a className="dl-link" href="/data/roster.csv" download>roster.csv</a>
      <a className="dl-link" href="/data/leadership.csv" download>leadership.csv</a>
      <a className="dl-link" href="/data/taxcredit.csv" download>taxcredit.csv</a>
      <a className="dl-link" href="/data/filings.csv" download>990-links.csv</a>
      <a className="dl-link" href="/data/news.csv" download>news.csv</a>
    </div>
  );
}
