"""Resoluciones del Tribunal Constitucional.

La página "publicadas en el día" lista las resoluciones del último día de
publicación, separadas en sentencias, autos y sentencias interlocutorias.
Cada fila trae (comentado en el HTML) el enlace al PDF; la versión HTML de la
resolución está en la misma ruta con extensión ``.html`` y de ahí se toma el
texto, el número, el asunto y el fallo. Si una fila no trae el enlace, se lee
la ficha del expediente (``detalles-consulta``).

El robots.txt del TC pide ``Crawl-delay: 30``: se respeta con una pausa de
30 segundos entre pedidos, por eso el run completo tarda unos 30 minutos.
Formato validado el 07/10/2026 desde GitHub Actions.
"""

from __future__ import annotations

import re
import time
from dataclasses import asdict, dataclass, field
from datetime import date
from urllib.parse import quote, unquote, urlsplit, urlunsplit

import httpx
from bs4 import BeautifulSoup, Comment, Tag

URL_DIA = "https://www.tc.gob.pe/resolucion/publicadas-en-el-dia/"
AGENTE = "AppLegalPeru-ingesta/0.1 (+https://github.com/nanoaqp111192-commits/app-legal-peru)"
PAUSA_ENTRE_PEDIDOS = 30.0  # robots.txt del TC: Crawl-delay: 30

TIPOS = {
    "sentencias": "sentencia",
    "autosdecretos": "auto",
    "sentenciasInter": "sentencia interlocutoria",
}
PROCESOS = {
    "AA": "Amparo",
    "PA": "Amparo",
    "HC": "Hábeas corpus",
    "PHC": "Hábeas corpus",
    "HD": "Hábeas data",
    "PHD": "Hábeas data",
    "AC": "Cumplimiento",
    "PC": "Cumplimiento",
    "PI": "Inconstitucionalidad",
    "CC": "Competencial",
    "Q": "Queja",
}
MESES = {
    "enero": 1,
    "febrero": 2,
    "marzo": 3,
    "abril": 4,
    "mayo": 5,
    "junio": 6,
    "julio": 7,
    "agosto": 8,
    "septiembre": 9,
    "setiembre": 9,
    "octubre": 10,
    "noviembre": 11,
    "diciembre": 12,
}

_RE_FECHA_DIA = re.compile(r"desde el \w+,?\s+(\d{1,2}) de (\w+) del? (\d{4})", re.IGNORECASE)
_RE_FECHA_CORTA = re.compile(r"(\d{2})/(\d{2})/(\d{4})")
_RE_PDF = re.compile(r'href="(https?://[^"]+/jurisprudencia/[^"]+\.pdf)"', re.IGNORECASE)
_RE_NUMERO = re.compile(
    r"\b((?:Sentencia|Auto|Resolución)\s+(?:interlocutoria\s+)?\d+/\d{4})", re.I
)
_RE_DNI = re.compile(
    r"((?:DNI|D\.N\.I\.?|documento nacional de identidad)\s*(?:N\.?\s*[°º]?\.?|número)?\s*)\d{8}",
    re.IGNORECASE,
)


@dataclass
class Resolucion:
    expediente: str
    tipo: str
    fecha_publicacion: date
    url_oficial: str
    colegiado: str | None = None
    demandante: str | None = None
    demandado: str | None = None
    url_pdf: str | None = None
    url_html: str | None = None
    numero: str | None = None
    sumilla: str | None = None
    fallo: str | None = None
    texto: str | None = None
    fuente: str = "tc"
    ramas: list[str] = field(default_factory=list)

    @property
    def proceso(self) -> str | None:
        return PROCESOS.get(self.expediente.rsplit("-", 1)[-1].upper())

    @property
    def id_fuente(self) -> str:
        """Año y archivo publicado: distingue varias resoluciones de un expediente."""
        if not self.url_pdf:
            return f"{self.fecha_publicacion.year}/{self.expediente}"
        ruta = urlsplit(self.url_pdf).path
        anio, archivo = unquote(ruta).rstrip("/").split("/")[-2:]
        return f"{anio}/{archivo.removesuffix('.pdf').removesuffix('.PDF')}"

    def como_fila(self) -> dict:
        fila = asdict(self)
        fila["fecha_publicacion"] = self.fecha_publicacion.isoformat()
        fila["proceso"] = self.proceso
        fila["id_fuente"] = self.id_fuente
        return fila


