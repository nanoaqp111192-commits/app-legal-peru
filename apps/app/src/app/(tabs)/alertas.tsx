import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { Cargando, MensajeError, Vacio } from '@/components/avisos';
import { Boton } from '@/components/boton';
import { Pantalla } from '@/components/pantalla';
import { SelectorRamas } from '@/components/selector-ramas';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCarga } from '@/hooks/use-carga';
import { useTheme } from '@/hooks/use-theme';
import { borrarAlerta, guardarAlerta, listarAlertas } from '@/lib/datos';
import { activarAvisos } from '@/lib/notificaciones';
import { nombreRama } from '@/lib/ramas';
import { supabase } from '@/lib/supabase';
import type { Alerta } from '@/lib/tipos';

export default function Alertas() {
  const [sesion, setSesion] = useState<Session | null>(null);
  const [listo, setListo] = useState(!supabase);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session);
      setListo(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_evento, s) => setSesion(s));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <Pantalla>
      <ThemedText type="subtitle">Alertas</ThemedText>
      <ThemedText themeColor="textSecondary">
        Te avisamos cuando El Peruano publique una norma de tus ramas, de una entidad o con las
        palabras que elijas.
      </ThemedText>
      {!supabase ? (
        <Vacio>
          Las alertas necesitan el servidor conectado. En el modo demostración no están disponibles.
        </Vacio>
      ) : !listo ? (
        <Cargando />
      ) : sesion ? (
        <MisAlertas correo={sesion.user.email ?? ''} />
      ) : (
        <Ingreso />
      )}
    </Pantalla>
  );
}

function Ingreso() {
  const tema = useTheme();
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const pedirCodigo = async () => {
    setError(null);
    const { error } = await supabase!.auth.signInWithOtp({ email: correo.trim() });
    if (error) setError(error);
    else setEnviado(true);
  };
  const verificar = async () => {
    setError(null);
    const { error } = await supabase!.auth.verifyOtp({
      email: correo.trim(),
      token: codigo.trim(),
      type: 'email',
    });
    if (error) setError(error);
  };

  const estiloEntrada = [
    styles.entrada,
    { color: tema.text, borderColor: tema.border, backgroundColor: tema.backgroundElement },
  ];
  return (
    <ThemedView type="backgroundElement" style={[styles.caja, styles.ingreso]}>
      <ThemedText type="smallBold">Ingresa con tu correo</ThemedText>
      <ThemedText type="small">Te enviaremos un código; no necesitas contraseña.</ThemedText>
      <TextInput
        value={correo}
        onChangeText={setCorreo}
        placeholder="tu@correo.com"
        placeholderTextColor={tema.textSecondary}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        accessibilityLabel="Correo electrónico"
        style={estiloEntrada}
      />
      {enviado ? (
        <TextInput
          value={codigo}
          onChangeText={setCodigo}
          placeholder="Código recibido"
          placeholderTextColor={tema.textSecondary}
          keyboardType="number-pad"
          accessibilityLabel="Código de verificación"
          style={estiloEntrada}
        />
      ) : null}
      <Boton
        ancho
        etiqueta={enviado ? 'Ingresar' : 'Enviar código'}
        alPresionar={enviado ? verificar : pedirCodigo}
      />
      {error ? <MensajeError error={error} /> : null}
    </ThemedView>
  );
}

