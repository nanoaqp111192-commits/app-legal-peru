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


def test_dispositivo_real_lee_el_visor_sin_cabecera_ni_titulo_ajeno():
    ficha = parsear_dispositivo((FIXTURES / "dispositivo_real.html").read_text())
    assert ficha["titulo"].startswith("Ordenanza Distrital que aprueba la conformación")
    assert ficha["fecha_publicacion"] == date(2026, 10, 8)
    lineas = ficha["texto"].splitlines()
    assert lineas[0] == "ORDENANZA N° 014-2026-MDSMM"
    assert "OSINERGMIN" not in ficha["texto"]
    assert "Cuadernillo" not in ficha["texto"]
    assert any(linea.startswith("Artículo Noveno.- DEJAR SIN EFECTO") for linea in lineas)
    assert lineas[-1] == "Alcalde"


GUARDADO = """PDF
HTML
Cuadernillo
Fecha de publicación:
08/10/2026
Autorizan viaje de Especialista Técnico del OSINERGMIN a Chile
Ordenanza Distrital que aprueba el Comité, Instancia de Coordinación
ORDENANZA N° 014-2026-MDSMM
CONSIDERANDO:
Que, el artículo 194º de la Constitución;
Artículo Sexto
.-
CONSTITUIR al Jefe del Puesto de Salud.
Artículo Segundo.-
El desplazamiento no irrogará gasto.
Regístrese, comuníquese y cúmplase.
2557156-1"""


def test_limpiar_texto_guardado_repara_cabecera_y_negritas():
    from ingesta.fuentes.el_peruano import limpiar_texto_guardado

    titulo = "Ordenanza Distrital que aprueba el Comité Instancia de Coordinación"
    limpio = limpiar_texto_guardado(GUARDADO, titulo)
    assert limpio.splitlines() == [
        "ORDENANZA N° 014-2026-MDSMM",
        "CONSIDERANDO:",
        "Que, el artículo 194º de la Constitución;",
        "Artículo Sexto.- CONSTITUIR al Jefe del Puesto de Salud.",
        "Artículo Segundo.- El desplazamiento no irrogará gasto.",
        "Regístrese, comuníquese y cúmplase.",
    ]
    assert limpiar_texto_guardado(limpio, titulo) == limpio
    # Sin título también reconoce la cabecera.
    assert limpiar_texto_guardado(GUARDADO).splitlines()[0] == "ORDENANZA N° 014-2026-MDSMM"


def test_limpiar_texto_guardado_quita_la_sumilla_aunque_cambie_al_final():
    from ingesta.fuentes.el_peruano import limpiar_texto_guardado

    texto = (
        "Acceden a solicitud de extradición activa de ciudadano peruano, y otros\n"
        "RESOLUCIÓN SUPREMA\nNº 202-2026-JUS"
    )
    titulo = "Acceden a solicitud de extradición activa de ciudadano peruano para ser extraditado"
    assert limpiar_texto_guardado(texto, titulo).splitlines()[0] == "RESOLUCIÓN SUPREMA"


def test_listado_2016_a_2023_usa_enlaces_normaslegales():
    # Listado real de El Peruano del 02/01/2023 (formato de 2016 a 2023).
    normas = parsear_listado((FIXTURES / "listado_2023.html").read_text(), date(2023, 1, 2))
    assert len(normas) == 14
    rs = normas[0]
    assert rs.id_fuente == "NL/2139892-1"
    assert rs.url_oficial == "https://busquedas.elperuano.pe/dispositivo/NL/2139892-1"
    assert rs.sector == "PRESIDENCIA DEL CONSEJO DE MINISTROS"
    assert rs.numero == "RESOLUCION SUPREMA N° 001-2023-PCM"
    assert rs.edicion_extraordinaria
    assert not any(n.id_fuente.endswith("/pdf") for n in normas)


def test_dispositivo_solo_pdf_no_guarda_texto():
    html = (
        '<html><head><meta property="og:title" content="Aceptan renuncia - RESOLUCION - "/>'
        "</head><body><main>PDF Cuadernillo Fecha de publicación: 02/01/2020"
        " Cargando visor PDF...</main></body></html>"
    )
    ficha = parsear_dispositivo(html)
    assert ficha["texto"] is None
    assert ficha["fecha_publicacion"] == date(2020, 1, 2)
