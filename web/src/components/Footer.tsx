import { getDataset } from "@/lib/data";

export function Footer() {
  const { generatedAt } = getDataset();
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div style={{ maxWidth: "46ch" }}>
          <div style={{ fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>
            Corridor
          </div>
          A research dataset on leadership turnover in Philadelphia&apos;s community
          economic development organizations. Data snapshot {generatedAt}.
        </div>
        <div>
          <div style={{ fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>
            Sources
          </div>
          <div>
            <a href="https://projects.propublica.org/nonprofits/" target="_blank" rel="noreferrer">
              ProPublica Nonprofit Explorer
            </a>{" "}
            &middot;{" "}
            <a href="https://news.google.com/" target="_blank" rel="noreferrer">
              Google News
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
