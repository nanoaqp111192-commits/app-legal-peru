"""Validación y carga de los modelos de escritos de ``contenido/modelos``."""

from __future__ import annotations

import json
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
CARPETA = RAIZ / "contenido" / "modelos"
RAMAS = {
    "civil",
    "penal",
    "laboral",
    "constitucional",
    "administrativo",
    "tributario",
    "familia",
    "comercial",
    "registral",
    "contrataciones",
    "ambiental",
    "consumidor",
    "municipal",
    "otros",
}
TIPOS_CAMPO = {"texto", "parrafo", "fecha"}
_MARCADOR = re.compile(r"\{\{\s*([a-z0-9_]+)\s*\}\}")


def leer(carpeta: Path = CARPETA) -> list[dict]:
    return [json.loads(p.read_text(encoding="utf-8")) for p in sorted(carpeta.glob("*.json"))]


def errores(modelo: dict) -> list[str]:
    slug = modelo.get("slug", "?")
    problemas = []
    for clave in ("slug", "titulo", "rama", "tipo", "descripcion", "campos", "cuerpo"):
        if not modelo.get(clave):
            problemas.append(f"{slug}: falta '{clave}'")
    if modelo.get("rama") not in RAMAS:
        problemas.append(f"{slug}: rama desconocida '{modelo.get('rama')}'")
    claves = [c.get("clave") for c in modelo.get("campos", [])]
    if len(claves) != len(set(claves)):
        problemas.append(f"{slug}: campos repetidos")
    for campo in modelo.get("campos", []):
        if campo.get("tipo", "texto") not in TIPOS_CAMPO:
            problemas.append(f"{slug}: tipo de campo inválido en '{campo.get('clave')}'")
    usados = set(_MARCADOR.findall(modelo.get("cuerpo", "")))
    for faltante in sorted(usados - set(claves)):
        problemas.append(f"{slug}: el cuerpo usa {{{{{faltante}}}}} pero no hay campo")
    for sobrante in sorted(set(claves) - usados):
        problemas.append(f"{slug}: el campo '{sobrante}' no se usa en el cuerpo")
    return problemas


def cargar(db, carpeta: Path = CARPETA) -> int:
    modelos = leer(carpeta)
    todos = [e for m in modelos for e in errores(m)]
    if todos:
        raise ValueError("Modelos inválidos:\n" + "\n".join(todos))
    db.upsert("modelos", modelos, conflicto="slug")
    return len(modelos)
