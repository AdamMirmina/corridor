"""
Parse the City of Philadelphia CDC Tax Credit annual reports (PDFs in
taxcredit/) into a participation table. Each report's final page lists every
organization receiving the credit that year, with the year it entered the
program and its annual contribution amount.

Out: output/taxcredit.csv  (report_year, org_name, start_year, amount)
"""

import csv
import os
import re

import pdfplumber

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDFS = os.path.join(HERE, "taxcredit")
OUT = os.path.join(HERE, "output")
DATA = os.path.join(HERE, "data")
# Scanned (image-only) report years that have no text layer; their tables were
# transcribed into data/taxcredit_scanned.csv.
SCANNED = os.path.join(DATA, "taxcredit_scanned.csv")

ROW_RE = re.compile(r"(.+?)\s+(20\d\d|19\d\d)\*{0,2}\s+\$\s*([\d,]+)")
SKIP_RE = re.compile(r"total|calendar year|tax year 2002|annual report", re.IGNORECASE)


def parse_report(path):
    rows = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            lines = {}
            for w in page.extract_words():
                lines.setdefault(round(w["top"] / 3), []).append(w)
            for key in sorted(lines):
                ws = sorted(lines[key], key=lambda w: w["x0"])
                text = " ".join(w["text"] for w in ws)
                m = ROW_RE.search(text)
                if not m or SKIP_RE.search(text):
                    continue
                name = re.sub(r"^\d+\.\s*", "", m.group(1)).strip()
                amt = int(m.group(3).replace(",", ""))
                if len(name) > 5 and 1990 <= int(m.group(2)) <= 2025:
                    rows.append({"org_name": name, "start_year": m.group(2), "amount": amt})
    # de-dupe within a report (occasional header bleed)
    seen, out = set(), []
    for r in rows:
        k = r["org_name"].lower()
        if k in seen:
            continue
        seen.add(k)
        out.append(r)
    return out


def main():
    all_rows = []
    for fn in sorted(os.listdir(PDFS)):
        if not fn.endswith(".pdf"):
            continue
        year = re.search(r"(20\d\d)", fn)
        if not year:
            continue
        year = year.group(1)
        rows = parse_report(os.path.join(PDFS, fn))
        print(f"{fn}: {len(rows)} participants")
        for r in rows:
            all_rows.append({"report_year": year, **r})

    # Merge the transcribed scanned-year reports.
    if os.path.exists(SCANNED):
        with open(SCANNED, newline="", encoding="utf-8") as f:
            scanned = list(csv.DictReader(f))
        for r in scanned:
            all_rows.append({"report_year": r["report_year"], "org_name": r["org_name"],
                             "start_year": r["start_year"], "amount": int(r["amount"])})
        years = sorted(set(r["report_year"] for r in scanned))
        print(f"taxcredit_scanned.csv: {len(scanned)} rows ({', '.join(years)})")

    all_rows.sort(key=lambda r: (r["report_year"], r["org_name"].lower()))
    with open(os.path.join(OUT, "taxcredit.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["report_year", "org_name", "start_year", "amount"])
        w.writeheader()
        w.writerows(all_rows)
    print(f"Wrote output/taxcredit.csv ({len(all_rows)} rows across "
          f"{len(set(r['report_year'] for r in all_rows))} report years)")


if __name__ == "__main__":
    main()
