"""
Geocode every roster address (via OpenStreetMap's free Nominatim API, one
request per second per its usage policy) so the map artifact can plot pins.

Out: output/geocoded.csv  (org_name, address, lat, lon, geocode_status)
"""

import csv
import os
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(HERE, "data")
OUT = os.path.join(HERE, "output")
UA = {"User-Agent": "corridor research (academic; github.com/AdamMirmina/corridor)"}


def geocode(address):
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode({
        "q": address, "format": "json", "limit": 1, "countrycodes": "us",
    })
    req = urllib.request.Request(url, headers=UA)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            import json
            data = json.load(r)
    except Exception as e:
        return None, None, f"error: {str(e)[:60]}"
    if not data:
        return None, None, "no match"
    return float(data[0]["lat"]), float(data[0]["lon"]), "ok"


def main():
    with open(os.path.join(DATA, "cdc_roster.csv"), newline="", encoding="utf-8") as f:
        roster = list(csv.DictReader(f))

    rows = []
    for i, r in enumerate(roster, 1):
        addr = (r.get("address") or "").strip()
        name = r["org_name"]
        if not addr:
            rows.append({"org_name": name, "address": "", "lat": "", "lon": "", "status": "no address"})
            print(f"[{i:>3}/{len(roster)}] {name[:45]:45} skipped (no address)")
            continue
        lat, lon, status = geocode(addr)
        rows.append({"org_name": name, "address": addr, "lat": lat or "", "lon": lon or "", "status": status})
        print(f"[{i:>3}/{len(roster)}] {name[:45]:45} {status}")
        time.sleep(1.1)  # Nominatim usage policy: max 1 req/sec

    with open(os.path.join(OUT, "geocoded.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["org_name", "address", "lat", "lon", "status"])
        w.writeheader()
        w.writerows(rows)

    ok = sum(1 for r in rows if r["status"] == "ok")
    print(f"\nGeocoded {ok}/{len(rows)} organizations")


if __name__ == "__main__":
    main()
