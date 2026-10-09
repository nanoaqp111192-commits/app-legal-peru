"""Normas Legales del diario oficial El Peruano.

El listado del día lo carga la web de diariooficial.elperuano.pe con una
petición aparte. Este módulo no depende del diseño exacto de ese listado:
busca cada enlace a ``busquedas.elperuano.pe/dispositivo/...`` y toma el
sector, la fecha y la sumilla del bloque que lo contiene. La ficha de cada
norma (``/dispositivo/NL/<id>``) da el texto completo.

Validado el 07/10/2026 desde GitHub Actions: el listado real de ese día
dio 95 normas con número, sector y título correctos. El job
``fuente-el-peruano`` del CI repite la prueba en cada cambio y avisa si el
diario cambia su web.
"""

from __future__ import annotations

import re
import time
from datetime import date, datetime, timedelta, timezone

import httpx
from bs4 import BeautifulSoup, Tag

from ingesta.norma import Norma

URL_LISTADO = "https://diariooficial.elperuano.pe/Normas/Filtro"
AGENTE = "AppLegalPeru-ingesta/0.1 (+https://github.com/nanoaqp111192-commits/app-legal-peru)"
PAUSA_ENTRE_PEDIDOS = 1.0  # segundos; no sobrecargar el servidor del diario

# Desde 2024 el listado enlaza a /dispositivo/NL/<id>; de 2016 a 2023, a
# /normaslegales/<texto>-<id>/. Ambos llevan a la misma ficha /dispositivo/NL/<id>.
_RE_DISPOSITIVO = re.compile(
    r"busquedas\.elperuano\.pe/(?:dispositivo/([A-Z]+/\d+-\d+)|normaslegales/[^\"]*?-(\d+-\d+)/?$)"
)


def _id_fuente(href: str) -> str:
    m = _RE_DISPOSITIVO.search(href)
    return m.group(1) or f"NL/{m.group(2)}"


_RE_FECHA = re.compile(r"(\d{2})/(\d{2})/(\d{4})")
_RE_NUMERO = re.compile(r"\bN[°º.o]?\s*[\dA-Z]", re.IGNORECASE)


def cliente() -> httpx.Client:
    return httpx.Client(
        headers={"User-Agent": AGENTE, "Accept-Language": "es-PE,es;q=0.9"},
        timeout=30,
        follow_redirects=True,
    )


# Esperas (segundos) antes de reintentar el listado. En la carga histórica del
# 08/10/2026 el diario cortó la conexión (SSL EOF) en tandas de varios días seguidos.
ESPERAS_REINTENTO = (15, 60, 180)


def pedir_listado(http: httpx.Client, dia: date) -> str:
    """Devuelve el HTML del listado de normas publicadas en ``dia``.

    Reintenta ante cortes de conexión y errores 5xx del diario."""
    fecha = dia.strftime("%d/%m/%Y")
    for espera in (*ESPERAS_REINTENTO, None):
        try:
            respuesta = http.post(
                URL_LISTADO,
                data={"cddesde": fecha, "cdhasta": fecha, "X-Requested-With": "XMLHttpRequest"},
                headers={"X-Requested-With": "XMLHttpRequest"},
            )
            if respuesta.status_code < 500 or espera is None:
                respuesta.raise_for_status()
                return respuesta.text
        except httpx.TransportError:
            if espera is None:
                raise
        time.sleep(espera)
    raise AssertionError("inalcanzable")


def separar_titulo(titulo: str) -> tuple[str | None, str | None]:
    """Separa el tipo del número.

    'LEY N° 32999' da ('LEY', 'LEY N° 32999'): el número conserva el tipo
    porque así se cita la norma.
    """
    titulo = " ".join(titulo.split())
    coincidencia = _RE_NUMERO.search(titulo)
    if not coincidencia:
        return None, None
    tipo = titulo[: coincidencia.start()].strip(" -–") or None
    return tipo, titulo


def _fecha(texto: str) -> date | None:
    m = _RE_FECHA.search(texto)
    if not m:
        return None
    dia, mes, anio = (int(x) for x in m.groups())
    try:
        return date(anio, mes, dia)
    except ValueError:
        return None


def _bloque(enlace: Tag) -> Tag:
    """El contenedor más cercano que agrupa una sola norma."""
    for padre in enlace.parents:
        if not isinstance(padre, Tag) or padre.name in ("body", "html"):
            break
        ids = {_id_fuente(a["href"]) for a in padre.find_all("a", href=_RE_DISPOSITIVO)}
        if len(ids) > 1:
            break
        if padre.name in ("article", "li") or padre.find(["h4", "h3"]):
            return padre
    return enlace.parent or enlace


