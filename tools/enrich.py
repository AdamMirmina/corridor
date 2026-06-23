"""
Corridor enrichment pass. Reads the matched roster (output/roster.csv) and adds
the two things the research most wants beyond raw 990 financials:

  1. Current leadership — executive director / president / CEO and the full
     officer-and-board roster, parsed from each org's ProPublica summary page
     (which renders Part VII of the latest Form 990).
  2. News + sources — recent articles about each org from Google News, including
     a leadership-focused query that surfaces reported executive changes.

Why only *current* leadership and not a full year-by-year name history: as of
2026 every free lightweight source for historical Form 990 Part VII names is
gone (the AWS 990 mirror was retired, the IRS per-file XML URLs 404). The
year-by-year *signal* of when leadership changed still comes from the officer-pay
discontinuities computed in corridor.py; the news links are where the actual
named changes are reported.

Out: output/leadership.csv, output/news.csv
"""

import csv
import html
import os
import re
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(HERE, "output")
UA = {"User-Agent": "Mozilla/5.0 (corridor research; github.com/AdamMirmina/corridor)"}

# An officer counts as the executive if the title looks top-level (director /
# president / CEO) and is not a deputy/vice/associate role. Part VII lists the
# top officer first, so the earliest match in list order wins.
EXEC_POS = re.compile(
    r"executive director|exec\.? dir|chief executive|\bceo\b|\bpresident\b|"
    r"executive officer|managing director",
    re.IGNORECASE,
)
EXEC_NEG = re.compile(r"vice|\bvp\b|assistant|associate|deputy", re.IGNORECASE)


def fetch(url, timeout=30):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "ignore")


def parse_leadership(ein):
    """Pull the current officer/board roster from an org's ProPublica page."""
    try:
        h = fetch(f"https://projects.propublica.org/nonprofits/organizations/{ein}")
    except Exception:
        return {"officers": [], "executive": None}
    text = html.unescape(re.sub(r"<[^>]+>", "|", h))
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\|+", "|", text)
    i = text.find("Key Employees and Officers")
    if i < 0:
        return {"officers": [], "executive": None}
    end = text.find("Document Links", i)
    seg = text[i:end if end > 0 else i + 4000]
    parts = [p.strip() for p in seg.split("|") if p.strip()]

    officers = []
    for j, p in enumerate(parts):
        m = re.match(r"^\((.+)\)$", p)  # a "(Title)" token
        if not m or j == 0:
            continue
        name = parts[j - 1]
        if not re.match(r"^[A-Za-z].*[A-Za-z.]$", name) or name in ("Other", "Related"):
            continue
        title = m.group(1).strip()
        comp = parts[j + 1] if j + 1 < len(parts) and parts[j + 1].startswith("$") else ""
        officers.append({"name": name, "title": title, "comp": comp})

    # de-dupe, cap
    seen, dedup = set(), []
    for o in officers:
        k = o["name"].lower()
        if k in seen:
            continue
        seen.add(k)
        dedup.append(o)
    dedup = dedup[:10]

    executive = next(
        (o for o in dedup if EXEC_POS.search(o["title"]) and not EXEC_NEG.search(o["title"])),
        None,
    )
    if not executive and dedup:
        def comp_val(o):
            return int(re.sub(r"[^0-9]", "", o["comp"]) or 0)
        top = max(dedup, key=comp_val)
        if comp_val(top) > 0:
            executive = top
    return {"officers": dedup, "executive": executive}


def parse_news(query, limit=6):
    url = "https://news.google.com/rss/search?" + urllib.parse.urlencode(
        {"q": query, "hl": "en-US", "gl": "US", "ceid": "US:en"}
    )
    try:
        xml = fetch(url)
    except Exception:
        return []
    items = re.findall(r"<item>(.*?)</item>", xml, re.DOTALL)
    out = []
    for it in items[: limit * 2]:
        t = re.search(r"<title>(.*?)</title>", it, re.DOTALL)
        l = re.search(r"<link>(.*?)</link>", it, re.DOTALL)
        d = re.search(r"<pubDate>(.*?)</pubDate>", it, re.DOTALL)
        s = re.search(r"<source[^>]*>(.*?)</source>", it, re.DOTALL)
        if not t or not l:
            continue
        title = html.unescape(t.group(1)).strip()
        source = html.unescape(s.group(1)).strip() if s else ""
        if not source and " - " in title:
            title, source = title.rsplit(" - ", 1)
        date = ""
        if d:
            # RSS date -> YYYY-MM-DD
            m = re.search(r"(\d{2}) (\w{3}) (\d{4})", d.group(1))
            months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()
            if m:
                date = f"{m.group(3)}-{months.index(m.group(2))+1:02d}-{m.group(1)}"
        out.append({"title": title.strip(), "source": source.strip(),
                    "url": html.unescape(l.group(1)).strip(), "date": date})
    return out


def main():
    roster = []
    with open(os.path.join(OUT, "roster.csv"), newline="", encoding="utf-8") as f:
        roster = [r for r in csv.DictReader(f) if r.get("ein")]
    print(f"Enriching {len(roster)} matched organizations")

    lead_rows, news_rows = [], []
    for i, r in enumerate(roster, 1):
        name, ein = r["org_name"], r["ein"]
        print(f"[{i:>2}/{len(roster)}] {name[:42]:42} ", end="", flush=True)

        lead = parse_leadership(ein)
        ex = lead["executive"]
        for o in lead["officers"]:
            lead_rows.append({"org_name": name, "ein": ein, "name": o["name"],
                              "title": o["title"], "comp": o["comp"],
                              "is_executive": "yes" if ex and o["name"] == ex["name"] else ""})

        # general + leadership-focused news, merged + de-duped by article title
        articles = parse_news(f'"{name}" Philadelphia', limit=5)
        articles += parse_news(f'"{name}" executive director OR president OR CEO', limit=4)
        seen, merged = set(), []
        for a in articles:
            k = a["title"].lower()[:60]
            if k in seen or not a["title"]:
                continue
            seen.add(k)
            merged.append(a)
        merged.sort(key=lambda a: a["date"], reverse=True)
        for a in merged[:6]:
            news_rows.append({"org_name": name, "ein": ein, **a})

        print(f"exec={ex['name'] if ex else '—':22} officers={len(lead['officers'])} news={len(merged[:6])}")
        time.sleep(0.4)

    with open(os.path.join(OUT, "leadership.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["org_name", "ein", "name", "title", "comp", "is_executive"])
        w.writeheader(); w.writerows(lead_rows)
    with open(os.path.join(OUT, "news.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["org_name", "ein", "title", "source", "url", "date"])
        w.writeheader(); w.writerows(news_rows)
    print(f"\nWrote output/leadership.csv ({len(lead_rows)} rows), output/news.csv ({len(news_rows)} rows)")


if __name__ == "__main__":
    main()
