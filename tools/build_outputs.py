"""
Single source of truth for both deliverables. Reads every CSV the scraper and
enricher produce and writes, from the same data:

  - web/src/data/dataset.json   the web app's data
  - output/corridor_dataset.xlsx  the formatted research spreadsheet
  - web/public/corridor_dataset.xlsx  + web/public/data/*.csv  download copies

Because the app and the spreadsheet are built here together, they never drift.

Run order:  corridor.py  ->  tools/enrich.py  ->  tools/build_outputs.py
"""

import csv
import json
import os
import shutil
from datetime import datetime, timezone

from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill
from openpyxl.utils import get_column_letter

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(HERE, "output")
WEB_DATA = os.path.join(HERE, "web", "src", "data")
WEB_PUBLIC = os.path.join(HERE, "web", "public")

COMP_RE = __import__("re").compile(r"[^0-9]")


def num(v):
    if v in (None, "", "None"):
        return None
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return None


def money_int(s):
    if not s:
        return None
    d = COMP_RE.sub("", s)
    return int(d) if d else None


def load_csv(name):
    path = os.path.join(OUT, name)
    if not os.path.exists(path):
        return []
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def build():
    roster = load_csv("roster.csv")
    history = load_csv("financial_history.csv")
    leadership = load_csv("leadership.csv")
    news = load_csv("news.csv")

    by_ein_hist, by_ein_lead, by_ein_news = {}, {}, {}
    for h in history:
        by_ein_hist.setdefault(h["ein"], []).append(h)
    for l in leadership:
        by_ein_lead.setdefault(l["ein"], []).append(l)
    for n in news:
        by_ein_news.setdefault(n["ein"], []).append(n)

    orgs = []
    for r in roster:
        ein = r.get("ein", "")
        gaps = []
        for g in (r.get("filing_gaps") or "").split(";"):
            g = g.strip()
            if "->" in g:
                a, b = g.split("->")
                gaps.append({"from": int(a), "to": int(b)})
        comp_jumps = [int(x.strip()) for x in (r.get("comp_jump_years") or "").split(";") if x.strip().isdigit()]

        hist = []
        for h in sorted(by_ein_hist.get(ein, []), key=lambda x: num(x["year"]) or 0):
            hist.append({"year": num(h["year"]), "revenue": num(h["revenue"]),
                         "expenses": num(h["expenses"]), "assets": num(h["assets_eoy"]),
                         "employees": num(h["employees"]), "officerComp": num(h["officer_comp"])})

        officers = [{"name": o["name"], "title": o["title"], "comp": money_int(o["comp"]),
                     "isExecutive": o.get("is_executive") == "yes"}
                    for o in by_ein_lead.get(ein, [])]
        executive = next((o for o in officers if o["isExecutive"]), None)

        arts = sorted(by_ein_news.get(ein, []), key=lambda a: a.get("date", ""), reverse=True)
        articles = [{"title": a["title"], "source": a["source"], "url": a["url"], "date": a["date"]}
                    for a in arts]

        last_year = num(r.get("last_year"))
        closed = bool(last_year and last_year <= 2021 and ein)
        instability = len(gaps) * 2 + len(comp_jumps) + (3 if closed else 0)

        orgs.append({
            "name": r.get("org_name", ""), "type": r.get("type", ""), "ein": ein,
            "irsName": r.get("irs_name", ""), "irsCity": r.get("irs_city", ""),
            "confidence": r.get("match_confidence", ""),
            "firstYear": num(r.get("first_year")), "lastYear": last_year,
            "yearsFiled": num(r.get("years_filed")) or 0,
            "filingGaps": gaps, "compJumpYears": comp_jumps,
            "latestRevenue": num(r.get("latest_revenue")), "latestEmployees": num(r.get("latest_employees")),
            "website": r.get("website", ""), "contactEmail": r.get("contact_email", ""),
            "source": r.get("source", ""), "closedCandidate": closed, "instability": instability,
            "executive": executive, "officers": officers, "leadershipAsOf": last_year,
            "news": articles, "history": hist,
        })

    orgs.sort(key=lambda o: o["name"].lower())
    matched = [o for o in orgs if o["ein"]]
    summary = {
        "total": len(orgs), "matched": len(matched),
        "withFinancialData": len([o for o in matched if o["history"]]),
        "highConfidence": len([o for o in matched if o["confidence"] == "high"]),
        "needsLookup": len([o for o in orgs if not o["ein"]]),
        "withSignal": len([o for o in orgs if o["filingGaps"] or o["compJumpYears"]]),
        "withNamedExecutive": len([o for o in orgs if o["executive"]]),
        "newsArticles": sum(len(o["news"]) for o in orgs),
        "cdcs": len([o for o in orgs if o["type"] == "CDC"]),
        "bids": len([o for o in orgs if o["type"] == "BID"]),
        "closureCandidates": len([o for o in orgs if o["closedCandidate"]]),
        "earliestYear": min((o["firstYear"] for o in matched if o["firstYear"]), default=None),
        "latestYear": max((o["lastYear"] for o in matched if o["lastYear"]), default=None),
    }
    payload = {"generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
               "summary": summary, "orgs": orgs}

    os.makedirs(WEB_DATA, exist_ok=True)
    with open(os.path.join(WEB_DATA, "dataset.json"), "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    print(f"dataset.json: {summary['total']} orgs, {summary['withNamedExecutive']} with named exec, "
          f"{summary['newsArticles']} news articles")

    write_xlsx(orgs, leadership, history, news)
    copy_downloads()