def parsear_listado(html: str, dia: date) -> list[Norma]:
    sopa = BeautifulSoup(html, "html.parser")
    normas: dict[str, Norma] = {}
    for enlace in sopa.find_all("a", href=_RE_DISPOSITIVO):
        id_fuente = _id_fuente(enlace["href"])
        if id_fuente in normas:
            continue
        bloque = _bloque(enlace)
        encabezado = bloque.find(["h4", "h3"])
        sector = " ".join(encabezado.get_text(" ").split()) if encabezado else None

        titulo_enlace = " ".join(enlace.get_text(" ").split())
        tipo, numero = separar_titulo(titulo_enlace)

        parrafos = [" ".join(p.get_text(" ").split()) for p in bloque.find_all("p")]
        fecha = next((f for f in map(_fecha, parrafos) if f), None) or dia
        sumilla = next((p for p in parrafos if p and not _RE_FECHA.search(p) and len(p) > 15), None)
        pdf = bloque.find(
            lambda t: (
                t.name in ("a", "input")
                and ".pdf" in (t.get("href") or t.get("data-url") or "").lower()
            )
        )
        texto_bloque = bloque.get_text(" ").lower()

        normas[id_fuente] = Norma(
            id_fuente=id_fuente,
            titulo=sumilla or titulo_enlace,
            tipo=tipo,
            numero=numero,
            sumilla=sumilla,
            sector=sector,
            fecha_publicacion=fecha,
            edicion_extraordinaria="extraordinaria" in texto_bloque,
            url_oficial=f"https://busquedas.elperuano.pe/dispositivo/{id_fuente}",
            url_pdf=(pdf.get("href") or pdf.get("data-url")) if pdf else None,
        )
    return list(normas.values())


