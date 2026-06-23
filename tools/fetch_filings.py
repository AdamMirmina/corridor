"""
Pull the actual Form 990 PDF links for each matched org from the ProPublica
Nonprofit Explorer API, so the dataset and the app can link straight to the
source documents. Covers both digitized filings and older image-only filings.

Out: output/filings.csv  (org_name, ein, year, pdf_url)
"""

import csv
import os
import time
import urllib.request

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(HERE, "output")
API = "https://projects.propublica.org/nonprofits/api/v2/organizations"
UA = {"User-Agent": "corridor research (github.com/AdamMirmina/corridor)"}


def fetch(ein):
    req = urllib.request.Request(f"{API}/{ein}.json", headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        import json
        return json.load(r)


def main():
    with open(os.path.join(OUT, "roster.csv"), newline="", encoding="utf-8") as f:
        roster = [r for r in csv.DictReader(f) if r.get("ein")]
    print(f"Fetching 990 PDF links for {len(roster)} orgs")

    out_rows = []
    for i, r in enumerate(roster, 1):
        name, ein = r["org_name"], r["ein"]
        try:
            d = fetch(ein)
        except Exception as e:
            print(f"[{i:>2}] {name[:40]:40} ERROR {str(e)[:40]}")
            continue
        seen = {}
        for f in d.get("filings_with_data", []) + d.get("filings_without_data", []):
            yr = f.get("tax_prd_yr")
            pdf = f.get("pdf_url")
            if yr and pdf and yr not in seen:
                seen[yr] = pdf
        for yr in sorted(seen, reverse=True):
            out_rows.append({"org_name": name, "ein": ein, "year": yr, "pdf_url": seen[yr]})
        print(f"[{i:>2}] {name[:40]:40} {len(seen)} PDFs")
        time.sleep(0.25)

    with open(os.path.join(OUT, "filings.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["org_name", "ein", "year", "pdf_url"])
        w.writeheader()
        w.writerows(out_rows)
    print(f"Wrote output/filings.csv ({len(out_rows)} PDF links)")


if __name__ == "__main__":
    main()
