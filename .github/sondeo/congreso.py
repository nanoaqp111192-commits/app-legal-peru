"""Sondeo temporal: ¿se pueden leer los proyectos de ley del Congreso?"""
import json
import httpx

H = {"User-Agent": "Mozilla/5.0 (app-legal-peru; sondeo)", "Accept": "application/json, text/plain, */*"}
c = httpx.Client(headers=H, timeout=40, follow_redirects=True)
for u in [
    "https://wb2server.congreso.gob.pe/spley-portal/",
    "https://wb2server.congreso.gob.pe/robots.txt",
    "https://www.congreso.gob.pe/robots.txt",
    "https://leyes.congreso.gob.pe/",
]:
    try:
        r = c.get(u)
        print("GET", u, r.status_code, r.headers.get("content-type"), r.text[:600].replace("\n", " "))
    except Exception as e:
        print("GET", u, "ERROR", repr(e))
cuerpo = {"perParId": 2021, "perLegId": None, "comisionId": None, "estadoId": None, "congresistaId": None,
          "grupoParlamentarioId": None, "proponenteId": None, "legislatura": None, "fecIniPresentacion": None,
          "fecFinPresentacion": None, "pageSize": 5, "rowStart": 0, "tipoFirmanteId": None, "pleno": False}
for u in [
    "https://wb2server.congreso.gob.pe/spley-portal-service/proyecto-ley/lista-con-filtro",
    "https://wb2server.congreso.gob.pe/spley-portal-service/archivo/lista-con-filtro",
]:
    try:
        r = c.post(u, json=cuerpo)
        print("POST", u, r.status_code, r.headers.get("content-type"))
        print(r.text[:3000])
    except Exception as e:
        print("POST", u, "ERROR", repr(e))
# Buscar en el JS del portal las rutas del servicio
try:
    r = c.get("https://wb2server.congreso.gob.pe/spley-portal/")
    import re
    for src in re.findall(r'src="([^"]+\.js)"', r.text)[:6]:
        js = c.get("https://wb2server.congreso.gob.pe/spley-portal/" + src.lstrip("/")).text
        rutas = sorted(set(re.findall(r'["\'`](/?[a-z\-]+/[a-z\-/]+(?:filtro|lista|detalle|expediente|search)[a-z\-/]*)["\'`]', js)))
        print("JS", src, len(js), rutas[:60])
        for m in re.finditer(r'spley-portal-service[^"\'`]{0,80}', js):
            print("  SVC", m.group(0)); break
except Exception as e:
    print("JS ERROR", repr(e))
