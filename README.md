# Corridor

**Live site: https://corridor.adammirmina.com**

A scraper plus a web dashboard that build and present a research dataset on
leadership turnover in Philadelphia's community economic development
organizations, for a Drexel STAR Scholars study:

> **What factors determine leadership transitions in community economic
> development organizations in Philadelphia?**

Corridor builds a comprehensive roster and history for 103 of Philadelphia's
Community Development Corporations (CDCs) — some still active, some
rediscovered from university archives after decades of no public trace — from
public records, and flags exactly which organizations still need a human to
finish the job.

## What it produces

`output/corridor_dataset.xlsx`, ten sheets:

1. **Roster** — one row per organization: IRS EIN, registered name, address,
   first/last filing year, years filed (operational lifespan), filing gaps,
   officer-comp jump years (leadership-transition leads), latest revenue and
   employee count, and where the organization itself came from.
2. **Temple Archives** — the organizations identified from Temple University
   Special Collections Research Center finding aids, with which specific
   collection each came from and what could and couldn't be confirmed.
3. **ED Timeline (sample)** — a year-by-year executive-director grid for 20
   randomly sampled organizations (restricted to ones with reliable data),
   founding to present.
4. **Leadership** — the full current officer and board roster per
   organization, from IRS Form 990 Part VII.
5. **Financial History** — one row per organization-year: revenue, expenses,
   assets, employees, officer compensation.
6. **Tax Credit** — participation in the City of Philadelphia's CDC Tax
   Credit program by report year.
7. **990 PDFs** — a direct link to every Form 990 document on file.
8. **News & Sources** — recent articles per organization, including a
   dedicated Philadelphia Inquirer search.
9. **Signals** — organizations ranked by how much their record suggests
   leadership instability.
10. **About** — full data-source documentation.

The same data is also written as plain CSVs in `output/` for analysis in R,
Python, or anything else.

## Data sources (all free, no API key)

| Source | What it gives |
|---|---|
| [ProPublica Nonprofit Explorer](https://projects.propublica.org/nonprofits/) | EIN, every digitized Form 990 year (revenue, assets, employees, officer pay), and the current officer/board roster from Part VII |
| [Google News](https://news.google.com/) | Recent articles per organization, plus a dedicated [Philadelphia Inquirer](https://www.inquirer.com/) site-scoped search |
| [City of Philadelphia CDC Tax Credit program](https://www.phila.gov/services/payments-assistance-taxes/taxes/tax-credits/business-tax-credits/community-development-corporation-cdc-tax-credit/) | Annual reports, parsed from the source PDFs |
| [Temple University Special Collections Research Center](https://library.temple.edu/scrc) | Finding aids for CDC and CDC-adjacent organizational records, some of them long dissolved |
| [PACDC](https://pacdc.org/) | The Philadelphia Association of Community Development Corporations' own current member list |
| [The Regional Foundation](https://www.regionalfoundation.org/) | Partner organization list, cross-referenced for CDCs not yet tracked |

The CDC roster (`data/cdc_roster.csv`) is the researchers' own authoritative
list, cross-referenced against every source above. Scope is CDCs only;
`data/bid_roster.csv` is retained for reference but not loaded.

## What it does well, and what it doesn't

**Strong, automated, reliable:**

- **Current leadership.** The executive director and the full officer/board
  roster for each organization, parsed from the latest Form 990 Part VII. Titles
  carrying a "(To MM/YYYY)" note flag a recorded departure.
- **News and primary sources.** Per-org website, ProPublica filings, and recent
  Google News and Philadelphia Inquirer coverage, where reported executive
  changes usually surface first.
- **Structural size and operational lifespan.** The Form 990 financial history
  goes back ~20 years for most organizations. When filings stop, that is a
  strong signal of dormancy or dissolution.
- **Turnover leads.** A year-over-year jump of 30%+ in total officer
  compensation is often the fingerprint of an executive-director change. The
  tool flags those years. It is a lead, not a conclusion.

**The known gap — a full year-by-year name history.** Leadership names from
ProPublica are *current*, not per historical year. Director names for each past
year live in Part VII of that year's 990, and as of 2026 there is no free,
lightweight way to pull them at scale (the AWS 990 mirror was decommissioned at
the end of 2021, the IRS per-file XML URLs now 404, and ProPublica blocks
scripted PDF downloads). Where a fuller year-by-year history exists, it's from
direct research, captured in `output/leadership_history.csv` and the ED
Timeline sheet — not an automated source.

**The review pile.** Organizations the tool could not confidently match to an
EIN (acronym-named orgs, fiscally sponsored districts, and several of the
older archive finds) are left with a blank EIN rather than a wrong one. A
wrong EIN silently poisons the dataset; a blank one is an honest "look this up
by hand."

## Run it

```
pip install -r requirements.txt
python corridor.py                      # EIN matching + Form 990 financial history
python tools/enrich.py                  # current leadership + news (incl. Inquirer) per org
python tools/gather_inquirer_sample.py  # deeper Inquirer search for the ED timeline sample only
python tools/fetch_filings.py           # direct links to every Form 990 PDF on file
python tools/parse_taxcredit.py         # City CDC Tax Credit reports (taxcredit/*.pdf)
python tools/build_outputs.py           # -> dataset.json + corridor_dataset.xlsx (9 sheets) + web/public downloads
python tools/build_ed_timeline.py       # appends the 10th sheet, ED Timeline (sample)
```

`build_outputs.py` and `build_ed_timeline.py` together are the single source
that produce both the web app's data and the spreadsheet, so the two never
drift. The full run takes a few minutes (rate-limited to be polite to the
free APIs it depends on). Re-run any time to refresh against the latest data.

## The web dashboard (`web/`)

A Next.js site that presents the dataset: an overview with headline numbers
and the most volatile organizations, a searchable and sortable roster
(including a filter for the Temple-archive finds), an interactive map of
every organization's location color-coded active vs. closed, a per-org detail
page with revenue/expenses and officer-compensation charts and an
operational-lifespan timeline, and a signals view ranking organizations by
how much their record suggests leadership instability. Plain hand-written
CSS, SVG charts, no chart library or map tile service. It is fully static
(every org page is prerendered).

```
cd web
npm install
npm run dev        # local at http://localhost:3000
npm run build      # production build
```

Deployed to Cloudflare Workers. **There is no CI auto-deploy** — pushing to
GitHub does not update the live site by itself. Deploy manually:

```
cd web && npm run deploy
```

## Roster maintenance

The roster is bundled as a CSV in `data/` so the run is reproducible:

- `data/cdc_roster.csv` — the researchers' authoritative CDC list (the scope),
  with each row's source and any research notes
- `data/bid_roster.csv` — the Philadelphia BID list, retained for reference
  but no longer loaded (scope is CDCs only)
- `data/ed_timeline_sample.txt` — the frozen random sample used for the ED
  Timeline sheet

To add or correct an organization, edit `cdc_roster.csv` and re-run the
pipeline above.

## Next stage (not built yet)

- Auto-fill director names from the IRS bulk 990 XML (Part VII), matched by EIN.
- Pull archived staff pages from the Wayback Machine CDX API to reconstruct
  leadership timelines for organizations with thin 990 data.
- Cross-reference the PA Department of State business registry for incorporation
  and dissolution dates, to firm up the operational-lifespan endpoints and
  resolve the organizations still missing a confirmed address or EIN.
