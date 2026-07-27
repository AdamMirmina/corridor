"""
Dedicated, deeper Philadelphia Inquirer search for the 20 organizations in
the ED Timeline sample (data/ed_timeline_sample.txt) -- these are the
featured "reliable data" orgs, so they get a more thorough pass than the
general per-org cap in tools/enrich.py allows. Merges any newly found
Inquirer articles into output/news.csv (deduped against what's already
there by title).

Run after tools/enrich.py (needs output/roster.csv, output/news.csv) and
before the final tools/build_outputs.py so the results flow through to
dataset.json and the spreadsheet.
"""

import csv
import html
import os
import re
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(HERE, "data")
OUT = os.path.join(HERE, "output")
UA = {"User-Agent": "Mozilla/5.0 (corridor research; github.com/AdamMirmina/corridor)"}


def fetch(url, timeout=30):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "ignore")


def parse_news(query, limit=12):
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
            m = re.search(r"(\d{2}) (\w{3}) (\d{4})", d.group(1))
            months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()
            if m:
                date = f"{m.group(3)}-{months.index(m.group(2))+1:02d}-{m.group(1)}"
        out.append({"title": title.strip(), "source": source.strip(),
                    "url": html.unescape(l.group(1)).strip(), "date": date})
        if len(out) >= limit:
            break
    return out


def main():
    with open(os.path.join(DATA, "ed_timeline_sample.txt"), encoding="utf-8") as f:
        sample = [l.strip() for l in f if l.strip()]

    with open(os.path.join(OUT, "roster.csv"), newline="", encoding="utf-8") as f:
        roster = {r["org_name"]: r for r in csv.DictReader(f)}

    with open(os.path.join(OUT, "news.csv"), newline="", encoding="utf-8") as f:
        news_rows = list(csv.DictReader(f))

    seen_titles = {}
    for n in news_rows:
        seen_titles.setdefault(n["org_name"], set()).add(n["title"].lower()[:60])

    added_total = 0
    for i, name in enumerate(sample, 1):
        ein = roster.get(name, {}).get("ein", "")
        print(f"[{i:>2}/{len(sample)}] {name[:45]:45} ", end="", flush=True)
        results = parse_news(f'"{name}" site:inquirer.com', limit=12)
        seen = seen_titles.setdefault(name, set())
        added = 0
        for a in results:
            k = a["title"].lower()[:60]
            if k in seen or not a["title"]:
                continue
            seen.add(k)
            a["source"] = a["source"] or "The Philadelphia Inquirer"
            news_rows.append({"org_name": name, "ein": ein, **a})
            added += 1
        added_total += added
        print(f"+{added} new Inquirer articles (found {len(results)} total)")
        time.sleep(0.4)

    with open(os.path.join(OUT, "news.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["org_name", "ein", "title", "source", "url", "date"])
        w.writeheader()
        w.writerows(news_rows)

    print(f"\nAdded {added_total} new Inquirer articles across {len(sample)} sampled organizations")
    print(f"Wrote output/news.csv ({len(news_rows)} total rows)")


if __name__ == "__main__":
    main()