def cliente() -> httpx.Client:
    return httpx.Client(
        headers={"User-Agent": AGENTE, "Accept-Language": "es-PE,es;q=0.9"},
        timeout=60,
        follow_redirects=True,
    )


def _texto(nodo: Tag | None) -> str | None:
    if nodo is None:
        return None
    texto = " ".join(nodo.get_text(" ").split())
    return texto or None


def _url(url: str) -> str:
    """Codifica espacios y tildes en la ruta (p. ej. '04871-2025-AA Desistimiento.pdf')."""
    partes = urlsplit(url)
    return urlunsplit(partes._replace(path=quote(partes.path, safe="/%")))


def fecha_del_dia(html: str) -> date | None:
    m = _RE_FECHA_DIA.search(" ".join(BeautifulSoup(html, "html.parser").get_text(" ").split()))
    if not m or m.group(2).lower() not in MESES:
        return None
    return date(int(m.group(3)), MESES[m.group(2).lower()], int(m.group(1)))


def _celda(fila: Tag, titulo: str) -> str | None:
    return _texto(fila.find(["td", "th"], attrs={"data-title": titulo}))


def parsear_dia(html: str) -> list[Resolucion]:
    sopa = BeautifulSoup(html, "html.parser")
    fecha = fecha_del_dia(html)
    if fecha is None:
        return []
    resoluciones: list[Resolucion] = []
    for id_panel, tipo in TIPOS.items():
        panel = sopa.find(id=id_panel)
        if panel is None:
            continue
        for fila in panel.find_all("tr"):
            expediente = _celda(fila, "Nro.Expediente")
            if not expediente:
                continue
            detalle = fila.find("a", href=re.compile(r"detalles-consulta\?id_exp="))
            comentado = " ".join(c for c in fila.find_all(string=lambda t: isinstance(t, Comment)))
            pdf = _RE_PDF.search(comentado)
            url_pdf = _url(pdf.group(1)) if pdf else None
            resoluciones.append(
                Resolucion(
                    expediente=expediente,
                    tipo=tipo,
                    fecha_publicacion=fecha,
                    url_oficial=detalle["href"] if detalle else URL_DIA,
                    colegiado=_celda(fila, "Colegiado"),
                    demandante=_celda(fila, "Demandante"),
                    demandado=_celda(fila, "Demandado"),
                    url_pdf=url_pdf,
                    url_html=re.sub(r"\.pdf$", ".html", url_pdf, flags=re.I) if url_pdf else None,
                )
            )
    return resoluciones


def parsear_detalle(html: str) -> list[dict]:
    """Resoluciones publicadas que lista la ficha de un expediente."""
    sopa = BeautifulSoup(html, "html.parser")
    publicadas = []
    for fila in sopa.find_all("tr"):
        pdf = fila.find("td", attrs={"data-title": "Ver Publicación"})
        enlace = pdf.find("a", href=True) if pdf else None
        if not enlace:
            continue
        html_celda = fila.find("td", attrs={"data-title": re.compile("Formato HTML")})
        enlace_html = html_celda.find("a", href=True) if html_celda else None
        m = _RE_FECHA_CORTA.search(_celda(fila, "Fecha de Public. Web") or "")
        publicadas.append(
            {
                "tipo": _celda(fila, "Tipo de Resolución"),
                "fecha": date(int(m.group(3)), int(m.group(2)), int(m.group(1))) if m else None,
                "url_pdf": _url(enlace["href"]),
                "url_html": _url(enlace_html["href"]) if enlace_html else None,
            }
        )
    return publicadas


def _parrafos(sopa: BeautifulSoup) -> list[str]:
    return [t for t in (_texto(p) for p in sopa.find_all("p")) if t]


