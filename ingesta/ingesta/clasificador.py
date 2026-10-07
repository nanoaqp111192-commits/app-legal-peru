"""Clasificación de normas por rama del derecho.

Reglas simples y auditables: el sector que publica la norma y palabras clave
en su título. Una norma puede pertenecer a varias ramas. Los actos de
personal (designaciones, renuncias, encargos) van a "otros" salvo que el
título mencione una materia, para que no ensucien las alertas.
"""

from __future__ import annotations

import re
import unicodedata

from ingesta.norma import Norma


def normalizar(texto: str | None) -> str:
    texto = unicodedata.normalize("NFKD", texto or "")
    return "".join(c for c in texto if not unicodedata.combining(c)).lower()


# Sector (como lo rotula El Peruano) -> ramas. Se compara contra el texto
# normalizado, así que basta un fragmento sin tildes.
POR_SECTOR: list[tuple[str, tuple[str, ...]]] = [
    ("trabajo y promocion del empleo", ("laboral",)),
    ("sunafil", ("laboral",)),
    ("servir", ("laboral", "administrativo")),
    ("ministerio publico", ("penal",)),
    ("instituto nacional penitenciario", ("penal",)),
    ("poder judicial", ("civil", "penal")),
    ("consejo ejecutivo del poder judicial", ("civil", "penal")),
    ("tribunal constitucional", ("constitucional",)),
    ("junta nacional de justicia", ("constitucional",)),
    ("administracion tributaria", ("tributario",)),
    ("sunat", ("tributario",)),
    ("tribunal fiscal", ("tributario",)),
    ("registros publicos", ("registral",)),
    ("sunarp", ("registral",)),
    ("indecopi", ("consumidor",)),
    ("contrataciones del estado", ("contrataciones",)),
    ("osce", ("contrataciones",)),
    ("oece", ("contrataciones",)),
    ("ambiente", ("ambiental",)),
    ("evaluacion y fiscalizacion ambiental", ("ambiental",)),
    ("mujer y poblaciones vulnerables", ("familia",)),
    ("superintendencia del mercado de valores", ("comercial",)),
    ("superintendencia de banca", ("comercial",)),
    ("gobiernos locales", ("municipal",)),
    ("gobiernos regionales", ("municipal",)),
]

POR_PALABRAS: list[tuple[str, tuple[str, ...]]] = [
    (
        r"codigo penal|procesal penal|delito|penitenciari|pena privativa|crimen organizado"
        r"|lavado de activos|extorsion|flagrancia",
        ("penal",),
    ),
    (
        r"codigo civil|procesal civil|arrendamiento|propiedad|sucesion|contrato|obligacion"
        r"|prescripcion adquisitiva|desalojo|conciliacion extrajudicial",
        ("civil",),
    ),
    (
        r"laboral|trabajador|remuneraci|gratificaci|\bcts\b|compensacion por tiempo de servicios"
        r"|jornada de trabajo|despido|sindica|negociacion colectiva|seguridad y salud en el trabajo"
        r"|planilla|regimen laboral",
        ("laboral",),
    ),
    (r"constituci|habeas|amparo|reforma constitucional", ("constitucional",)),
    (
        r"procedimiento administrativo|\blpag\b|sancionador|silencio administrativo|\btupa\b",
        ("administrativo",),
    ),
    (r"tribut|impuesto|\bigv\b|renta|aduan|arancel|\bitf\b", ("tributario",)),
    (
        r"alimentos|violencia contra las mujeres|integrantes del grupo familiar|adopcion"
        r"|nino|adolescente|divorcio|tenencia",
        ("familia",),
    ),
    (
        r"ley general de sociedades|societari|concursal|mercado de valores|titulos valores",
        ("comercial",),
    ),
    (r"registral|inscripci|notari", ("registral",)),
    (r"contrataciones del estado|ley 32069|licitacion|proveedores del estado", ("contrataciones",)),
    (
        r"ambiental|residuos solidos|emisiones|forestal|fauna silvestre|recursos hidricos",
        ("ambiental",),
    ),
    (r"consumidor|libre competencia|publicidad", ("consumidor",)),
]

_ACTO_DE_PERSONAL = re.compile(
    r"^(designan|dan por concluida|aceptan (la )?renuncia|encargan|autorizan viaje"
    r"|nombran|ratifican|delegan facultades)"
)


def clasificar(norma: Norma) -> list[str]:
    titulo = normalizar(f"{norma.titulo} {norma.sumilla or ''} {norma.numero or ''}")
    sector = normalizar(norma.sector)
    ramas: list[str] = []

    for patron, destino in POR_PALABRAS:
        if re.search(patron, titulo):
            ramas.extend(destino)

    if not ramas and _ACTO_DE_PERSONAL.search(normalizar(norma.titulo).strip()):
        return ["otros"]

    for fragmento, destino in POR_SECTOR:
        if fragmento in sector:
            ramas.extend(destino)

    unicas = list(dict.fromkeys(ramas))
    return unicas or ["otros"]
