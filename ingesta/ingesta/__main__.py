"""Uso:

    python -m ingesta diaria [--fecha AAAA-MM-DD] [--seco]
    python -m ingesta modelos [--validar]

``diaria`` trae las normas del día de El Peruano, las clasifica, las guarda
y envía los avisos. Con ``--seco`` solo imprime lo que haría.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date

from ingesta import alertas, modelos
from ingesta.clasificador import clasificar
from ingesta.fuentes import el_peruano


def diaria(fecha: date, seco: bool) -> int:
    normas = el_peruano.normas_del_dia(fecha, con_texto=not seco)
    for norma in normas:
        norma.ramas = clasificar(norma)
    print(f"{len(normas)} normas publicadas el {fecha.isoformat()}")
    if not normas:
        # El Peruano publica todos los días, también fines de semana: un día
        # vacío casi siempre significa que la fuente cambió de formato.
        print("AVISO: no se encontró ninguna norma; revisar el listado de El Peruano")
        return 2

    if seco:
        for norma in normas:
            print(
                json.dumps(
                    {k: norma.como_fila()[k] for k in ("numero", "sector", "titulo", "ramas")},
                    ensure_ascii=False,
                )
            )
        return 0

    from ingesta.supabase import Supabase

    db = Supabase()
    guardadas = db.upsert("normas", [n.como_fila() for n in normas], conflicto="fuente,id_fuente")
    enviados = alertas.procesar(db, guardadas)
    print(f"{len(guardadas)} normas guardadas, {enviados} avisos enviados")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="ingesta")
    sub = parser.add_subparsers(dest="orden", required=True)
    p_diaria = sub.add_parser("diaria")
    p_diaria.add_argument("--fecha", type=date.fromisoformat, default=None)
    p_diaria.add_argument("--seco", action="store_true")
    p_modelos = sub.add_parser("modelos")
    p_modelos.add_argument("--validar", action="store_true")
    args = parser.parse_args(argv)

    if args.orden == "diaria":
        return diaria(args.fecha or el_peruano.hoy_en_lima(), args.seco)

    problemas = [e for m in modelos.leer() for e in modelos.errores(m)]
    if problemas:
        print("\n".join(problemas), file=sys.stderr)
        return 1
    if args.validar:
        print(f"{len(modelos.leer())} modelos válidos")
        return 0
    from ingesta.supabase import Supabase

    print(f"{modelos.cargar(Supabase())} modelos cargados")
    return 0


if __name__ == "__main__":
    sys.exit(main())
