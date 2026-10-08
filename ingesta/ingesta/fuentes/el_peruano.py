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

_RE_DISPOSITIVO = re.compile(r"busquedas\.elperuano\.pe/dispositivo/([A-Z]+/[\d]+-\d+)")
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
        ids = {
            _RE_DISPOSITIVO.search(a["href"]).group(1)
            for a in padre.find_all("a", href=_RE_DISPOSITIVO)
        }
        if len(ids) > 1:
            break
        if padre.name in ("article", "li") or padre.find(["h4", "h3"]):
            return padre
    return enlace.parent or enlace


def parsear_listado(html: str, dia: date) -> list[Norma]:
    sopa = BeautifulSoup(html, "html.parser")
    normas: dict[str, Norma] = {}
    for enlace in sopa.find_all("a", href=_RE_DISPOSITIVO):
        id_fuente = _RE_DISPOSITIVO.search(enlace["href"]).group(1)
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


def parsear_dispositivo(html: str) -> dict:
    """Extrae título, fecha y texto de la ficha de una norma."""
    sopa = BeautifulSoup(html, "html.parser")
    meta = sopa.find("meta", property="og:title") or sopa.find("meta", attrs={"name": "title"})
    titulo = meta["content"].strip() if meta and meta.get("content") else None
    h1 = sopa.find("h1")
    if h1:
        titulo = " ".join(h1.get_text(" ").split())

    for basura in sopa(["script", "style", "nav", "header", "footer", "noscript"]):
        basura.decompose()
    contenedor = sopa.find("article") or sopa.find("main") or sopa.body or sopa
    lineas = [" ".join(linea.split()) for linea in contenedor.get_text("\n").splitlines()]
    texto = "\n".join(linea for linea in lineas if linea)

    fecha = None
    m = re.search(r"Fecha de publicaci[oó]n:?\s*(\d{2}/\d{2}/\d{4})", texto)
    if m:
        fecha = _fecha(m.group(1))
    return {"titulo": titulo, "fecha_publicacion": fecha, "texto": texto}


def normas_del_dia(dia: date, con_texto: bool = True) -> list[Norma]:
    with cliente() as http:
        normas = parsear_listado(pedir_listado(http, dia), dia)
        if con_texto:
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
