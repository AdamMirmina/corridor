# Corridor

**Live dashboard: https://corridor-phl.vercel.app**

A scraper plus a web dashboard that build and present a research dataset on
leadership turnover in Philadelphia's community economic development
organizations:

> **What factors determine leadership transitions in community economic
> development organizations in Philadelphia?**

Corridor builds a comprehensive roster and history for the ~65 Community
Development Corporations (CDCs) and Business Improvement Districts (BIDs) in
Philadelphia automatically from public records, and flags exactly which
organizations need a human to finish the job.

## What it produces

`output/corridor_dataset.xlsx` with four sheets:

1. **Roster** — one row per organization: IRS EIN, registered name, first/last
   filing year, years filed (operational lifespan), filing gaps, officer-comp
   jump years (leadership-transition leads), latest revenue and employee count.
2. **Financial History** — one row per organization-year: revenue, expenses,
   assets, employees, officer compensation. The structural-size series.
3. **Leadership (fill-in)** — a pre-built grid of every organization-year with a
   blank Executive Director column, ready for manual entry.
4. **How to read this** — notes on the shaded cells and the caveats below.

The same data is also written as plain CSVs in `output/` for analysis in R,
Python, or anything else.

## Data sources (all free, no API key)

| Source | What it gives |
|---|---|
| [ProPublica Nonprofit Explorer](https://projects.propublica.org/nonprofits/) | EIN, every digitized Form 990 year (revenue, assets, employees, officer pay), and the current officer/board roster from Part VII |
| [PACDC member list](https://pacdc.org/members/member-list/) | The CDC roster |
| [OpenDataPhilly Business Improvement Districts](https://opendataphilly.org/datasets/business-improvement-districts/) | The BID roster, plus website and a contact email per BID |
| [Google News](https://news.google.com/) | Recent articles per organization, including leadership coverage |

## What it does well, and what it doesn't

**Strong, automated, reliable:**

- **Current leadership.** The executive director and the full officer/board
  roster for each organization, parsed from the latest Form 990 Part VII. Titles
  carrying a "(To MM/YYYY)" note flag a recorded departure.
- **News and primary sources.** Per-org website, ProPublica filings, and recent
  Google News coverage, where reported executive changes usually surface first.
- **Structural size and operational lifespan.** The Form 990 financial history
  goes back ~20 years for most organizations. When filings stop, that is a
  strong signal of dormancy or dissolution.
- **Turnover leads.** A year-over-year jump of 30%+ in total officer
  compensation is often the fingerprint of an executive-director change. The
  tool flags those years. It is a lead, not a conclusion.

**The known gap — a full year-by-year name history.** Leadership names are
*current*, not per historical year. Director names for each past year live in
Part VII of that year's 990, and as of 2026 there is no free, lightweight way to
pull them at scale (the AWS 990 mirror was decommissioned at the end of 2021,
the IRS per-file XML URLs now 404, and ProPublica blocks scripted PDF downloads).
So for historical changes the tool pairs the current executive with the pay-shift
years and the news links.

**The review pile.** Organizations the tool could not confidently match to an
EIN (acronym-named orgs like SEAMAAC and HACE, fiscally sponsored districts, and
a few others) are left with a blank EIN rather than a wrong one. A wrong EIN
silently poisons the dataset; a blank one is an honest "look this up by hand."

## Run it

```
pip install -r requirements.txt
python corridor.py                  # base scrape -> output/roster.csv, financial_history.csv
python tools/enrich.py              # leadership + news -> output/leadership.csv, news.csv
python tools/build_outputs.py       # -> dataset.json + corridor_dataset.xlsx + web/public downloads
```

`build_outputs.py` is the single source that produces both the web app's data
and the spreadsheet, so the two never drift. Takes a few minutes (rate-limited
to be polite). Re-run any time to refresh against the latest data.

## The web dashboard (`web/`)

A Next.js site that presents the dataset: an overview with headline numbers and
the most volatile organizations, a searchable and sortable roster, a per-org
detail page with revenue/expenses and officer-compensation charts and an
operational-lifespan timeline, and a signals view ranking organizations by how
much their record suggests leadership instability. Plain hand-written CSS, SVG
charts, no chart library. It is fully static (every org page is prerendered).

```
cd web
npm install
npm run dev        # local at http://localhost:3000
npm run build      # production build
```

Deployed to Vercel (project `corridor`). The GitHub repo is connected, so every
push to `main` auto-deploys to production (root directory `web`). To refresh the
live data: re-run `corridor.py` and `tools/export_web_data.py`, commit the
updated `web/src/data/dataset.json`, and push. The snapshot date in the footer
comes from the export run.

## Roster maintenance

The rosters are bundled as CSVs in `data/` so the run is reproducible:

- `data/cdc_roster.csv` — 58 CDCs from the PACDC member list
- `data/bid_roster.csv` — 17 BIDs from OpenDataPhilly, with website + contact

To add or correct an organization, edit those files and re-run. To refresh the
BID list from the city's live open-data feed, the source query is documented in
the commit history.

## Next stage (not built yet)

- Auto-fill director names from the IRS bulk 990 XML (Part VII), matched by EIN.
- Pull archived staff pages from the Wayback Machine CDX API to reconstruct
  leadership timelines for organizations with thin 990 data.
- Cross-reference the PA Department of State business registry for incorporation
  and dissolution dates, to firm up the operational-lifespan endpoints.
