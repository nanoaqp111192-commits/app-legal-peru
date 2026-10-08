from ingesta.fuentes.compilados import Compilado, comparar, leer_lista

AHORA = "2026-10-08T12:00:00+00:00"


def c(id_fuente, titulo="LEY X"):
    return Compilado(id_fuente=id_fuente, titulo=titulo, numeros=None, materia="Laboral")


def guardado(id_fuente, hash_="a", activo=True):
    return {
        "id_fuente": id_fuente,
        "titulo": "LEY X",
        "numeros": None,
        "materia": "Laboral",
        "url_pdf": "u",
        "activo": activo,
        "hash": hash_,
        "bytes": 10,
        "verificado_en": "2026-10-07T12:00:00+00:00",
        "cambiado_en": None,
    }


def test_leer_lista_limpia_saltos_y_descarta_vacios():
    datos = [
        {
            "IdNorma": 120014,
            "Titulo": "LEY DE JUSTICIA DE PAZ ",
            "NroNorma": "LEY Nº 29824\r\nD.S Nº 007-2013-JUS",
            "Materia": "Judicial",
            "Portada": "xx",
        },
        {"IdNorma": 0, "Titulo": "sin id"},
        {"IdNorma": 5, "Titulo": "  "},
    ]
    [compilado] = leer_lista(datos)
    assert compilado.numeros == "LEY Nº 29824 D.S Nº 007-2013-JUS"
    assert compilado.titulo == "LEY DE JUSTICIA DE PAZ"
    assert compilado.url_pdf.endswith("obtenerDocumento?idNorma=120014")


def test_primera_carga_no_registra_cambios():
    filas, cambios = comparar([], [c(1), c(2)], {1: ("h1", 5), 2: ("h2", 6)}, AHORA)
    assert cambios == []
    assert [f["hash"] for f in filas] == ["h1", "h2"]
    assert all(f["cambiado_en"] is None for f in filas)


def test_detecta_pdf_modificado():
    filas, cambios = comparar([guardado(1, "a")], [c(1)], {1: ("b", 12)}, AHORA)
    assert cambios == [
        {
            "id_fuente": 1,
            "tipo": "modificado",
            "hash_anterior": "a",
            "hash_nuevo": "b",
            "bytes_anterior": 10,
            "bytes_nuevo": 12,
        }
    ]
    assert filas[0]["cambiado_en"] == AHORA


def test_sin_cambios_conserva_fechas():
    filas, cambios = comparar([guardado(1, "a")], [c(1)], {1: ("a", 10)}, AHORA)
    assert cambios == []
    assert filas[0]["verificado_en"] == AHORA and filas[0]["cambiado_en"] is None


def test_descarga_fallida_no_es_cambio():
    filas, cambios = comparar([guardado(1, "a")], [c(1)], {}, AHORA)
    assert cambios == []
    assert filas[0]["hash"] == "a" and filas[0]["verificado_en"].startswith("2026-10-07")


def test_nuevo_y_retirado():
    guardados = [guardado(1), guardado(2)]
    filas, cambios = comparar(guardados, [c(1), c(3)], {1: ("a", 10), 3: ("z", 1)}, AHORA)
    assert sorted((x["id_fuente"], x["tipo"]) for x in cambios) == [(2, "retirado"), (3, "nuevo")]
    retirado = next(f for f in filas if f["id_fuente"] == 2)
    assert retirado["activo"] is False


def test_lista_incompleta_no_retira():
    guardados = [guardado(i) for i in range(1, 11)]
    _, cambios = comparar(guardados, [c(1)], {1: ("a", 10)}, AHORA)
    assert cambios == []


def test_filas_tienen_las_mismas_columnas():
    filas, _ = comparar([guardado(1), guardado(2)], [c(1), c(3)], {}, AHORA)
    assert len({tuple(sorted(f)) for f in filas}) == 1