def parsear_resolucion(html: str) -> dict:
    """Número, asunto, fallo y texto (sin notas al pie) de la versión HTML."""
    sopa = BeautifulSoup(html, "html.parser")
    for nota in sopa.select("section.footnotes, script, style"):
        nota.decompose()
    numero = None

    parrafos = _parrafos(sopa)
    sumilla = None
    fallo: list[str] = []
    for i, p in enumerate(parrafos):
        clave = p.upper().strip(" :")
        if clave == "ASUNTO" and sumilla is None and i + 1 < len(parrafos):
            sumilla = parrafos[i + 1]
        if clave in ("HA RESUELTO", "RESUELVE"):
            for siguiente in parrafos[i + 1 :]:
                if re.match(r"(Publíquese|Publiquese|SS\.)", siguiente):
                    break
                fallo.append(siguiente)
            break

    cabecera = [t for t in (_texto(a) for a in sopa.find_all("a")[:4]) if t]
    texto = "\n".join(cabecera + parrafos)
    return {
        "numero": numero.group(1) if (numero := _RE_NUMERO.search(" ".join(cabecera))) else None,
        "sumilla": sumilla,
        "fallo": " ".join(fallo) or None,
        "texto": ocultar_dni(texto) or None,
    }


def ocultar_dni(texto: str) -> str:
    """Las resoluciones pueden citar DNI: no se guardan (Ley 29733)."""
    return _RE_DNI.sub(lambda m: f"{m.group(1)}********", texto)


def ramas(resolucion: Resolucion) -> list[str]:
    destino = ["constitucional"]
    if resolucion.proceso == "Hábeas corpus":
        destino.append("penal")
    return destino


class Lector:
    """Pide páginas al TC respetando la pausa entre pedidos."""

    def __init__(self, http: httpx.Client, pausa: float | None = None):
        self.http = http
        self.pausa = PAUSA_ENTRE_PEDIDOS if pausa is None else pausa
        self._ultimo: float | None = None

    def get(self, url: str) -> httpx.Response:
        if self._ultimo is not None:
            espera = self.pausa - (time.monotonic() - self._ultimo)
            if espera > 0:
                time.sleep(espera)
        try:
            return self.http.get(url)
        finally:
            self._ultimo = time.monotonic()


def completar(lector: Lector, r: Resolucion) -> None:
    """Busca los enlaces si faltan y llena número, asunto, fallo y texto."""
    if not r.url_pdf and "detalles-consulta" in r.url_oficial:
        respuesta = lector.get(r.url_oficial)
        if respuesta.status_code == 200:
            publicadas = parsear_detalle(respuesta.text)
            del_dia = [p for p in publicadas if p["fecha"] == r.fecha_publicacion] or publicadas
            if del_dia:
                r.url_pdf, r.url_html = del_dia[-1]["url_pdf"], del_dia[-1]["url_html"]
    if not r.url_html:
        return
    respuesta = lector.get(r.url_html)
    if respuesta.status_code != 200:
        r.url_html = None  # los autos a veces solo tienen PDF
        return
    datos = parsear_resolucion(respuesta.text)
    r.numero, r.sumilla, r.fallo, r.texto = (
        datos["numero"],
        datos["sumilla"],
        datos["fallo"],
        datos["texto"],
    )


def resoluciones_del_dia(
    ya_guardadas: set[tuple[str, date]] | None = None, maximo: int | None = None
) -> list[Resolucion]:
    """Lista del último día publicado. Omite las (expediente, fecha) ya guardadas."""
    ya_guardadas = ya_guardadas or set()
    with cliente() as http:
        lector = Lector(http)
        respuesta = lector.get(URL_DIA)
        respuesta.raise_for_status()
        resoluciones = [
            r
            for r in parsear_dia(respuesta.text)
            if (r.expediente, r.fecha_publicacion) not in ya_guardadas
        ]
        for r in resoluciones[:maximo]:
            completar(lector, r)
            r.ramas = ramas(r)
    return resoluciones[:maximo]
