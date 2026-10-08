from ingesta.supabase import cabeceras


def test_clave_secreta_nueva_va_solo_en_apikey():
    assert cabeceras("sb_secret_abc") == {"apikey": "sb_secret_abc"}


def test_clave_service_role_antigua_va_tambien_como_bearer():
    jwt = "eyJhbGciOiJIUzI1NiJ9.e30.x"
    assert cabeceras(jwt) == {"apikey": jwt, "Authorization": f"Bearer {jwt}"}
