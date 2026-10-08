"""Uso:

    python -m ingesta diaria [--fecha AAAA-MM-DD] [--seco]
    python -m ingesta historico --desde AAAA-MM-DD [--hasta AAAA-MM-DD]
    python -m ingesta tc [--seco] [--maximo N]
    python -m ingesta modelos [--validar]

``diaria`` trae las normas del día de El Peruano, las clasifica, las guarda
y envía los avisos; también registra qué normas anteriores derogan o
modifican. ``historico`` hace lo mismo día por día hacia atrás, sin avisos
(sirve para cargar meses pasados). ``tc`` trae las resoluciones del último día publicado
por el Tribunal Constitucional (en seco, solo las 2 primeras: el TC pide 30
segundos entre pedidos). Con ``--seco`` solo imprimen lo que harían.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date, timedelta

from ingesta import alertas, modelos, vigencia
from ingesta.clasificador import clasificar
from ingesta.fuentes import el_peruano
from ingesta.fuentes import tribunal_constitucional as tc


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
    afectadas = vigencia.guardar(db, guardadas)
    enviados = alertas.procesar(db, guardadas)
    print(
        f"{len(guardadas)} normas guardadas, {afectadas} derogaciones o modificaciones "
        f"detectadas, {enviados} avisos enviados"
    )
    return 0


def historico(desde: date, hasta: date) -> int:
    """Carga día por día, sin avisos: los usuarios no esperan alertas de meses pasados."""
    from ingesta.supabase import Supabase

    db = Supabase()
    total = fallidos = 0
    dia = desde
    while dia <= hasta:
        try:
            normas = el_peruano.normas_del_dia(dia)
            for norma in normas:
                norma.ramas = clasificar(norma)
            guardadas = db.upsert(
                "normas", [n.como_fila() for n in normas], conflicto="fuente,id_fuente"
            )
            afectadas = vigencia.guardar(db, guardadas)
            total += len(guardadas)
            print(f"{dia.isoformat()}: {len(guardadas)} normas, {afectadas} afectaciones")
        except Exception as error:  # un día fallido no detiene el resto
            fallidos += 1
            print(f"{dia.isoformat()}: ERROR {error}")
        dia += timedelta(days=1)
    print(f"Total: {total} normas; {fallidos} días con error")
    return 1 if fallidos else 0


def tribunal(seco: bool, maximo: int | None) -> int:
    if seco:
        resoluciones = tc.resoluciones_del_dia(maximo=2 if maximo is None else maximo)
        print(f"{len(resoluciones)} resoluciones del TC revisadas")
        for r in resoluciones:
            fila = r.como_fila()
            fila["texto"] = len(r.texto or "")
            fila["sumilla"] = (r.sumilla or "")[:160]
            print(json.dumps({k: v for k, v in fila.items() if v}, ensure_ascii=False))
        return 0 if resoluciones else 2

    from ingesta.supabase import Supabase

    db = Supabase()
    desde = (el_peruano.hoy_en_lima() - timedelta(days=30)).isoformat()
    guardadas = db.leer(
        "jurisprudencia", select="expediente,fecha_publicacion", fecha_publicacion=f"gte.{desde}"
    )
    ya = {(g["expediente"], date.fromisoformat(g["fecha_publicacion"])) for g in guardadas}
    nuevas = tc.resoluciones_del_dia(ya, maximo)
    db.upsert("jurisprudencia", [r.como_fila() for r in nuevas], conflicto="fuente,id_fuente")
    print(f"{len(nuevas)} resoluciones nuevas del TC guardadas")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="ingesta")
    sub = parser.add_subparsers(dest="orden", required=True)
    p_diaria = sub.add_parser("diaria")
    p_diaria.add_argument("--fecha", type=date.fromisoformat, default=None)
    p_diaria.add_argument("--seco", action="store_true")
    p_hist = sub.add_parser("historico")
    p_hist.add_argument("--desde", type=date.fromisoformat, required=True)
    p_hist.add_argument("--hasta", type=date.fromisoformat, default=None)
    p_tc = sub.add_parser("tc")
    p_tc.add_argument("--seco", action="store_true")
    p_tc.add_argument("--maximo", type=int, default=None)
    p_modelos = sub.add_parser("modelos")
    p_modelos.add_argument("--validar", action="store_true")
    args = parser.parse_args(argv)

    if args.orden == "diaria":
        return diaria(args.fecha or el_peruano.hoy_en_lima(), args.seco)
    if args.orden == "historico":
        return historico(args.desde, args.hasta or el_peruano.hoy_en_lima())
    if args.orden == "tc":
        return tribunal(args.seco, args.maximo)

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
