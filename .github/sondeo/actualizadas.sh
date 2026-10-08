#!/bin/bash
set -u
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Safari/537.36"
B=https://diariooficial.elperuano.pe
J=/tmp/c.txt
curl -sSL -c $J -b $J -A "$UA" "$B/Normas/normasactualizadas" -o /dev/null -w "pagina %{http_code}\n"
echo "== materias"; curl -sS -b $J -A "$UA" -H "X-Requested-With: XMLHttpRequest" "$B/Normas/listarMateria" -w "\n%{http_code} %{content_type}\n" | head -c 3000
echo; echo "== lista"
curl -sS -b $J -A "$UA" -H "X-Requested-With: XMLHttpRequest" "$B/Normas/consultarNormasActualizadas?Titulo=&NroNorma=&PalabrasClave=&IdMateria=0" -o lista.json -w "%{http_code} %{content_type} %{size_download}\n"
python3 - <<'PY'
import json
try:
    d=json.load(open('lista.json'))
except Exception as e:
    print('no json', e, open('lista.json','rb').read()[:500]); raise SystemExit
if isinstance(d,dict): print('keys', list(d)); d=next((v for v in d.values() if isinstance(v,list)), [])
print('total', len(d))
for x in d:
    x={k:(v if k!='Portada' else f'<{len(v or "")}b>') for k,v in x.items()}
    print(json.dumps(x, ensure_ascii=False))
open('ids.txt','w').write('\n'.join(str(x['IdNorma']) for x in d[:3]))
PY
for id in $(cat ids.txt 2>/dev/null); do
  echo "== documento $id"
  curl -sS -D - -b $J -A "$UA" "$B/Normas/obtenerDocumento?idNorma=$id" -o doc_$id -w "%{http_code} %{size_download}\n" | grep -iE "^(HTTP|content-|last-modified|etag)|^[0-9]"
  file doc_$id; sha256sum doc_$id
done
echo "== segunda descarga (estabilidad del hash)"
id=$(head -1 ids.txt); curl -sS -b $J -A "$UA" "$B/Normas/obtenerDocumento?idNorma=$id" -o doc2 && sha256sum doc2
echo "== sin cookie"
curl -sS -A "$UA" "$B/Normas/consultarNormasActualizadas?Titulo=&NroNorma=&PalabrasClave=&IdMateria=0" -o /dev/null -w "%{http_code} %{size_download}\n"
curl -sS -A "$UA" "$B/Normas/obtenerDocumento?idNorma=$id" -o d3 -w "%{http_code} %{size_download}\n"; sha256sum d3
