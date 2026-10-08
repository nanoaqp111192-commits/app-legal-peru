from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import date

from ingesta.vigencia import clave_de


@dataclass
class Norma:
    """Una norma tal como la publica la fuente oficial."""

    id_fuente: str
    titulo: str
    fecha_publicacion: date
    url_oficial: str
    fuente: str = "el_peruano"
    tipo: str | None = None
    numero: str | None = None
    sumilla: str | None = None
    sector: str | None = None
    edicion_extraordinaria: bool = False
    url_pdf: str | None = None
    texto: str | None = None
    ramas: list[str] = field(default_factory=list)

    def como_fila(self) -> dict:
        fila = asdict(self)
        fila["fecha_publicacion"] = self.fecha_publicacion.isoformat()
        fila["clave"] = clave_de(self.numero)
        return fila
