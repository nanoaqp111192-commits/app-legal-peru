"""Cruce de normas nuevas con las alertas de los usuarios y envío de avisos push."""

from __future__ import annotations

from collections import defaultdict

import httpx

from ingesta.clasificador import normalizar

URL_EXPO_PUSH = "https://exp.host/--/api/v2/push/send"
LOTE_EXPO = 100  # máximo de mensajes por pedido que acepta Expo


def coincide(alerta: dict, norma: dict) -> bool:
    """Una alerta coincide si cumple TODOS los criterios que el usuario llenó."""
    ramas = set(norma.get("ramas") or [])
    if alerta.get("ramas") and not set(alerta["ramas"]) & ramas:
        return False
    # Los actos de personal (p. ej. nombramientos de fiscales, que también van a "penal")
    # solo avisan si la alerta pide además un sector o una palabra clave.
    if "personal" in ramas and not (alerta.get("sectores") or alerta.get("palabras_clave")):
        return False
    if alerta.get("sectores"):
        sector = normalizar(norma.get("sector"))
        if not any(normalizar(s) in sector for s in alerta["sectores"]):
            return False
    if alerta.get("palabras_clave"):
        texto = normalizar(
            " ".join(filter(None, [norma.get("titulo"), norma.get("sumilla"), norma.get("numero")]))
        )
        if not any(normalizar(p) in texto for p in alerta["palabras_clave"]):
            return False
    return True


def mensaje(token: str, normas: list[dict]) -> dict:
    if len(normas) == 1:
        n = normas[0]
        titulo = n.get("numero") or "Nueva norma"
        cuerpo = n["titulo"]
        datos = {"norma_id": n["id"]}
    else:
        titulo = f"{len(normas)} normas nuevas para tus alertas"
        cuerpo = "; ".join((n.get("numero") or n["titulo"]) for n in normas[:3])
        datos = {"ruta": "/"}
    return {"to": token, "title": titulo, "body": cuerpo[:180], "data": datos, "sound": "default"}


def planificar(alertas: list[dict], normas: list[dict], ya_enviados: set[tuple[int, int]]):
    """Agrupa por usuario las normas que le corresponden y que no se le avisaron."""
    por_usuario: dict[str, dict[int, dict]] = defaultdict(dict)
    envios: list[dict] = []
    for alerta in alertas:
        if not alerta.get("activa", True):
            continue
        for norma in normas:
            if (alerta["id"], norma["id"]) in ya_enviados or not coincide(alerta, norma):
                continue
            por_usuario[alerta["usuario_id"]][norma["id"]] = norma
            envios.append({"alerta_id": alerta["id"], "norma_id": norma["id"], "canal": "push"})
    return por_usuario, envios


def enviar_push(mensajes: list[dict], http: httpx.Client | None = None) -> None:
    propio = http is None
    http = http or httpx.Client(timeout=30)
    try:
        for i in range(0, len(mensajes), LOTE_EXPO):
            respuesta = http.post(URL_EXPO_PUSH, json=mensajes[i : i + LOTE_EXPO])
            respuesta.raise_for_status()
    finally:
        if propio:
            http.close()


def procesar(db, normas: list[dict], seco: bool = False) -> int:
    """Envía los avisos de ``normas`` (filas ya guardadas). Devuelve cuántos mensajes salen."""
    if not normas:
        return 0
    alertas = db.leer("alertas", activa="eq.true")
    if not alertas:
        return 0
    enviados = db.leer_en("envios", "norma_id", (n["id"] for n in normas))
    ya = {(e["alerta_id"], e["norma_id"]) for e in enviados}
    por_usuario, envios = planificar(alertas, normas, ya)
    dispositivos = db.leer_en("dispositivos", "usuario_id", por_usuario.keys())

    mensajes = []
    for d in dispositivos:
        normas_usuario = list(por_usuario[d["usuario_id"]].values())
        if normas_usuario:
            mensajes.append(mensaje(d["expo_push_token"], normas_usuario))

    if not seco:
        enviar_push(mensajes)
        db.insertar_ignorando_duplicados("envios", envios)
    return len(mensajes)
