from ingesta.norma import Norma
from ingesta.vigencia import afectaciones, clave_de, filas


def efectos(titulo: str) -> set[tuple[str, str, bool]]:
    return {(a["efecto"], a["clave_afectada"], a["parcial"]) for a in afectaciones(titulo)}


def test_clave_de_una_norma_publicada():
    assert clave_de("DECRETO SUPREMO N° 004-2019-JUS") == "decreto supremo 004-2019-jus"
    assert clave_de("RESOLUCIÓN MINISTERIAL Nº 123-2026-MINSA") == (
        "resolucion ministerial 123-2026-minsa"
    )
    assert clave_de("LEY Nº 32999") == "ley 32999"
    assert clave_de(None) is None


def test_derogacion_total_y_modificacion_parcial_en_un_titulo():
    assert efectos(
        "Derogan la Ley N° 31188 y modifican el artículo 5 del Decreto Legislativo N° 1057"
    ) == {
        ("deroga", "ley 31188", False),
        ("modifica", "decreto legislativo 1057", True),
    }


def test_derogacion_de_un_articulo_es_parcial():
    assert efectos("Derogan el artículo 3 de la Resolución Directoral N° 0045-2026-MTC/16") == {
        ("deroga", "resolucion directoral 0045-2026-mtc/16", True)
    }


def test_deja_sin_efecto_y_lo_que_sigue_a_otro_verbo_no_cuenta():
    assert efectos(
        "Dejan sin efecto la Resolución Ministerial N° 123-2026-MINSA y designan "
        "a quien ocupó el cargo según la Resolución Ministerial N° 99-2025-MINSA"
    ) == {("deja_sin_efecto", "resolucion ministerial 123-2026-minsa", False)}


def test_el_reglamento_no_se_confunde_con_la_ley():
    assert ("modifica", "reglamento de ley 30225", True) in efectos(
        "Decreto Supremo que modifica el Reglamento de la Ley N° 30225"
    )


def test_codigos_nombrados_sin_numero():
    assert efectos("Ley que modifica el Código Penal y el Código Procesal Penal") == {
        ("modifica", "decreto legislativo 635", True),
        ("modifica", "decreto legislativo 957", True),
    }
    assert (
        efectos("Modifican el Reglamento del Código de Protección y Defensa del Consumidor")
        == set()
    )


def test_titulo_sin_efectos_y_la_norma_no_se_afecta_a_si_misma():
    assert afectaciones("Aprueban el Plan Nacional de Salud 2026") == []
    assert afectaciones("Modifican la Ley N° 32999", propia="ley 32999") == []


def test_filas_para_la_base_y_clave_en_la_norma():
    guardadas = [{"id": 7, "titulo": "Derogan la Ley N° 31188", "clave": "ley 32100"}]
    assert filas(guardadas) == [
        {
            "norma_id": 7,
            "efecto": "deroga",
            "parcial": False,
            "clave_afectada": "ley 31188",
            "referencia": "Ley N° 31188",
        }
    ]
    from datetime import date

    norma = Norma("NL/1-1", "t", date(2026, 10, 7), "https://x", numero="LEY N° 32100")
    assert norma.como_fila()["clave"] == "ley 32100"
