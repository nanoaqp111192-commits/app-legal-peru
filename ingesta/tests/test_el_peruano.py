from datetime import date
from pathlib import Path

from ingesta.fuentes.el_peruano import parsear_dispositivo, parsear_listado, separar_titulo

FIXTURES = Path(__file__).parent / "fixtures"


def test_listado_extrae_cada_norma_una_vez():
    normas = parsear_listado((FIXTURES / "listado.html").read_text(), date(2026, 10, 7))
    assert [n.id_fuente for n in normas] == ["NL/9000001-1", "NL/9000002-1", "NL/9000003-1"]

    ds = normas[0]
    assert ds.sector == "TRABAJO Y PROMOCION DEL EMPLEO"
    assert ds.tipo == "DECRETO SUPREMO"
    assert ds.numero == "DECRETO SUPREMO N° 010-2026-TR"
    assert ds.titulo.startswith("Decreto Supremo que modifica el Reglamento")
    assert ds.fecha_publicacion == date(2026, 10, 7)
    assert ds.url_oficial == "https://busquedas.elperuano.pe/dispositivo/NL/9000001-1"
    assert ds.url_pdf.endswith("9000001-1.pdf")
    assert not ds.edicion_extraordinaria


def test_listado_detecta_fecha_propia_y_edicion_extraordinaria():
    ley = parsear_listado((FIXTURES / "listado.html").read_text(), date(2026, 10, 7))[2]
    assert ley.fecha_publicacion == date(2026, 10, 6)
    assert ley.edicion_extraordinaria
    assert ley.tipo == "LEY"


def test_listado_vacio():
    assert parsear_listado("<div>No se encontro información.</div>", date(2026, 10, 7)) == []


def test_separar_titulo():
    assert separar_titulo("RESOLUCIÓN  MINISTERIAL Nº 912-2026/MINSA") == (
        "RESOLUCIÓN MINISTERIAL",
        "RESOLUCIÓN MINISTERIAL Nº 912-2026/MINSA",
    )
    assert separar_titulo("Fe de erratas") == (None, None)


def test_dispositivo_extrae_titulo_fecha_y_texto_sin_menus():
    ficha = parsear_dispositivo((FIXTURES / "dispositivo.html").read_text())
    titulo = "Ley que modifica el Código Penal para sancionar la extorsión agravada"
    assert ficha["titulo"] == titulo
    assert ficha["fecha_publicacion"] == date(2026, 10, 6)
    assert "Artículo 1. Objeto" in ficha["texto"]
    assert "Buscador El Peruano" not in ficha["texto"]
    assert "var x" not in ficha["texto"]


def _cliente(respuestas):
    import httpx

    def manejar(request):
        r = respuestas.pop(0)
        if isinstance(r, Exception):
            raise r
        return httpx.Response(r, text="ok")

    return httpx.Client(transport=httpx.MockTransport(manejar))


def test_listado_reintenta_cortes_y_errores_del_servidor(monkeypatch):
    import httpx

    from ingesta.fuentes import el_peruano

    esperas = []
    monkeypatch.setattr(el_peruano.time, "sleep", esperas.append)
    corte = httpx.ConnectError("[SSL: UNEXPECTED_EOF_WHILE_READING]")
    http = _cliente([corte, 503, 200])
    assert el_peruano.pedir_listado(http, date(2026, 2, 5)) == "ok"
    assert esperas == list(el_peruano.ESPERAS_REINTENTO[:2])


def test_listado_se_rinde_tras_los_reintentos(monkeypatch):
    import httpx
    import pytest

    from ingesta.fuentes import el_peruano

    monkeypatch.setattr(el_peruano.time, "sleep", lambda _s: None)
    corte = httpx.ConnectError("corte")
    http = _cliente([corte] * (len(el_peruano.ESPERAS_REINTENTO) + 1))
    with pytest.raises(httpx.ConnectError):
        el_peruano.pedir_listado(http, date(2026, 2, 5))