function MisAlertas({ correo }: { correo: string }) {
  const tema = useTheme();
  const { datos, error, cargando, recargar } = useCarga(listarAlertas);
  const [ramas, setRamas] = useState<string[]>([]);
  const [palabras, setPalabras] = useState('');
  const [sectores, setSectores] = useState('');
  const [estado, setEstado] = useState<string | null>(null);

  const lista = (t: string) =>
    t
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const crear = async () => {
    setEstado(null);
    if (!ramas.length && !lista(palabras).length && !lista(sectores).length) {
      setEstado('Elige al menos una rama, una palabra clave o una entidad.');
      return;
    }
    try {
      await guardarAlerta({
        nombre: ramas.map(nombreRama).concat(lista(palabras)).join(', ') || 'Mi alerta',
        ramas,
        palabras_clave: lista(palabras),
        sectores: lista(sectores),
        activa: true,
      });
      setRamas([]);
      setPalabras('');
      setSectores('');
      recargar();
    } catch (e) {
      setEstado(e instanceof Error ? e.message : String(e));
    }
  };

  const alternar = async (a: Alerta) => {
    await guardarAlerta({ ...a, activa: !a.activa });
    recargar();
  };

  const avisos = async () => {
    try {
      await activarAvisos();
      setEstado('Avisos activados en este dispositivo.');
    } catch (e) {
      setEstado(e instanceof Error ? e.message : String(e));
    }
  };

  const estiloEntrada = [
    styles.entrada,
    { color: tema.text, borderColor: tema.border, backgroundColor: tema.backgroundElement },
  ];
  return (
    <>
      <ThemedText type="small" themeColor="textSecondary">
        Sesión: {correo}
      </ThemedText>
      {process.env.EXPO_OS !== 'web' ? (
        <Boton etiqueta="Activar avisos en este teléfono" icono="alertas" alPresionar={avisos} />
      ) : null}

      <ThemedText type="smallBold">Mis alertas</ThemedText>
      {cargando && !datos ? <Cargando /> : null}
      {error ? <MensajeError error={error} /> : null}
      {datos && !datos.length ? <Vacio>Aún no tienes alertas.</Vacio> : null}
      {datos?.map((a) => (
        <ThemedView key={a.id} type="backgroundElement" style={[styles.caja, styles.fila]}>
          <View style={{ flex: 1, gap: Spacing.half }}>
            <ThemedText type="smallBold">{a.nombre}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {[
                a.ramas.length ? `Ramas: ${a.ramas.map(nombreRama).join(', ')}` : '',
                a.palabras_clave.length ? `Palabras: ${a.palabras_clave.join(', ')}` : '',
                a.sectores.length ? `Entidades: ${a.sectores.join(', ')}` : '',
              ]
                .filter(Boolean)
                .join(' · ')}
            </ThemedText>
            <Pressable
              onPress={async () => {
                await borrarAlerta(a.id);
                recargar();
              }}
              accessibilityRole="button">
              <ThemedText type="small" style={{ color: tema.vacio }}>
                Eliminar
              </ThemedText>
            </Pressable>
          </View>
          <Switch
            value={a.activa}
            onValueChange={() => alternar(a)}
            accessibilityLabel="Alerta activa"
          />
        </ThemedView>
      ))}

      <ThemedText type="smallBold">Nueva alerta</ThemedText>
      <ThemedText type="small">Ramas del derecho</ThemedText>
      <SelectorRamas seleccion={ramas} alCambiar={setRamas} titulo={null} />
      <ThemedText type="small">Palabras clave (separadas por comas, opcional)</ThemedText>
      <TextInput
        value={palabras}
        onChangeText={setPalabras}
        placeholder="desalojo, CTS, prisión preventiva"
        placeholderTextColor={tema.textSecondary}
        accessibilityLabel="Palabras clave"
        style={estiloEntrada}
      />
      <ThemedText type="small">Entidades (separadas por comas, opcional)</ThemedText>
      <TextInput
        value={sectores}
        onChangeText={setSectores}
        placeholder="SUNAFIL, Poder Judicial"
        placeholderTextColor={tema.textSecondary}
        accessibilityLabel="Entidades"
        style={estiloEntrada}
      />
      <ThemedText type="small" themeColor="textSecondary">
        Si llenas varios criterios, la norma debe cumplirlos todos.
      </ThemedText>
      <Boton etiqueta="Crear alerta" alPresionar={crear} />
      {estado ? <ThemedText type="small">{estado}</ThemedText> : null}
      <Pressable onPress={() => supabase!.auth.signOut()} accessibilityRole="button">
        <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
          Cerrar sesión
        </ThemedText>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  caja: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two },
  ingreso: { maxWidth: 520, gap: Spacing.three },
  fila: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  entrada: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
});
