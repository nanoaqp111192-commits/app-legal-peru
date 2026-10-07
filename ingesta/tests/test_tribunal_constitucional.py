from datetime import date
from pathlib import Path

import httpx

from ingesta.fuentes import tribunal_constitucional as tc

FIXTURES = Path(__file__).parent / "fixtures"


def leer(nombre: str) -> str:
    return (FIXTURES / nombre).read_text(encoding="utf-8")


def test_fecha_del_dia():
    assert tc.fecha_del_dia(leer("tc_dia.html")) == date(2026, 9, 30)


def test_parsear_dia():
    resoluciones = tc.parsear_dia(leer("tc_dia.html"))
    # La pestaña "Todos" repite las filas: solo se leen las de cada tipo.
    assert [(r.expediente, r.tipo) for r in resoluciones] == [
        ("05853-2025-AA", "sentencia"),
        ("05750-2025-HC", "sentencia"),
        ("04091-2022-HC", "sentencia"),
        ("04871-2025-AA", "auto"),
    ]
    amparo, hc, anonimo, auto = resoluciones
    assert amparo.colegiado == "SALA PRIMERA"
    assert amparo.demandante == "PROTEKTOR SEGURIDAD INTEGRAL SAC"
    assert amparo.demandado.startswith("ORGANISMO ESPECIALIZADO PARA LAS CONTRATACIONES")
    assert amparo.url_pdf == "https://www.tc.gob.pe/jurisprudencia/2026/05853-2025-AA.pdf"
    assert amparo.url_html == "https://www.tc.gob.pe/jurisprudencia/2026/05853-2025-AA.html"
    assert amparo.url_oficial.endswith("detalles-consulta?id_exp=499044")
    assert amparo.proceso == "Amparo" and hc.proceso == "Hábeas corpus"
    assert amparo.id_fuente == "2026/05853-2025-AA"
    # Sin enlace comentado: se resuelve después con la ficha del expediente.
    assert anonimo.url_pdf is None and anonimo.demandante == "NOMBRE ANONIMIZADO"
    assert auto.url_pdf == (
        "https://www.tc.gob.pe/jurisprudencia/2026/04871-2025-AA%20Desistimiento.pdf"
    )
    assert auto.id_fuente == "2026/04871-2025-AA Desistimiento"


def test_parsear_detalle():
    assert tc.parsear_detalle(leer("tc_detalle.html")) == [
        {
            "tipo": "Sentencia",
            "fecha": date(2026, 9, 30),
            "url_pdf": "https://www.tc.gob.pe/jurisprudencia/2026/05853-2025-AA.pdf",
            "url_html": "https://www.tc.gob.pe/jurisprudencia/2026/05853-2025-AA.html",
        }
    ]


def test_parsear_resolucion():
    datos = tc.parsear_resolucion(leer("tc_sentencia.html"))
    assert datos["numero"] == "Sentencia 1635/2026"
    assert datos["sumilla"].startswith(
        "Recurso de agravio constitucional interpuesto por la empresa"
    )
    assert "de setiembre de 2025, expedida" in datos["sumilla"]  # sin la llamada a nota "1"
    assert datos["fallo"] == "Declarar IMPROCEDENTE la demanda."
    assert "vía igualmente satisfactoria" in datos["texto"]
    assert "Foja 120" not in datos["texto"]  # sin notas al pie
    assert "12345678" not in datos["texto"] and "DNI N.° ********" in datos["texto"]


def test_ramas():
    resoluciones = tc.parsear_dia(leer("tc_dia.html"))
    assert tc.ramas(resoluciones[0]) == ["constitucional"]
    assert tc.ramas(resoluciones[1]) == ["constitucional", "penal"]


def test_resoluciones_del_dia_sin_red(monkeypatch):
    """Recorre el flujo completo con respuestas simuladas, sin pausa."""
    paginas = {
        tc.URL_DIA: leer("tc_dia.html"),
        "https://www.tc.gob.pe/jurisprudencia/2026/05853-2025-AA.html": leer("tc_sentencia.html"),
        "https://www.tc.gob.pe/consultas-de-causas/detalles-consulta?id_exp=470001": leer(
            "tc_detalle.html"
        ),
    }
    pedidas = []

    def responder(pedido: httpx.Request) -> httpx.Response:
        url = str(pedido.url)
        pedidas.append(url)
        return httpx.Response(200, text=paginas[url]) if url in paginas else httpx.Response(404)

    monkeypatch.setattr(tc, "PAUSA_ENTRE_PEDIDOS", 0)
    monkeypatch.setattr(
        tc, "cliente", lambda: httpx.Client(transport=httpx.MockTransport(responder))
    )
    ya = {("05750-2025-HC", date(2026, 9, 30))}
    resoluciones = tc.resoluciones_del_dia(ya_guardadas=ya)

    assert [r.expediente for r in resoluciones] == [
        "05853-2025-AA",
        "04091-2022-HC",
        "04871-2025-AA",
    ]
    amparo, anonimo, auto = resoluciones
    assert amparo.numero == "Sentencia 1635/2026" and amparo.texto
    assert anonimo.url_pdf.endswith("05853-2025-AA.pdf")  # tomado de la ficha (fixture)
    assert auto.url_html is None and auto.texto is None  # el HTML del auto no existe: 404
    assert not any("05750-2025-HC" in u for u in pedidas)  # ya guardada: no se pide


def test_lector_respeta_la_pausa(monkeypatch):
    esperas = []
    monkeypatch.setattr(tc.time, "sleep", esperas.append)
    http = httpx.Client(transport=httpx.MockTransport(lambda p: httpx.Response(200)))
    lector = tc.Lector(http, pausa=30)
    lector.get("https://x/1")
    lector.get("https://x/2")
    assert len(esperas) == 1 and 29 < esperas[0] <= 30


def test_asunto_con_numeral_o_sin_titulo():
    con_numeral = "<p><strong>I. ASUNTO</strong></p><p>Recurso de agravio interpuesto por X.</p>"
    assert tc.parsear_resolucion(con_numeral)["sumilla"] == "Recurso de agravio interpuesto por X."
    sin_titulo = (
        "<p>En Lima, a los 3 días...</p>"
        "<p>Recurso de agravio constitucional interpuesto por Y contra la resolución.</p>"
    )
    assert tc.parsear_resolucion(sin_titulo)["sumilla"].startswith(
        "Recurso de agravio constitucional"
    )
