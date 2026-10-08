"""Verificación mínima de vigencia: qué norma deroga o modifica a cuál.

Solo se lee el título (la sumilla oficial) de cada norma nueva, no su texto
completo, para evitar falsos positivos por menciones de paso. Se reconocen
tres efectos: ``deroga``, ``modifica`` (incluye incorporar artículos) y
``deja_sin_efecto``. Una derogación que nombra un artículo, numeral, literal
o anexo se marca como parcial.

La norma afectada se identifica por su ``clave``: tipo y número sin tildes,
p. ej. ``decreto supremo 004-2019-jus``. Si la referencia es al reglamento o
al TUO de una norma, la clave lleva ese prefijo para no marcar a la norma
principal. Es una detección automática: la app la presenta como indicio y
remite a la fuente oficial.
"""

from __future__ import annotations

import re
import unicodedata

TIPOS = [
    "ley organica",
    "ley",
    "decreto legislativo",
    "decreto ley",
    "decreto de urgencia",
    "decreto supremo",
    "decreto de alcaldia",
    "decreto regional",
    "resolucion legislativa",
    "resolucion suprema",
    "resolucion ministerial",
    "resolucion viceministerial",
    "resolucion directoral",
    "resolucion jefatural",
    "resolucion administrativa",
    "resolucion de superintendencia",
    "resolucion de consejo directivo",
    "resolucion de presidencia ejecutiva",
    "resolucion de presidencia",
    "resolucion de gerencia general",
    "resolucion de la contraloria",
    "resolucion",
    "ordenanza regional",
    "ordenanza",
    "acuerdo de concejo",
]

_TIPO = "|".join(re.escape(t).replace(r"\ ", r"\s+") for t in TIPOS)
_NUMERO = r"(?:n\s*[°º.o]?\s*|no\.?\s*|nro\.?\s*)?(\d[\w/-]*)"
_RE_REFERENCIA = re.compile(
    rf"(?P<prefijo>(?:reglamento|texto unico ordenado)\s+(?:de\s+(?:la|el)\s+)?)?"
    rf"\b(?P<tipo>{_TIPO})\s+{_NUMERO}",
)
_VERBOS = [
    ("deja_sin_efecto", re.compile(r"\bdej\w*\s+sin\s+efecto\b")),
    ("deroga", re.compile(r"\bderog\w*")),
    ("modifica", re.compile(r"\b(?:modific|incorpor|sustitu)\w*")),
]
_PARCIAL = re.compile(
    r"\b(?:articulos?|art\.|numerales?|literal(?:es)?|incisos?|parrafos?|"
    r"disposici\w+|anexos?|capitulos?|titulos?)\b"
)
# Códigos y leyes generales que los títulos suelen nombrar sin número.
CODIGOS = {
    "codigo procesal civil": "decreto legislativo 768",
    "codigo procesal penal": "decreto legislativo 957",
    "nuevo codigo procesal constitucional": "ley 31307",
    "codigo procesal constitucional": "ley 31307",
    "codigo penal militar policial": "decreto legislativo 1094",
    "codigo de ejecucion penal": "decreto legislativo 654",
    "codigo de responsabilidad penal de adolescentes": "decreto legislativo 1348",
    "codigo penal": "decreto legislativo 635",
    "codigo civil": "decreto legislativo 295",
    "codigo tributario": "tuo de decreto legislativo 816",
    "codigo de proteccion y defensa del consumidor": "ley 29571",
    "codigo de los ninos y adolescentes": "ley 27337",
    "nueva ley procesal del trabajo": "ley 29497",
    "ley del procedimiento administrativo general": "ley 27444",
    "ley de contrataciones del estado": "ley 30225",
    "ley general de contrataciones publicas": "ley 32069",
}
_RE_CODIGO = re.compile(r"\b(" + "|".join(re.escape(c) for c in CODIGOS) + r")\b")

# Un verbo afecta a las referencias que lo siguen hasta el siguiente verbo o
# hasta un "y/que/para" que abre otra idea ("... que modifica X y aprueba Y").
_CORTE = re.compile(r"\b(?:aprueb\w*|design\w*|autoriz\w*|encarg\w*|acept\w*|conform\w*)\b")


# Abreviaturas frecuentes en los números de los textos compilados de El Peruano.
_ABREVIATURAS = [
    (re.compile(r"\bd[.,]?\s*leg(?:islativo)?\b\.?"), "decreto legislativo"),
    (re.compile(r"\bd\.?\s*ley\b"), "decreto ley"),
    (re.compile(r"\bd\.?\s*s\b\.?"), "decreto supremo"),
    (re.compile(r"\bd\.?\s*u\b\.?"), "decreto de urgencia"),
    # "DECRETO SUPREMONº 005-2012-TR": el número viene pegado al tipo.
    (re.compile(r"([a-z])(n\s*[°º])"), r"\1 \2"),
]


