export function DownloadBar() {
  return (
    <div className="dl-bar">
      <div className="dl-text">
        <b>Download the full dataset</b>
        <span>
          Formatted spreadsheet with leadership, financials, signals, and news. Built from
          the same data as this site, so it never drifts.
        </span>
      </div>
      <a className="dl-btn" href="/corridor_dataset.xlsx" download>
        Spreadsheet (.xlsx)
      </a>
      <a className="dl-link" href="/data/roster.csv" download>roster.csv</a>
      <a className="dl-link" href="/data/leadership.csv" download>leadership.csv</a>
      <a className="dl-link" href="/data/financial_history.csv" download>financials.csv</a>
      <a className="dl-link" href="/data/news.csv" download>news.csv</a>
    </div>
  );
}
