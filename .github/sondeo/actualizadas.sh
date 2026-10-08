#!/bin/bash
set -u
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Safari/537.36"
B=https://diariooficial.elperuano.pe
curl -sSL -A "$UA" -c c.txt "$B/Normas/normasactualizadas" -o pagina.html
echo "== html alrededor de divNorma y formularios"; grep -n -i 'divNorma\|loadingNormas\|<form\|data-ajax\|onclick\|<select\|<option\|<input' pagina.html | head -60
echo "== Portal.js"; curl -sSL -A "$UA" "$B/Scripts/Portal.js" -o portal.js; wc -c portal.js; grep -n -i 'divNorma\|loadingNormas\|actualiz\|url *:' portal.js | head -40
python3 - <<'PY'
import re
for nombre in ('pagina.html','portal.js'):
    h=open(nombre,encoding='utf-8',errors='ignore').read()
    for m in re.finditer(r'divNorma|loadingNormas|Actualizad', h, re.I):
        print('##',nombre,m.start()); print(h[max(0,m.start()-1500):m.start()+1500]); print('-----')
        break
PY
