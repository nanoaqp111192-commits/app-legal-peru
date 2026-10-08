from ingesta.alertas import coincide, mensaje, planificar

LEY = {
    "id": 1,
    "titulo": "Ley que modifica el Código Penal",
    "numero": "LEY N° 32999",
    "sector": "CONGRESO DE LA REPUBLICA",
    "ramas": ["penal"],
}
DS = {
    "id": 2,
    "titulo": "Modifican el reglamento de jornada de trabajo",
    "numero": "DECRETO SUPREMO N° 010-2026-TR",
    "sector": "TRABAJO Y PROMOCION DEL EMPLEO",
    "ramas": ["laboral"],
}


def test_coincide_exige_todos_los_criterios_llenos():
    assert coincide({"ramas": ["penal"]}, LEY)
    assert not coincide({"ramas": ["laboral"]}, LEY)
    assert coincide({"ramas": ["penal"], "palabras_clave": ["codigo penal"]}, LEY)
    assert not coincide({"ramas": ["penal"], "palabras_clave": ["arrendamiento"]}, LEY)
    assert coincide({"sectores": ["Trabajo"]}, DS)
    assert coincide({"palabras_clave": ["JORNADA"]}, DS)


def test_actos_de_personal_solo_avisan_con_sector_o_palabra_clave():
    fiscal = {
        "id": 3,
        "titulo": "Nombran fiscal provincial provisional del Distrito Fiscal de Lima Sur",
        "sector": "MINISTERIO PUBLICO",
        "ramas": ["personal", "penal"],
    }
    assert not coincide({"ramas": ["penal"]}, fiscal)
    assert coincide({"ramas": ["penal"], "palabras_clave": ["Lima Sur"]}, fiscal)
    assert coincide({"sectores": ["Ministerio Publico"]}, fiscal)


def test_planificar_agrupa_por_usuario_y_omite_lo_ya_enviado():
    alertas = [
        {"id": 10, "usuario_id": "u1", "ramas": ["penal"], "activa": True},
        {"id": 11, "usuario_id": "u1", "ramas": ["laboral"], "activa": True},
        {"id": 12, "usuario_id": "u2", "ramas": ["penal"], "activa": False},
    ]
    por_usuario, envios = planificar(alertas, [LEY, DS], ya_enviados={(11, 2)})
    assert set(por_usuario) == {"u1"}
    assert set(por_usuario["u1"]) == {1}
    assert envios == [{"alerta_id": 10, "norma_id": 1, "canal": "push"}]


def test_mensaje_una_y_varias_normas():
    uno = mensaje("tok", [LEY])
    assert uno["title"] == "LEY N° 32999" and uno["data"] == {"norma_id": 1}
    varios = mensaje("tok", [LEY, DS])
    assert varios["title"] == "2 normas nuevas para tus alertas"
