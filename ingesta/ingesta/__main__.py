"""Uso:

    python -m ingesta diaria [--fecha AAAA-MM-DD] [--seco]
    python -m ingesta historico --desde AAAA-MM-DD [--hasta AAAA-MM-DD] [--solo-faltantes]
    python -m ingesta tc [--seco] [--maximo N]
    python -m ingesta modelos [--validar]
    python -m ingesta compilados [--seco]
    python -m ingesta reparar-textos [--seco]
    python -m ingesta reclasificar [--seco]

``diaria`` trae las normas del día de El Peruano, las clasifica, las guarda
y envía los avisos; también registra qué normas anteriores derogan o
modifican. ``historico`` hace lo mismo día por día hacia atrás, sin avisos
(sirve para cargar meses pasados). ``tc`` trae las resoluciones del último día publicado
por el Tribunal Constitucional (en seco, solo las 2 primeras: el TC pide 30
segundos entre pedidos). ``compilados`` revisa si cambió algún PDF de las
"Normas actualizadas" de El Peruano (en seco, lista y calcula la huella de 2).
``reparar-textos`` limpia el texto de las normas guardadas antes de leer el
visor de la ficha (menús de la página y negritas partidas en varias líneas).
Con ``--seco`` solo imprimen lo que harían.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import UTC, date, datetime, timedelta

import httpx

from ingesta import alertas, modelos, vigencia
from ingesta.clasificador import clasificar
from ingesta.fuentes import compilados as fuente_compilados
from ingesta.fuentes import el_peruano
from ingesta.fuentes import tribunal_constitucional as tc
from ingesta.norma import Norma

PAUSA_ANTES_DE_REINTENTAR = 300  # segundos


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


def historico(desde: date, hasta: date, solo_faltantes: bool = False) -> int:
    """Carga día por día, sin avisos: los usuarios no esperan alertas de meses pasados.

    Con ``solo_faltantes`` salta los días que ya tienen normas guardadas. Los días
    que fallan se reintentan una vez al final, tras una pausa."""
    from ingesta.supabase import Supabase

    db = Supabase()
    total = 0
    pendientes = []
    dia = desde
    while dia <= hasta:
        if not (
            solo_faltantes
            and db.leer("normas", select="id", fecha_publicacion=f"eq.{dia}", limit="1")
        ):
            pendientes.append(dia)
        dia += timedelta(days=1)
    print(f"{len(pendientes)} días por cargar")

    fallidos: list[date] = []
    for ronda in (1, 2):
        if ronda == 2:
            if not fallidos:
                break
            print(f"Reintentando {len(fallidos)} días con error tras una pausa")
            time.sleep(PAUSA_ANTES_DE_REINTENTAR)
            pendientes, fallidos = fallidos, []
        for dia in pendientes:
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
                fallidos.append(dia)
                print(f"{dia.isoformat()}: ERROR {error}")
    print(f"Total: {total} normas; {len(fallidos)} días con error")
    for dia in fallidos:
        print(f"  sin cargar: {dia.isoformat()}")
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


def compilados(seco: bool) -> int:
    with el_peruano.cliente() as http:
        actuales = fuente_compilados.pedir_lista(http)
        print(f"{len(actuales)} normas actualizadas en la lista de El Peruano")
        if not actuales:
            print("AVISO: la lista llegó vacía; revisar la sección Normas actualizadas")
            return 2
        if seco:
            for c, (sha, peso) in fuente_compilados.huellas(http, actuales[:2]).items():
                print(f"{c}: {peso} bytes, sha256 {sha[:16]}…")
            for c in actuales[:5]:
                print(json.dumps(c.__dict__, ensure_ascii=False))
            return 0

        from ingesta.supabase import Supabase

        db = Supabase()
        guardados = db.leer("compilados")
        vigentes = sum(1 for g in guardados if g.get("activo", True))
        if len(actuales) < fuente_compilados.MINIMO_RAZONABLE * vigentes:
            print(f"AVISO: la lista trae {len(actuales)} de {vigentes}; no se toca nada")
            return 2
        vistas = fuente_compilados.huellas(http, actuales)

    ahora = datetime.now(UTC).isoformat()
    filas, cambios = fuente_compilados.comparar(guardados, actuales, vistas, ahora)
    ids = {f["id_fuente"]: f["id"] for f in db.upsert("compilados", filas, conflicto="id_fuente")}
    db.insertar_ignorando_duplicados(
        "compilados_cambios",
        [
            {
                "compilado_id": ids[c["id_fuente"]],
                **{k: v for k, v in c.items() if k != "id_fuente"},
            }
            for c in cambios
        ],
    )
    titulos = {f["id_fuente"]: f["titulo"] for f in filas}
    for c in cambios:
        print(f"{c['tipo']}: {titulos[c['id_fuente']][:90]}")
    fallidos = len(actuales) - len(vistas)
    print(
        f"{len(vistas)} PDF revisados, {len(cambios)} cambios registrados, "
        f"{fallidos} sin poder descargar"
    )
    return 1 if fallidos > len(actuales) // 10 else 0


def reparar_textos(seco: bool, lote: int = 500) -> int:
    from ingesta.supabase import Supabase

    db = Supabase()
    ultimo, revisadas, reparadas = 0, 0, 0
    fallidas: list[int] = []
    while True:
        filas = db.leer(
            "normas",
            select="id,titulo,texto",
            texto="not.is.null",
            id=f"gt.{ultimo}",
            order="id",
            limit=str(lote),
        )
        if not filas:
            break
        for fila in filas:
            limpio = el_peruano.limpiar_texto_guardado(fila["texto"], fila["titulo"])
            if limpio != fila["texto"]:
                reparadas += 1
                if seco and reparadas <= 2:
                    print(f"--- norma {fila['id']}\n{limpio[:600]}\n")
                if not seco:
                    try:
                        db.actualizar("normas", {"texto": limpio}, id=f"eq.{fila['id']}")
                    except httpx.HTTPStatusError as error:
                        # Una norma que no se pueda guardar no detiene el resto.
                        fallidas.append(fila["id"])
                        print(f"norma {fila['id']}: {error.response.text[:300]}")
        revisadas += len(filas)
        ultimo = filas[-1]["id"]
        print(f"{revisadas} revisadas, {reparadas} {'por reparar' if seco else 'reparadas'}")
    if fallidas:
        print(f"{len(fallidas)} sin guardar: {fallidas[:50]}")
    return 1 if fallidas else 0


def reclasificar(seco: bool, lote: int = 1000) -> int:
    """Vuelve a clasificar las normas guardadas con las reglas actuales del clasificador."""
    from collections import Counter

    from ingesta.supabase import Supabase

    db = Supabase()
    ultimo, revisadas = 0, 0
    cambios: Counter[str] = Counter()
    fallidas: list[int] = []
    while True:
        filas = db.leer(
            "normas",
            select="id,titulo,sumilla,numero,sector,fecha_publicacion,url_oficial,id_fuente,ramas",
            id=f"gt.{ultimo}",
            order="id",
            limit=str(lote),
        )
        if not filas:
            break
        for fila in filas:
            norma = Norma(
                id_fuente=fila["id_fuente"],
                titulo=fila["titulo"],
                sumilla=fila["sumilla"],
                numero=fila["numero"],
                sector=fila["sector"],
                fecha_publicacion=date.fromisoformat(fila["fecha_publicacion"]),
                url_oficial=fila["url_oficial"],
            )
            ramas = clasificar(norma)
            if ramas == fila["ramas"]:
                continue
            cambios[f"{'+'.join(fila['ramas']) or '-'} -> {'+'.join(ramas)}"] += 1
            if not seco:
                try:
                    db.actualizar("normas", {"ramas": ramas}, id=f"eq.{fila['id']}")
                except httpx.HTTPStatusError as error:
                    fallidas.append(fila["id"])
                    print(f"norma {fila['id']}: {error.response.text[:300]}")
        revisadas += len(filas)
        ultimo = filas[-1]["id"]
        print(f"{revisadas} revisadas, {sum(cambios.values())} con ramas nuevas")
    for cambio, cantidad in cambios.most_common(25):
        print(f"{cantidad:6d}  {cambio}")
    if fallidas:
        print(f"{len(fallidas)} sin guardar: {fallidas[:50]}")
    return 1 if fallidas else 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="ingesta")
    sub = parser.add_subparsers(dest="orden", required=True)
    p_diaria = sub.add_parser("diaria")
    p_diaria.add_argument("--fecha", type=date.fromisoformat, default=None)
    p_diaria.add_argument("--seco", action="store_true")
    p_hist = sub.add_parser("historico")
    p_hist.add_argument("--desde", type=date.fromisoformat, required=True)
    p_hist.add_argument("--hasta", type=date.fromisoformat, default=None)
    p_hist.add_argument("--solo-faltantes", action="store_true")
    p_tc = sub.add_parser("tc")
    p_tc.add_argument("--seco", action="store_true")
    p_tc.add_argument("--maximo", type=int, default=None)
    p_comp = sub.add_parser("compilados")
    p_comp.add_argument("--seco", action="store_true")
    p_reparar = sub.add_parser("reparar-textos")
    p_reparar.add_argument("--seco", action="store_true")
    p_reclasificar = sub.add_parser("reclasificar")
    p_reclasificar.add_argument("--seco", action="store_true")
    p_modelos = sub.add_parser("modelos")
    p_modelos.add_argument("--validar", action="store_true")
    args = parser.parse_args(argv)

    if args.orden == "diaria":
        return diaria(args.fecha or el_peruano.hoy_en_lima(), args.seco)
    if args.orden == "historico":
        return historico(args.desde, args.hasta or el_peruano.hoy_en_lima(), args.solo_faltantes)
    if args.orden == "tc":
        return tribunal(args.seco, args.maximo)
    if args.orden == "compilados":
        return compilados(args.seco)
    if args.orden == "reparar-textos":
        return reparar_textos(args.seco)
    if args.orden == "reclasificar":
        return reclasificar(args.seco)

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
