from datetime import date

import pytest

from ingesta.clasificador import clasificar
from ingesta.norma import Norma


def norma(titulo, sector=None):
    return Norma(
        id_fuente="x",
        titulo=titulo,
        sector=sector,
        fecha_publicacion=date(2026, 10, 7),
        url_oficial="u",
    )


@pytest.mark.parametrize(
    "titulo, sector, esperado",
    [
        ("Ley que modifica el Código Penal sobre extorsión", "CONGRESO DE LA REPUBLICA", ["penal"]),
        (
            "Decreto Supremo que modifica el reglamento de la jornada de trabajo",
            "TRABAJO Y PROMOCION DEL EMPLEO",
            ["laboral"],
        ),
        ("Aprueban disposiciones sobre el pago de la CTS", None, ["laboral"]),
        ("Designan Director General de la Oficina de Administración", "EDUCACION", ["otros"]),
        ("Designan juez supernumerario", "PODER JUDICIAL", ["otros"]),
        ("Aprueban protocolo de notificaciones electrónicas", "PODER JUDICIAL", ["civil", "penal"]),
        ("Modifican el Código Procesal Civil en materia de desalojo", None, ["civil"]),
        (
            "Resolución de Superintendencia sobre el IGV",
            "SUPERINTENDENCIA NACIONAL DE ADUANAS Y DE ADMINISTRACION TRIBUTARIA",
            ["tributario"],
        ),
        ("Ordenanza que aprueba el TUPA", "GOBIERNOS LOCALES", ["administrativo", "municipal"]),
        ("Aprueban el plan operativo institucional", "CULTURA", ["otros"]),
        # Títulos reales del listado de El Peruano del 07/10/2026.
        ("Cesan por límite de edad a fiscal provincial titular", "MINISTERIO PUBLICO", ["otros"]),
        (
            "Dan por concluido el nombramiento de fiscal adjunto provincial provisional",
            "MINISTERIO PUBLICO",
            ["otros"],
        ),
        (
            "Declaran improcedente solicitud y cesan por límite de edad a fiscal superior",
            "MINISTERIO PUBLICO",
            ["otros"],
        ),
        ("Formalizan designación de Gerente General", "INDECOPI", ["otros"]),
        (
            "Designan fiscal titular en la Fiscalía Provincial Transitoria Especializada en"
            " Delitos de Lesiones y Agresiones en contra de las Mujeres e Integrantes del"
            " Grupo Familiar",
            "MINISTERIO PUBLICO",
            ["otros"],
        ),
        ("Conceden licencia con goce de haber a juez superior", "PODER JUDICIAL", ["otros"]),
        (
            "Autorizan funcionamiento de la Cooperativa de Ahorro y Crédito Central Sindical",
            "SUPERINTENDENCIA DE BANCA, SEGUROS Y AFP",
            ["comercial"],
        ),
        ("Aprueban el reglamento de libertad sindical", None, ["laboral"]),
        (
            "Ordenanza que regula el comercio ambulatorio",
            "MUNICIPALIDAD DE SAN BORJA",
            ["municipal"],
        ),
        ("Ordenanza regional sobre turismo", "GOBIERNO REGIONAL DE TUMBES", ["municipal"]),
        (
            "Aprueban el reglamento sancionador",
            "MUNICIPALIDAD DE LIMA",
            ["administrativo", "municipal"],
        ),
    ],
)
def test_clasificar(titulo, sector, esperado):
    assert clasificar(norma(titulo, sector)) == esperado
