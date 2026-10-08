#!/bin/bash
set -u
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Safari/537.36"
B=https://diariooficial.elperuano.pe
curl -sSL -A "$UA" "$B/Scripts/normasactualizadas.js?v13042026" -o na.js; wc -c na.js
cat na.js | head -c 20000