# Bloques que forman una línea del texto; lo que va dentro (spans, negritas) se une.
_BLOQUES = ["h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "tr", "blockquote", "pre"]


def _unir(texto: str) -> str:
    """Espacios simples y sin espacio antes de la puntuación ("Noveno .-" -> "Noveno.-")."""
    texto = " ".join(texto.split())
    texto = re.sub(r"\s+([.,;:)\]])", r"\1", texto)
    return re.sub(r"([(\[“\"])\s+", r"\1", texto)


def _lineas_del_visor(visor: Tag) -> list[str]:
    lineas: list[str] = []
    for bloque in visor.find_all(_BLOQUES):
        if bloque.find_parent(_BLOQUES):
            continue  # ya incluido en su bloque contenedor
        if "sumilla" in (bloque.get("class") or []):
            continue  # es el título, que la app muestra aparte
        if bloque.name == "tr":
            celdas = [_unir(c.get_text(" ")) for c in bloque.find_all(["td", "th"])]
            linea = " | ".join(c for c in celdas if c)
        else:
            linea = _unir(bloque.get_text(" "))
        if linea and not _RE_CODIGO_CIERRE.fullmatch(linea):
            lineas.append(linea)
    return lineas


def parsear_dispositivo(html: str) -> dict:
    """Extrae título, fecha y texto de la ficha de una norma.

    El texto está en el visor HTML de la ficha (``#visor-html``, con la norma
    dentro de ``.story``): un párrafo por línea. Si el diario cambia ese
    diseño, se toma el texto de toda la página sin menús.
    """
    sopa = BeautifulSoup(html, "html.parser")
    meta = sopa.find("meta", property="og:title") or sopa.find("meta", attrs={"name": "title"})
    titulo = meta["content"].strip() if meta and meta.get("content") else None
    sumilla = sopa.select_one("#visor-html h1.sumilla") or sopa.find("h1")
    if sumilla:
        titulo = _unir(sumilla.get_text(" "))

    fecha = None
    m = re.search(r"Fecha de publicaci[oó]n:?\s*(\d{2}/\d{2}/\d{4})", sopa.get_text(" "))
    if m:
        fecha = _fecha(m.group(1))

    visor = sopa.select_one("#visor-html .story") or sopa.select_one("#visor-html")
    if visor:
        texto = "\n".join(_lineas_del_visor(visor))
    elif "Cargando visor PDF" in sopa.get_text(" "):
        # Normas anteriores a 2024: la ficha solo muestra el PDF, sin texto.
        texto = None
    else:
        for basura in sopa(["script", "style", "nav", "header", "footer", "noscript"]):
            basura.decompose()
        contenedor = sopa.find("article") or sopa.find("main") or sopa.body or sopa
        lineas = [" ".join(linea.split()) for linea in contenedor.get_text("\n").splitlines()]
        texto = "\n".join(linea for linea in lineas if linea)
    return {"titulo": titulo, "fecha_publicacion": fecha, "texto": texto}


# Código de la publicación al pie de cada norma (p. ej. "2557156-1").
_RE_CODIGO_CIERRE = re.compile(r"\d{6,8}-\d{1,2}")
_RE_SOLO_PUNTUACION = re.compile(r"[.\-–—:;,]+")
_RE_NUMERAL = re.compile(r"(\d{1,3}(\.\d{1,3})*|[a-zA-Z]|[ivxlcdmIVXLCDM]{1,6})[.)]")
_CABECERA_VISOR = ("PDF", "HTML", "Cuadernillo")


def _comparable(texto: str) -> str:
    return re.sub(r"[^0-9a-záéíóúüñ]", "", texto.lower())


def limpiar_texto_guardado(texto: str, titulo: str | None = None) -> str:
    """Repara el texto que se guardó antes de leer el visor de la ficha.

    Quita la cabecera de la página (PDF / HTML / Cuadernillo / fecha / un título
    ajeno / la sumilla), el código final de la publicación, y vuelve a unir las
    líneas que la extracción partió en cada negrita ("Artículo Sexto" / ".-" /
    "CONSTITUIR..." -> "Artículo Sexto.- CONSTITUIR..."). Es idempotente.
    """
    lineas = [linea.strip() for linea in texto.splitlines() if linea.strip()]
    if tuple(lineas[:3]) == _CABECERA_VISOR:
        lineas = lineas[3:]
        if lineas and re.match(r"Fecha de publicaci[oó]n", lineas[0]):
            lineas = lineas[1:]
            if lineas and _RE_FECHA.fullmatch(lineas[0]):
                lineas = lineas[1:]
        # Sigue un título ajeno (el <title> del documento incrustado) y la sumilla.
        objetivo = _comparable(titulo or "")
        corte = None
        for i, linea in enumerate(lineas[:3]):
            if objetivo and _comparable(linea) == objetivo:
                corte = i + 1
                break
        if corte is None:
            corte = 2 if len(lineas) > 2 else 0
        lineas = lineas[corte:]
    # La sumilla repetida al inicio (a veces con otra puntuación que el título guardado).
    objetivo = _comparable(titulo or "")[:40]
    if objetivo and lineas and _comparable(lineas[0])[:40] == objetivo:
        lineas = lineas[1:]
    while lineas and _RE_CODIGO_CIERRE.fullmatch(lineas[-1]):
        lineas.pop()

    unidas: list[str] = []
    pegar = False
    for linea in lineas:
        if _RE_SOLO_PUNTUACION.fullmatch(linea) and unidas:
            unidas[-1] = unidas[-1] + linea
            pegar = linea.endswith("-")
            continue
        if pegar:
            unidas[-1] = f"{unidas[-1]} {linea}"
            pegar = False
            continue
        unidas.append(linea)
        if _RE_NUMERAL.fullmatch(linea):
            pegar = True  # "1." / "a)" sueltos van con su texto
            continue
        # Un encabezado suelto ("Artículo Segundo.-") va con el párrafo que le sigue.
        pegar = linea.endswith(".-") and len(linea) < 80
    return "\n".join(_unir(linea) for linea in unidas)


# Antes de 2024 la ficha solo muestra el PDF: no vale la pena pedirla norma por norma.
PRIMER_DIA_CON_TEXTO = date(2024, 1, 1)


def normas_del_dia(dia: date, con_texto: bool = True) -> list[Norma]:
    with cliente() as http:
        normas = parsear_listado(pedir_listado(http, dia), dia)
        if con_texto and dia >= PRIMER_DIA_CON_TEXTO:
            for norma in normas:
                time.sleep(PAUSA_ENTRE_PEDIDOS)
                try:
                    respuesta = http.get(norma.url_oficial)
                    respuesta.raise_for_status()
                except httpx.HTTPError:
                    continue  # se guarda sin texto; el siguiente run lo reintenta
                ficha = parsear_dispositivo(respuesta.text)
                norma.texto = ficha["texto"]
    return normas


def hoy_en_lima() -> date:
    # Perú no tiene horario de verano: UTC-5 todo el año.
    return datetime.now(timezone(timedelta(hours=-5))).date()
