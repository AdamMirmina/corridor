# philly-cdc-tracker

**Live dashboard: https://philly-cdc-tracker.vercel.app**

A scraper plus a web dashboard that build and present the foundational dataset
for a STAR Scholars research project at Drexel:

> **What factors determine leadership transitions in community economic
> development organizations in Philadelphia?**
> Benjamin Elliott, Political Science, mentored by Dr. Richardson Dilworth.

The Week 1–2 deliverable for that project is "a comprehensive roster and initial
history spreadsheet" for the ~65 Community Development Corporations (CDCs) and
Business Improvement Districts (BIDs) in Philadelphia. This tool produces that
spreadsheet automatically from public records, and flags exactly which
organizations need a human to finish the job.

## What it produces

`output/philly_cdc_dataset.xlsx` with four sheets:

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
| [ProPublica Nonprofit Explorer API](https://projects.propublica.org/nonprofits/api/) | EIN, every digitized Form 990 year, revenue, assets, employees, officer compensation |
| [PACDC member list](https://pacdc.org/members/member-list/) | The CDC roster |
| [OpenDataPhilly Business Improvement Districts](https://opendataphilly.org/datasets/business-improvement-districts/) | The BID roster, plus website and a contact email per BID |

## What it does well, and what it doesn't

**Strong, automated, reliable:**

- **Structural size and operational lifespan.** The Form 990 financial history
  goes back ~20 years for most organizations. When filings stop, that is a
  strong signal of dormancy or dissolution.
- **Turnover leads.** A year-over-year jump of 30%+ in total officer
  compensation is often the fingerprint of an executive-director change. The
  tool flags those years so the manual lookup starts where transitions most
  likely happened. It is a lead, not a conclusion.

**The known gap — executive-director names per year.** Director names live in
Part VII of each annual 990. As of 2026 there is no free, lightweight way to
pull them at scale: the AWS 990 data mirror was decommissioned at the end of
2021, the IRS per-file XML URLs now redirect to a 404, and ProPublica blocks
scripted PDF downloads. The only remaining free route is the IRS bulk XML ZIP
archive, which is a heavier second stage (multi-GB yearly downloads). So this
v1 does **not** auto-fill names. Instead it builds the Leadership sheet as a
targeted fill-in template, keyed to the comp-jump years, so the manual work is
fast. Fill names from each org's website, its archived staff pages on
[web.archive.org](https://web.archive.org), and the 990 PDFs on ProPublica.

**The review pile.** Organizations the tool could not confidently match to an
EIN (acronym-named orgs like SEAMAAC and HACE, fiscally sponsored districts, and
a few others) are left with a blank EIN rather than a wrong one. A wrong EIN
silently poisons the dataset; a blank one is an honest "look this up by hand."
These show up in the run summary and as unshaded blank rows.

## Run it

```
pip install -r requirements.txt
python philly_cdc_tracker.py        # scrape -> output/*.csv + xlsx
python tools/export_web_data.py     # -> web/src/data/dataset.json
```

Takes a couple of minutes (it rate-limits itself to be polite to ProPublica).
Re-run any time to refresh against the latest IRS data.

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

Deployed to Vercel (project `philly-cdc-tracker`, scope adammirminas-projects).
To refresh the live site after re-running the scraper: re-run the exporter, then
`cd web && vercel --prod` (the CLI deploy; the data JSON is bundled at build
time). The data snapshot date shown in the footer comes from the export run.

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
