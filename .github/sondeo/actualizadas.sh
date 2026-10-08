#!/bin/bash
# Sondeo temporal: cómo carga El Peruano la sección "Normas actualizadas".
set -u
UA="AppLegalPeru-ingesta/0.1 (+https://github.com/nanoaqp111192-commits/app-legal-peru)"
B=https://diariooficial.elperuano.pe
curl -sSL -A "$UA" "$B/Normas/normasactualizadas" -o pagina.html; wc -c pagina.html
echo "== scripts"; grep -oE '<script[^>]+src="[^"]+"' pagina.html
echo "== inline ajax"; grep -oiE '(url|\$\.(get|post|ajax)|fetch)\s*[:(]\s*["'"'"'][^"'"'"']+' pagina.html | sort -u
echo "== fragmento"; grep -n -i -A3 -B3 'Cargando normas' pagina.html | head -40
for s in $(grep -oE '<script[^>]+src="[^"]+"' pagina.html | sed -E 's/.*src="([^"]+)"/\1/' | grep -vi 'jquery\|bootstrap\|gtm\|google'); do
  case "$s" in http*) u="$s";; /*) u="$B$s";; *) u="$B/$s";; esac
  echo "== js $u"; curl -sSL -A "$UA" "$u" | grep -oiE '.{0,120}(actualizad|Normas/[A-Za-z]+|\.pdf).{0,160}' | head -30
done
echo "== scripts inline con actualiz"; python3 - <<'PY'
import re
h=open('pagina.html',encoding='utf-8',errors='ignore').read()
for m in re.finditer(r'<script[^>]*>(.*?)</script>', h, re.S):
    t=m.group(1)
    if re.search(r'actualiz|ajax|fetch|Cargando', t, re.I): print(t[:3000]); print('-----')
PY
