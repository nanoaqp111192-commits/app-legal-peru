import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState, useSyncExternalStore } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Vacio } from '@/components/avisos';
import { Pantalla } from '@/components/pantalla';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { cargarBorrador, guardarBorrador } from '@/lib/borradores';
import { listarModelos, obtenerModelo } from '@/lib/datos';
import { copiar, compartir, descargarWord } from '@/lib/exportar';
import { fechaCorta, hoyEnLima } from '@/lib/fechas';
import { camposFaltantes, contarVerificar, rellenar, tramos } from '@/lib/plantilla';
import type { CampoModelo } from '@/lib/tipos';

const sinSuscripcion = () => () => {};

// Genera una página estática por modelo en la web (indexable por buscadores).
export function generateStaticParams() {
  return listarModelos().map((m) => ({ slug: m.slug }));
}

export default function EditorModelo() {
  const tema = useTheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const modelo = obtenerModelo(slug);
  // Los borradores viven en el almacenamiento del dispositivo: se leen solo en el cliente para
  // que la página estática (web) coincida con la primera pintura.
  const enCliente = useSyncExternalStore(
    sinSuscripcion,
    () => true,
    () => false,
  );
  const guardados = useMemo(
    () => (modelo && enCliente ? valoresIniciales(modelo.slug, modelo.campos) : {}),
    [modelo, enCliente],
  );
  const [editados, setEditados] = useState<Record<string, string>>({});
  const valores = useMemo(() => ({ ...guardados, ...editados }), [guardados, editados]);
  const [aviso, setAviso] = useState<string | null>(null);

  const texto = useMemo(
    () => (modelo ? rellenar(modelo.cuerpo, modelo.campos, valores) : ''),
    [modelo, valores],
  );

  if (!modelo) return <Vacio>No encontramos este modelo.</Vacio>;

  const faltantes = camposFaltantes(modelo.campos, valores);
  const pendientes = contarVerificar(texto);

  const cambiar = (clave: string, valor: string) => {
    setEditados((e) => ({ ...e, [clave]: valor }));
    guardarBorrador(modelo.slug, { ...valores, [clave]: valor });
  };

  const confirmar = (accion: () => void) => {
    if (!faltantes.length) return accion();
    const mensaje = `Faltan ${faltantes.length} datos: ${faltantes.map((c) => c.etiqueta).join(', ')}.`;
    if (process.env.EXPO_OS === 'web') {
      if (window.confirm(`${mensaje} ¿Continuar de todos modos?`)) accion();
    } else {
      Alert.alert('Datos incompletos', mensaje, [
        { text: 'Seguir editando', style: 'cancel' },
        { text: 'Continuar', onPress: accion },
      ]);
    }
  };

  const avisar = (t: string) => {
    setAviso(t);
    setTimeout(() => setAviso(null), 2500);
  };

  return (
    <Pantalla conEncabezado>
      <Stack.Screen options={{ title: modelo.titulo }} />
      <ThemedText type="smallBold" style={styles.titulo}>
        {modelo.titulo}
      </ThemedText>
      <ThemedText type="small">{modelo.descripcion}</ThemedText>

      {modelo.estado === 'borrador' ? (
        <ThemedView style={[styles.caja, { backgroundColor: tema.verificar }]}>
          <ThemedText type="small">
            Borrador pendiente de revisión por un abogado. Verifica la base legal y los plazos
            vigentes antes de presentar el escrito.
          </ThemedText>
        </ThemedView>
      ) : null}

      <ThemedView type="backgroundElement" style={styles.caja}>
        <ThemedText type="smallBold">Base legal</ThemedText>
        {modelo.base_legal.map((b) => (
          <ThemedText key={b} type="small">
            • {b}
          </ThemedText>
        ))}
        {modelo.notas ? (
          <ThemedText type="small" themeColor="textSecondary">
            {modelo.notas}
          </ThemedText>
        ) : null}
      </ThemedView>

      <ThemedText type="smallBold">Datos del escrito</ThemedText>
      {modelo.campos.map((c) => (
        <Campo key={c.clave} campo={c} valor={valores[c.clave] ?? ''} alCambiar={cambiar} />
      ))}

      <ThemedText type="smallBold">Vista previa</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {faltantes.length
          ? `Faltan ${faltantes.length} datos (en rojo). `
          : 'Todos los datos obligatorios están completos. '}
        {pendientes ? `${pendientes} puntos por verificar (en amarillo).` : ''}
      </ThemedText>
      <ThemedView style={[styles.hoja, { borderColor: tema.border }]}>
        <Text selectable style={[styles.textoHoja, { color: tema.text }]}>
          {tramos(modelo.cuerpo, modelo.campos, valores).map((t, i) => (
            <Text
              key={i}
              style={
                t.tipo === 'vacio'
                  ? { color: tema.vacio, fontWeight: 700 }
                  : t.tipo === 'verificar'
                    ? { backgroundColor: tema.verificar }
                    : undefined
              }>
              {t.texto}
            </Text>
          ))}
        </Text>
      </ThemedView>

      <View style={styles.acciones}>
        <Boton
          etiqueta="Copiar texto"
          alPresionar={() =>
            confirmar(async () => {
              await copiar(texto);
              avisar('Texto copiado');
            })
          }
        />
        {process.env.EXPO_OS === 'web' ? (
          <Boton
            etiqueta="Descargar Word"
            alPresionar={() => confirmar(() => descargarWord(modelo.slug, texto))}
          />
        ) : (
          <Boton
            etiqueta="Compartir"
            alPresionar={() => confirmar(() => compartir(modelo.titulo, texto))}
          />
        )}
      </View>
      {aviso ? (
        <ThemedText type="small" style={{ textAlign: 'center' }}>
          {aviso}
        </ThemedText>
      ) : null}
    </Pantalla>
  );
}

