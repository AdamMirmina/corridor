"""
Convert the scraper output (output/*.csv) into a single clean JSON file that
the web app consumes. Run after philly_cdc_tracker.py.

Out: web/src/data/dataset.json
"""

import csv
import json
import os
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_CSV = os.path.join(HERE, "output")
WEB_DATA = os.path.join(HERE, "web", "src", "data")


def num(v):
    if v in (None, "", "None"):
        return None
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return None


def split_years(v):
    if not v:
        return []
    return [int(x) for x in v.replace("->", " ").split() if x.strip().isdigit()] \
        if "->" in v else [int(x.strip()) for x in v.split(";") if x.strip().isdigit()]


def load_csv(name):
    path = os.path.join(OUT_CSV, name)
    if not os.path.exists(path):
        return []
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def main():
    roster = load_csv("roster.csv")
    history = load_csv("financial_history.csv")

    # Group financial history by EIN.
    by_ein = {}
    for h in history:
        ein = h.get("ein", "")
        if not ein:
            continue
        by_ein.setdefault(ein, []).append({
            "year": num(h.get("year")),
            "revenue": num(h.get("revenue")),
            "expenses": num(h.get("expenses")),
            "assets": num(h.get("assets_eoy")),
            "netAssets": num(h.get("net_assets_eoy")),
            "employees": num(h.get("employees")),
            "volunteers": num(h.get("volunteers")),
            "officerComp": num(h.get("officer_comp")),
        })
    for ein in by_ein:
        by_ein[ein].sort(key=lambda r: (r["year"] is None, r["year"]))

    orgs = []
    for r in roster:
        ein = r.get("ein", "")
        gaps = []
        if r.get("filing_gaps"):
            for g in r["filing_gaps"].split(";"):
                g = g.strip()
                if "->" in g:
                    a, b = g.split("->")
                    gaps.append({"from": int(a), "to": int(b)})
        comp_jumps = [int(x.strip()) for x in (r.get("comp_jump_years") or "").split(";")
                      if x.strip().isdigit()]
        hist = by_ein.get(ein, [])
        # Instability score: each gap and each comp-jump is a signal; an org that
        # stopped filing well before the dataset's edge is a closure candidate.
        last_year = num(r.get("last_year"))
        closed_candidate = bool(last_year and last_year <= 2021 and ein)
        instability = len(gaps) * 2 + len(comp_jumps) + (3 if closed_candidate else 0)

        orgs.append({
            "name": r.get("org_name", ""),
            "type": r.get("type", ""),
            "ein": ein,
            "irsName": r.get("irs_name", ""),
            "irsCity": r.get("irs_city", ""),
            "confidence": r.get("match_confidence", ""),
            "matchScore": float(r["match_score"]) if r.get("match_score") else None,
            "firstYear": num(r.get("first_year")),
            "lastYear": last_year,
            "yearsFiled": num(r.get("years_filed")) or 0,
            "filingGaps": gaps,
            "compJumpYears": comp_jumps,
            "latestRevenue": num(r.get("latest_revenue")),
            "latestEmployees": num(r.get("latest_employees")),
            "website": r.get("website", ""),
            "contactEmail": r.get("contact_email", ""),
            "source": r.get("source", ""),
            "closedCandidate": closed_candidate,
            "instability": instability,
            "history": hist,
        })

    orgs.sort(key=lambda o: o["name"].lower())

    matched = [o for o in orgs if o["ein"]]
    with_data = [o for o in matched if o["history"]]
    summary = {
        "total": len(orgs),
        "matched": len(matched),
        "withFinancialData": len(with_data),
        "highConfidence": len([o for o in matched if o["confidence"] == "high"]),
        "needsLookup": len([o for o in orgs if not o["ein"]]),
        "withSignal": len([o for o in orgs if o["filingGaps"] or o["compJumpYears"]]),
        "cdcs": len([o for o in orgs if o["type"] == "CDC"]),
        "bids": len([o for o in orgs if o["type"] == "BID"]),
        "closureCandidates": len([o for o in orgs if o["closedCandidate"]]),
        "earliestYear": min((o["firstYear"] for o in matched if o["firstYear"]), default=None),
        "latestYear": max((o["lastYear"] for o in matched if o["lastYear"]), default=None),
    }

    payload = {
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "summary": summary,
        "orgs": orgs,
    }

    os.makedirs(WEB_DATA, exist_ok=True)
    path = os.path.join(WEB_DATA, "dataset.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    print(f"Wrote {path}")
    print(f"  {summary['total']} orgs, {summary['matched']} matched, "
          f"{summary['withFinancialData']} with financial history")


if __name__ == "__main__":
    main()
