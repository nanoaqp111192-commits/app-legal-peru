"""Acceso mínimo a Supabase por su API REST (PostgREST) con la clave service_role."""

from __future__ import annotations

import os
from collections.abc import Iterable

import httpx


def cabeceras(clave: str) -> dict[str, str]:
    """Las claves nuevas (sb_secret_...) no son JWT: van solo en `apikey`. La clave
    service_role antigua (un JWT) también va como Bearer."""
    if clave.startswith("eyJ"):
        return {"apikey": clave, "Authorization": f"Bearer {clave}"}
    return {"apikey": clave}


class Supabase:
    def __init__(self, url: str | None = None, clave: str | None = None):
        # Los secretos pegados a mano suelen traer espacios o saltos de línea.
        url = (url or os.environ.get("SUPABASE_URL") or "").strip()
        clave = (clave or os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
        if not url or not clave:
            raise RuntimeError("Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY")
        self.http = httpx.Client(
            base_url=f"{url.rstrip('/')}/rest/v1",
            headers=cabeceras(clave),
            timeout=60,
        )

    def upsert(self, tabla: str, filas: list[dict], conflicto: str) -> list[dict]:
        if not filas:
            return []
        respuesta = self.http.post(
            f"/{tabla}",
            params={"on_conflict": conflicto},
            json=filas,
            headers={"Prefer": "resolution=merge-duplicates,return=representation"},
        )
        respuesta.raise_for_status()
        return respuesta.json()

    def insertar_ignorando_duplicados(
        self, tabla: str, filas: list[dict], conflicto: str | None = None
    ) -> None:
        if not filas:
            return
        respuesta = self.http.post(
            f"/{tabla}",
            params={"on_conflict": conflicto} if conflicto else None,
            json=filas,
            headers={"Prefer": "resolution=ignore-duplicates,return=minimal"},
        )
        respuesta.raise_for_status()

    def leer(self, tabla: str, **filtros: str) -> list[dict]:
        respuesta = self.http.get(f"/{tabla}", params={"select": "*", **filtros})
        respuesta.raise_for_status()
        return respuesta.json()

    def leer_en(self, tabla: str, columna: str, valores: Iterable) -> list[dict]:
        valores = list(valores)
        if not valores:
            return []
        lista = ",".join(str(v) for v in valores)
        return self.leer(tabla, **{columna: f"in.({lista})"})