def write_xlsx(orgs, leadership, history, news):
    wb = Workbook()
    navy = PatternFill("solid", fgColor="15294B")
    white = Font(color="FFFFFF", bold=True)
    sig = PatternFill("solid", fgColor="FCEFC7")
    exec_fill = PatternFill("solid", fgColor="EAF1FE")

    def sheet(ws, headers, rows, shade=None):
        ws.append(headers)
        for c in range(1, len(headers) + 1):
            cell = ws.cell(row=1, column=c)
            cell.fill = navy; cell.font = white
            cell.alignment = Alignment(vertical="center")
        for row in rows:
            ws.append(row)
            if shade:
                shade(ws, ws.max_row, row)
        ws.freeze_panes = "A2"
        for col in ws.columns:
            ln = max((len(str(c.value)) for c in col if c.value is not None), default=10)
            ws.column_dimensions[get_column_letter(col[0].column)].width = min(ln + 2, 52)

    # Roster (with executive director)
    ws = wb.active; ws.title = "Roster"
    rrows = []
    for o in orgs:
        ex = o["executive"]
        rrows.append([o["name"], o["type"], o["ein"],
                      ex["name"] if ex else "", ex["title"] if ex else "",
                      o["firstYear"], o["lastYear"], o["yearsFiled"],
                      o["latestRevenue"], o["latestEmployees"],
                      "; ".join(f'{g["from"]}-{g["to"]}' for g in o["filingGaps"]),
                      "; ".join(str(y) for y in o["compJumpYears"]),
                      o["website"], o["contactEmail"]])
    def shade_roster(ws, r, row):
        if row[10] or row[11]:
            for c in (11, 12):
                ws.cell(row=r, column=c).fill = sig
    sheet(ws, ["Organization", "Type", "EIN", "Executive director", "Exec title",
               "First year", "Last year", "Years filed", "Latest revenue", "Latest staff",
               "Filing gaps", "Pay-shift years", "Website", "Contact"], rrows, shade_roster)

    # Leadership (full current rosters)
    ws2 = wb.create_sheet("Leadership")
    lrows = [[l["org_name"], l["ein"], l["name"], l["title"], money_int(l["comp"]),
              "yes" if l.get("is_executive") == "yes" else ""] for l in leadership]
    def shade_lead(ws, r, row):
        if row[5] == "yes":
            for c in range(1, 7):
                ws.cell(row=r, column=c).fill = exec_fill
    sheet(ws2, ["Organization", "EIN", "Name", "Title", "Compensation", "Executive"], lrows, shade_lead)

    # Financial History
    ws3 = wb.create_sheet("Financial History")
    frows = [[h["org_name"], h["ein"], num(h["year"]), num(h["revenue"]), num(h["expenses"]),
              num(h["assets_eoy"]), num(h["employees"]), num(h["officer_comp"])] for h in history]
    sheet(ws3, ["Organization", "EIN", "Year", "Revenue", "Expenses", "Assets", "Staff", "Officer pay"], frows)

    # News & Sources
    ws4 = wb.create_sheet("News & Sources")
    nrows = [[n["org_name"], n["date"], n["source"], n["title"], n["url"]] for n in news]
    sheet(ws4, ["Organization", "Date", "Source", "Headline", "Link"], nrows)

    # Signals (ranked)
    ws5 = wb.create_sheet("Signals")
    ranked = sorted([o for o in orgs if o["ein"] and o["instability"] > 0],
                    key=lambda o: o["instability"], reverse=True)
    srows = [[o["name"], o["type"], (o["executive"] or {}).get("name", ""),
              len(o["compJumpYears"]), len(o["filingGaps"]),
              "yes" if o["closedCandidate"] else "", o["instability"]] for o in ranked]
    sheet(ws5, ["Organization", "Type", "Executive director", "Pay shifts", "Filing gaps",
                "Closure candidate", "Instability score"], srows)

    # About
    ws6 = wb.create_sheet("About")
    for line in ABOUT_LINES:
        ws6.append([line])
    ws6.column_dimensions["A"].width = 92
    ws6.cell(row=1, column=1).font = Font(bold=True, size=13)

    path = os.path.join(OUT, "corridor_dataset.xlsx")
    wb.save(path)
    print(f"corridor_dataset.xlsx: {len(wb.sheetnames)} sheets")


def copy_downloads():
    os.makedirs(os.path.join(WEB_PUBLIC, "data"), exist_ok=True)
    shutil.copy(os.path.join(OUT, "corridor_dataset.xlsx"),
                os.path.join(WEB_PUBLIC, "corridor_dataset.xlsx"))
    for f in ("roster.csv", "leadership.csv", "financial_history.csv", "news.csv"):
        src = os.path.join(OUT, f)
        if os.path.exists(src):
            shutil.copy(src, os.path.join(WEB_PUBLIC, "data", f))
    print("copied spreadsheet + CSVs to web/public for download")


ABOUT_LINES = [
    "Corridor — Philadelphia CDC / BID dataset",
    "github.com/AdamMirmina/corridor   ·   corridor-phl.vercel.app",
    "",
    "Roster: one row per organization, with its current executive director and key metrics.",
    "Leadership: the full current officer and board roster per organization, from IRS Form 990 Part VII.",
    "  Titles carrying a '(To MM/YYYY)' note mark an officer who was on the way out — a recorded transition.",
    "Financial History: revenue, expenses, assets, staff, and officer pay per organization-year.",
    "News & Sources: recent articles per organization from Google News, including leadership coverage.",
    "Signals: organizations ranked by how much their record suggests leadership instability.",
    "",
    "Executive directors and boards are current as of each organization's latest Form 990.",
    "Year-by-year name history is not included: no free source for historical 990 Part VII names exists.",
    "The pay-shift years flag when leadership most likely changed; the news links report the named changes.",
]


if __name__ == "__main__":
    build()
