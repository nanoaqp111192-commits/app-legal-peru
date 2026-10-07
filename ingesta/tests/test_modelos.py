from ingesta import modelos


def test_todos_los_modelos_son_validos():
    lista = modelos.leer()
    assert len(lista) >= 10
    assert [e for m in lista for e in modelos.errores(m)] == []


def test_detecta_marcador_sin_campo():
    malo = {
        "slug": "x",
        "titulo": "t",
        "rama": "civil",
        "tipo": "judicial",
        "descripcion": "d",
        "campos": [{"clave": "a", "etiqueta": "A"}],
        "cuerpo": "{{a}} {{b}}",
    }
    assert modelos.errores(malo) == ["x: el cuerpo usa {{b}} pero no hay campo"]
