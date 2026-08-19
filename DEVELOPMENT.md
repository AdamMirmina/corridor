# Corridor development notes

Project-specific notes for working on Corridor. See `README.md` for what this
project is and does.

## Pipeline

Run in this order after editing `data/cdc_roster.csv` or any `tools/*.py`:

```
py corridor.py                      # EIN matching + Form 990 financial history
py tools/enrich.py                  # current leadership + news (incl. Inquirer) per org
py tools/gather_inquirer_sample.py  # deeper Inquirer search for the ED timeline sample only
py tools/fetch_filings.py           # direct links to every Form 990 PDF on file
py tools/parse_taxcredit.py         # parses taxcredit/*.pdf (only needed if those change)
py tools/build_outputs.py           # writes dataset.json + corridor_dataset.xlsx (9 sheets)
py tools/build_ed_timeline.py       # appends the 10th sheet, ED Timeline (sample)
```

`build_outputs.py` always rebuilds the workbook from scratch, so
`build_ed_timeline.py` must run after it every time, and its output must be
copied to `web/public/corridor_dataset.xlsx` again afterward.

## Deploy

The web app (`web/`) is a Next.js static export served by Cloudflare Workers.
**There is no CI auto-deploy** — pushing to GitHub does not update the live
site. Deploy manually:

```
cd web && npm run deploy
```

Live at corridor.adammirmina.com.

## Data provenance

`data/cdc_roster.csv`'s `source` column tags where each organization came
from (original roster, City CDC program list, Temple University archives,
PACDC's member list, etc.) — see the "About" sheet in the spreadsheet, and
the About page on the site, for the full sourcing writeup.