def sin_tildes(texto: str) -> str:
    plano = unicodedata.normalize("NFD", texto)
    plano = "".join(c for c in plano if unicodedata.category(c) != "Mn")
    return " ".join(plano.lower().split())


def clave(tipo: str, numero: str, prefijo: str | None = None) -> str:
    base = f"{' '.join(tipo.split())} {numero.lower().strip('.-,;')}"
    if prefijo:
        base = f"{prefijo.split()[0]} de {base}" if prefijo.startswith("reg") else f"tuo de {base}"
    return base


def clave_de(numero: str | None) -> str | None:
    """La clave de una norma a partir de su número tal como lo publica El Peruano."""
    if not numero:
        return None
    m = _RE_REFERENCIA.search(sin_tildes(numero))
    return clave(m.group("tipo"), m.group(m.lastindex)) if m else None


def claves_en(texto: str) -> list[str]:
    """Claves de todas las normas que nombra un texto (sin repetir, en orden).

    Sirve para los textos compilados, cuyo campo de números mezcla abreviaturas
    ('D.S Nº 007-2013-JUS', 'D. LEG. N° 813') y cuyo título puede nombrar un código.
    """
    t = sin_tildes(texto)
    for patron, reemplazo in _ABREVIATURAS:
        t = patron.sub(reemplazo, t)
    encontradas = [
        clave(m.group("tipo"), m.group(m.lastindex), m.group("prefijo"))
        for m in _RE_REFERENCIA.finditer(t)
    ]
    for cod in _RE_CODIGO.finditer(t):
        if not re.search(r"reglamento\s+de(?:l)?\s*$", t[: cod.start()]):
            encontradas.append(CODIGOS[cod.group(1)])
    return list(dict.fromkeys(encontradas))


def afectaciones(titulo: str, propia: str | None = None) -> list[dict]:
    """Efectos que el título declara sobre otras normas, sin repetir."""
    t = sin_tildes(titulo)
    verbos = sorted(
        ((m.start(), m.end(), efecto) for efecto, rx in _VERBOS for m in rx.finditer(t)),
        key=lambda v: v[0],
    )
    resultado: dict[tuple[str, str], dict] = {}
    for i, (_inicio, fin, efecto) in enumerate(verbos):
        limite = verbos[i + 1][0] if i + 1 < len(verbos) else len(t)
        corte = _CORTE.search(t, fin, limite)
        tramo = t[fin : corte.start() if corte else limite]
        for ref in _RE_REFERENCIA.finditer(tramo):
            c = clave(ref.group("tipo"), ref.group(ref.lastindex), ref.group("prefijo"))
            if c == propia:
                continue
            _agregar(resultado, efecto, c, tramo, ref, titulo, t, fin)
        for cod in _RE_CODIGO.finditer(tramo):
            # "Reglamento del Código..." afecta al reglamento, no al código.
            if re.search(r"reglamento\s+de(?:l)?\s*$", tramo[: cod.start()]):
                continue
            _agregar(resultado, efecto, CODIGOS[cod.group(1)], tramo, cod, titulo, t, fin)
    return list(resultado.values())


def _agregar(resultado, efecto, c, tramo, ref, titulo, plano, desplazamiento) -> None:
    parcial = efecto == "modifica" or bool(_PARCIAL.search(tramo[: ref.start()]))
    texto = titulo_original(titulo, plano, desplazamiento + ref.start(), desplazamiento + ref.end())
    resultado.setdefault(
        (c, efecto),
        {"efecto": efecto, "parcial": parcial, "clave_afectada": c, "referencia": texto},
    )


def titulo_original(original: str, plano: str, inicio: int, fin: int) -> str:
    """Recorta del título original el tramo que corresponde a ``plano[inicio:fin]``.

    ``sin_tildes`` conserva la longitud salvo por espacios repetidos, así que se
    compara sobre el original con los espacios ya normalizados.
    """
    normal = " ".join(original.split())
    if len(normal) == len(plano):
        return normal[inicio:fin]
    return plano[inicio:fin]


def filas(guardadas: list[dict]) -> list[dict]:
    """Afectaciones de las normas ya guardadas (con su ``id``), listas para la base."""
    return [
        {"norma_id": n["id"], **a}
        for n in guardadas
        for a in afectaciones(n.get("titulo") or "", n.get("clave"))
    ]


def guardar(db, guardadas: list[dict]) -> int:
    nuevas = filas(guardadas)
    db.insertar_ignorando_duplicados(
        "afectaciones", nuevas, conflicto="norma_id,clave_afectada,efecto"
    )
    return len(nuevas)