function valoresIniciales(slug: string, campos: CampoModelo[]) {
  const guardados = cargarBorrador(slug);
  // La fecha del escrito se propone con la fecha de hoy en Lima.
  if (campos.some((c) => c.clave === 'fecha') && !guardados.fecha) {
    guardados.fecha = fechaCorta(hoyEnLima());
  }
  return guardados;
}

function Campo({
  campo,
  valor,
  alCambiar,
}: {
  campo: CampoModelo;
  valor: string;
  alCambiar: (clave: string, valor: string) => void;
}) {
  const tema = useTheme();
  const multilinea = campo.tipo === 'parrafo';
  return (
    <View style={styles.campo}>
      <ThemedText type="small">
        {campo.etiqueta}
        {campo.requerido ? '' : ' (opcional)'}
      </ThemedText>
      <TextInput
        value={valor}
        onChangeText={(v) => alCambiar(campo.clave, v)}
        placeholder={campo.tipo === 'fecha' ? 'dd/mm/aaaa' : campo.ayuda}
        placeholderTextColor={tema.textSecondary}
        multiline={multilinea}
        accessibilityLabel={campo.etiqueta}
        style={[
          styles.entrada,
          multilinea && styles.entradaLarga,
          { color: tema.text, borderColor: tema.border, backgroundColor: tema.backgroundElement },
        ]}
      />
      {campo.ayuda && campo.tipo !== 'fecha' && multilinea ? (
        <ThemedText type="small" themeColor="textSecondary">
          {campo.ayuda}
        </ThemedText>
      ) : null}
    </View>
  );
}

function Boton({ etiqueta, alPresionar }: { etiqueta: string; alPresionar: () => void }) {
  const tema = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={alPresionar}
      style={({ pressed }) => [
        styles.boton,
        { backgroundColor: tema.accent },
        pressed && { opacity: 0.8 },
      ]}>
      <ThemedText type="smallBold" style={{ color: tema.onAccent }}>
        {etiqueta}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 20, lineHeight: 28 },
  caja: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.one },
  campo: { gap: Spacing.one },
  entrada: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  entradaLarga: { minHeight: 120, textAlignVertical: 'top' },
  hoja: { borderWidth: 1, borderRadius: Spacing.two, padding: Spacing.four },
  textoHoja: { fontFamily: Fonts?.serif, fontSize: 15, lineHeight: 24 },
  acciones: { flexDirection: 'row', gap: Spacing.three, justifyContent: 'center' },
  boton: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
  },
});
