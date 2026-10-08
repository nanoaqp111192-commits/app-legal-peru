#!/bin/bash
set -u
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Safari/537.36"
B=https://diariooficial.elperuano.pe
curl -sSL -A "$UA" "$B/Normas/normasactualizadas" -o pagina.html
sed -n '200,283p;289,$p' pagina.html | grep -v 'googletag\|defineSlot\|^\s*$'
