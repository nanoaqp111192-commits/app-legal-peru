"""Sondeo temporal: estructura de las fuentes de jurisprudencia del Poder Judicial."""

import re
import sys

import httpx
from bs4 import BeautifulSoup

URLS = sys.argv[1:]
H = {"User-Agent": "Mozilla/5.0 (app-legal-peru; sondeo)"}

with httpx.Client(headers=H, timeout=40, follow_redirects=True, verify=False) as c:
    for url in URLS:
        print("=" * 100)
        print("URL", url)
        try:
            r = c.get(url)
        except Exception as e:
            print("ERROR", repr(e))
            continue
        print("STATUS", r.status_code, "FINAL", r.url, "TIPO", r.headers.get("content-type"))
        print("SET-COOKIE", r.headers.get("set-cookie", "")[:300])
        if "html" not in (r.headers.get("content-type") or ""):
            print(r.text[:3000])
            continue
        s = BeautifulSoup(r.text, "html.parser")
        print("TITLE", s.title and s.title.get_text(strip=True))
        for f in s.find_all("form"):
            print("FORM", f.get("id"), f.get("action"), f.get("method"))
            for i in f.find_all(["input", "select", "textarea", "button"]):
                print("   ", i.name, i.get("type"), i.get("name"), i.get("id"), (i.get("value") or "")[:60])
                if i.name == "select":
                    print("      OPC", [o.get_text(strip=True)[:30] + "=" + (o.get("value") or "") for o in i.find_all("option")][:40])
        links = [(a.get_text(" ", strip=True)[:70], a.get("href")) for a in s.find_all("a") if a.get("href")]
        print("LINKS", len(links))
        for t, h in [l for l in links if re.search(r"(?i)pdf|connect/[^ ]*(acuerdo|pleno|casac|resol|cas_)|\?|page", (l[1] or "")+l[0])][:200]:
            print("   ", t, "|", h)
        scripts = [x.get("src") for x in s.find_all("script") if x.get("src")]
        print("SCRIPTS", scripts[:20])
        txt = re.sub(r"\s+", " ", s.get_text(" "))
        i = txt.find("Acuerdo") if "Acuerdo" in txt else 0
        print("TEXTO", txt[max(0, i - 200) : i + 3500])
