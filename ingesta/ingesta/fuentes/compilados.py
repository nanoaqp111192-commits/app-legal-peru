"""Normas actualizadas (textos compilados) del diario oficial El Peruano.

La sección https://diariooficial.elperuano.pe/Normas/normasactualizadas reúne
unas 150 normas de uso frecuente cuyo texto el diario mantiene al día con sus
modificaciones; la fecha de la última actualización figura solo en la portada
(una imagen). Por eso no se lee esa fecha: se guarda la huella SHA-256 de cada
PDF y se registra un cambio cuando la huella varía.

La lista sale de ``/Normas/consultarNormasActualizadas`` (JSON con IdNorma,
Titulo, NroNorma, Materia y la portada en base64, unos 40 MB en total) y cada
PDF de ``/Normas/obtenerDocumento?idNorma=N``. Validado el 08/10/2026 desde
GitHub Actions: ambas responden sin cookie y la huella de un mismo PDF es
estable entre descargas.
"""

from __future__ import annotations

import hashlib
import time
from dataclasses import dataclass

import httpx

from ingesta.fuentes.el_peruano import PAUSA_ENTRE_PEDIDOS

BASE = "https://diariooficial.elperuano.pe/Normas"
URL_LISTA = f"{BASE}/consultarNormasActualizadas"
URL_DOCUMENTO = f"{BASE}/obtenerDocumento?idNorma={{}}"
# Si la lista trae menos de esta fracción de los compilados vigentes, se asume
# una respuesta incompleta del diario y no se marca ninguno como retirado.
MINIMO_RAZONABLE = 0.5


def limpiar(texto: str | None) -> str | None:
    texto = " ".join((texto or "").split())
    return texto or None


@dataclass
class Compilado:
    id_fuente: int
    titulo: str
    numeros: str | None
    materia: str | None

    @property
    def url_pdf(self) -> str:
        return URL_DOCUMENTO.format(self.id_fuente)


def leer_lista(datos: list[dict]) -> list[Compilado]:
    vistos: dict[int, Compilado] = {}
    for d in datos:
        if not d.get("IdNorma") or not limpiar(d.get("Titulo")):
            continue
        vistos[int(d["IdNorma"])] = Compilado(
            id_fuente=int(d["IdNorma"]),
            titulo=limpiar(d["Titulo"]),
            numeros=limpiar(d.get("NroNorma")),
            materia=limpiar(d.get("Materia")),
        )
    return list(vistos.values())


def pedir_lista(http: httpx.Client) -> list[Compilado]:
    respuesta = http.get(
        URL_LISTA,
        params={"Titulo": "", "NroNorma": "", "PalabrasClave": "", "IdMateria": 0},
        headers={"X-Requested-With": "XMLHttpRequest"},
        timeout=180,
    )
    respuesta.raise_for_status()
    return leer_lista(respuesta.json())


def huella(http: httpx.Client, compilado: Compilado) -> tuple[str, int]:
    """SHA-256 y tamaño del PDF, leído por partes para no cargarlo entero."""
    sha = hashlib.sha256()
    total = 0
    with http.stream("GET", compilado.url_pdf, timeout=180) as respuesta:
        respuesta.raise_for_status()
        for parte in respuesta.iter_bytes():
            sha.update(parte)
            total += len(parte)
    if total == 0:
        raise ValueError("PDF vacío")
    return sha.hexdigest(), total


def huellas(http: httpx.Client, compilados: list[Compilado]) -> dict[int, tuple[str, int]]:
    """Huella de cada PDF; los que fallan quedan fuera (no se toman como cambio)."""
    resultado: dict[int, tuple[str, int]] = {}
    for c in compilados:
        try:
            resultado[c.id_fuente] = huella(http, c)
        except (httpx.HTTPError, ValueError) as error:
            print(f"{c.id_fuente} {c.titulo[:60]}: ERROR {error}")
        time.sleep(PAUSA_ENTRE_PEDIDOS)
    return resultado


def comparar(
    guardados: list[dict],
    actuales: list[Compilado],
    vistas: dict[int, tuple[str, int]],
    ahora: str,
) -> tuple[list[dict], list[dict]]:
    """Filas a guardar y cambios detectados (cada cambio lleva ``id_fuente``).

    En la primera carga (sin nada guardado) no se registran cambios: no se
    sabe cuándo se actualizó cada texto antes de empezar a vigilarlo.
    """
    previos = {g["id_fuente"]: g for g in guardados}
    primera_carga = not previos
    filas: list[dict] = []
    cambios: list[dict] = []
    for c in actuales:
        previo = previos.get(c.id_fuente) or {}
        hash_nuevo, bytes_nuevo = vistas.get(c.id_fuente, (None, None))
        fila = {
            "id_fuente": c.id_fuente,
            "titulo": c.titulo,
            "numeros": c.numeros,
            "materia": c.materia,
            "url_pdf": c.url_pdf,
            "activo": True,
            "hash": previo.get("hash"),
            "bytes": previo.get("bytes"),
            "verificado_en": previo.get("verificado_en"),
            "cambiado_en": previo.get("cambiado_en"),
        }
        if hash_nuevo:
            fila.update(hash=hash_nuevo, bytes=bytes_nuevo, verificado_en=ahora)
        tipo = None
        if not previo and not primera_carga:
            tipo = "nuevo"
        elif previo and not previo.get("activo", True):
            tipo = "nuevo"  # volvió a figurar en la lista
        elif hash_nuevo and previo.get("hash") and previo["hash"] != hash_nuevo:
            tipo = "modificado"
        if tipo:
            fila["cambiado_en"] = ahora
            cambios.append(
                {
                    "id_fuente": c.id_fuente,
                    "tipo": tipo,
                    "hash_anterior": previo.get("hash"),
                    "hash_nuevo": hash_nuevo,
                    "bytes_anterior": previo.get("bytes"),
                    "bytes_nuevo": bytes_nuevo,
                }
            )
        filas.append(fila)

    actuales_ids = {c.id_fuente for c in actuales}
    vigentes = [g for g in guardados if g.get("activo", True)]
    if len(actuales) >= MINIMO_RAZONABLE * len(vigentes):
        for g in vigentes:
            if g["id_fuente"] in actuales_ids:
                continue
            filas.append(
                {
                    **{k: g.get(k) for k in _COLUMNAS},
                    "activo": False,
                    "cambiado_en": ahora,
                }
            )
            cambios.append(
                {
                    "id_fuente": g["id_fuente"],
                    "tipo": "retirado",
                    "hash_anterior": g.get("hash"),
                    "hash_nuevo": None,
                    "bytes_anterior": g.get("bytes"),
                    "bytes_nuevo": None,
                }
            )
    return filas, cambios


_COLUMNAS = (
    "id_fuente",
    "titulo",
    "numeros",
    "materia",
    "url_pdf",
    "activo",
    "hash",
    "bytes",
    "verificado_en",
    "cambiado_en",
)
