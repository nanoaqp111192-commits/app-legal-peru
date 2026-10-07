import { type ReactNode, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Boton } from '@/components/boton';
import { Chip } from '@/components/chip';
import { Pantalla } from '@/components/pantalla';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  ANIOS_CUBIERTOS,
  CALENDARIO_VERIFICADO_AL,
  FERIADOS,
  NO_LABORABLES,
} from '@/data/calendario';
import { type Forma, MATERIAS, PLAZOS, PLAZOS_VERIFICADOS_AL, type Plazo } from '@/data/plazos';
import { useTheme } from '@/hooks/use-theme';
import { copiar } from '@/lib/exportar';
import { fechaCorta, fechaLarga, hoyEnLima } from '@/lib/fechas';
import { tramos } from '@/lib/plantilla';
import {
  computar,
  estadoDelPlazo,
  type Estado,
  type Inhabiles,
  leerFecha,
  leerFechas,
  type Resultado,
} from '@/lib/plazos';

const FORMAS: Record<Forma, string> = {
  electronica: 'Casilla electrónica',
  fisica: 'Cédula o en persona',
  audiencia: 'En audiencia',
};

const ETIQUETA_FECHA: Record<Forma, string> = {
  electronica: 'Fecha de ingreso a la casilla',
  fisica: 'Fecha de notificación',
  audiencia: 'Fecha de la audiencia',
};

const FERIADOS_MAPA: Inhabiles = new Map(FERIADOS.map((f) => [f.fecha, f.motivo]));

export default function Plazos() {
  const tema = useTheme();
  const [materia, setMateria] = useState(MATERIAS[0].id);
  const delaMateria = PLAZOS.filter((p) => p.materia === materia);
  const [plazoId, setPlazoId] = useState(delaMateria[0].id);
  const plazo = PLAZOS.find((p) => p.id === plazoId) ?? delaMateria[0];
  const [formaElegida, setForma] = useState<Forma>('electronica');
  const forma = plazo.formas.includes(formaElegida) ? formaElegida : plazo.formas[0];
  const [fechaTexto, setFechaTexto] = useState('');
  const [extrasTexto, setExtrasTexto] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);

  const notificacion = leerFecha(fechaTexto);
  const extras = leerFechas(extrasTexto);

  const calculo = notificacion ? calcular(notificacion, forma, plazo, extras.validas) : null;

  const elegirMateria = (id: string) => {
    setMateria(id);
    setPlazoId(PLAZOS.find((p) => p.materia === id)!.id);
  };

  const copiarComputo = async () => {
    if (!calculo || !notificacion) return;
    await copiar(textoDelComputo(plazo, forma, notificacion, calculo.resultado, calculo.hoy));
    setAviso('Cómputo copiado');
    setTimeout(() => setAviso(null), 2500);
  };

  return (
    <Pantalla>
      <ThemedText type="subtitle">Calculadora de plazos</ThemedText>
      <ThemedText themeColor="textSecondary">
        Calcula el vencimiento en días hábiles, sin sábados, domingos ni feriados nacionales.
      </ThemedText>

      <Seccion titulo="Materia">
        <View style={styles.fila}>
          {MATERIAS.map((m) => (
            <Chip
              key={m.id}
              etiqueta={m.nombre}
              activo={m.id === materia}
              alPresionar={() => elegirMateria(m.id)}
            />
          ))}
        </View>
      </Seccion>

      <Seccion titulo="Acto">
        <View style={styles.fila}>
          {delaMateria.map((p) => (
            <Chip
              key={p.id}
              etiqueta={`${p.acto} · ${p.cantidad} ${p.unidad === 'meses' ? 'meses' : 'días'}`}
              activo={p.id === plazo.id}
              alPresionar={() => setPlazoId(p.id)}
            />
          ))}
        </View>
      </Seccion>

      {plazo.formas.length > 1 ? (
        <Seccion titulo="Cómo se notificó">
          <View style={styles.fila}>
            {plazo.formas.map((f) => (
              <Chip
                key={f}
                etiqueta={FORMAS[f]}
                activo={f === forma}
                alPresionar={() => setForma(f)}
              />
            ))}
          </View>
        </Seccion>
      ) : null}

      <Seccion titulo={ETIQUETA_FECHA[forma]}>
        <View style={styles.filaFecha}>
          <TextInput
            value={fechaTexto}
            onChangeText={setFechaTexto}
            placeholder="dd/mm/aaaa"
            placeholderTextColor={tema.textSecondary}
            inputMode="numeric"
            accessibilityLabel={ETIQUETA_FECHA[forma]}
            style={[styles.entrada, styles.entradaFecha, entradaColores(tema)]}
          />
          <Chip etiqueta="Hoy" alPresionar={() => setFechaTexto(fechaCorta(hoyEnLima()))} />
        </View>
        {fechaTexto && !notificacion ? (
          <ThemedText type="small" style={{ color: tema.vacio }}>
            Escribe la fecha como dd/mm/aaaa, por ejemplo 07/10/2026.
          </ThemedText>
        ) : null}
      </Seccion>

      <Seccion titulo="Otros días inhábiles (opcional)">
        <TextInput
          value={extrasTexto}
          onChangeText={setExtrasTexto}
          placeholder="Feriados locales, huelgas o suspensión del despacho: 15/10/2026, 16/10/2026"
          placeholderTextColor={tema.textSecondary}
          multiline
          accessibilityLabel="Otros días inhábiles"
          style={[styles.entrada, styles.entradaLarga, entradaColores(tema)]}
        />
        {extras.invalidas.length ? (
          <ThemedText type="small" style={{ color: tema.vacio }}>
            No entendí: {extras.invalidas.join(', ')}
          </ThemedText>
        ) : null}
      </Seccion>

      {calculo ? (
        <ThemedView type="backgroundElement" style={styles.caja}>
          <AvisoEstado estado={calculo.estado} />
          <ThemedText type="small" themeColor="textSecondary">
            Vence el
          </ThemedText>
          <ThemedText type="subtitle" style={styles.vencimiento}>
            {fechaLarga(calculo.resultado.vencimiento)}
          </ThemedText>
          <ThemedText type="small">
            {plazo.unidad === 'meses'
              ? `${plazo.cantidad} meses desde el ${fechaCorta(calculo.resultado.efecto)}.`
              : `${plazo.cantidad} días hábiles; el primero es el ${fechaCorta(calculo.resultado.inicio)}.`}
            {forma === 'electronica'
              ? ` La notificación surte efecto el ${fechaCorta(calculo.resultado.efecto)} (segundo día hábil tras el ingreso a la casilla).`
              : ''}
          </ThemedText>

          {calculo.alternativo ? (
            <ThemedView style={[styles.nota, { backgroundColor: tema.verificar }]}>
              <ThemedText type="small">
                Si el despacho no atendió{' '}
                {calculo.noLaborables
                  .map((d) => `el ${fechaCorta(d.fecha)} (día no laborable, ${d.fuente})`)
                  .join(' ni ')}
                , vencería el {fechaCorta(calculo.alternativo.vencimiento)}. Por precaución
                mostramos la fecha más temprana.
              </ThemedText>
            </ThemedView>
          ) : null}
          {calculo.fueraDeCalendario ? (
            <ThemedView style={[styles.nota, { backgroundColor: tema.verificar }]}>
              <ThemedText type="small">
                El calendario de feriados cubre {ANIOS_CUBIERTOS.join(' y ')}. Fuera de esos años
                solo se descuentan sábados, domingos y los días que indiques.
              </ThemedText>
            </ThemedView>
          ) : null}

          <ThemedText type="smallBold">Base legal</ThemedText>
          <ThemedText type="small">{plazo.base}</ThemedText>
          {plazo.nota ? <ConMarcas texto={plazo.nota} /> : null}

          <ThemedText type="smallBold">Día por día</ThemedText>
          {calculo.resultado.pasos.map((p) => (
            <ThemedText
              key={`${p.fecha}-${p.tipo}`}
              type="small"
              themeColor={p.tipo === 'computo' ? 'text' : 'textSecondary'}>
              {fechaCorta(p.fecha)}
              {'  '}
              {p.tipo === 'computo' && p.n ? `Día ${p.n}` : ''}
              {p.detalle ? `${p.tipo === 'computo' && p.n ? ' · ' : ''}${p.detalle}` : ''}
            </ThemedText>
          ))}

          <View style={styles.acciones}>
            <Boton etiqueta="Copiar cómputo" alPresionar={copiarComputo} />
          </View>
          {aviso ? (
            <ThemedText type="small" style={{ textAlign: 'center' }}>
              {aviso}
            </ThemedText>
          ) : null}
        </ThemedView>
      ) : null}

      <ThemedText type="small" themeColor="textSecondary">
        Cálculo referencial: verifica el plazo en el texto vigente antes de presentar. No incluye
        feriados regionales o locales, suspensiones de despacho ni el término de la distancia; los
        puedes agregar como otros días inhábiles. Las vacaciones judiciales de febrero no suspenden
        los plazos. Tabla de plazos revisada al {fechaCorta(PLAZOS_VERIFICADOS_AL)}; feriados al{' '}
        {fechaCorta(CALENDARIO_VERIFICADO_AL)}.
      </ThemedText>
    </Pantalla>
  );
}

function calcular(notificacion: string, forma: Forma, plazo: Plazo, extras: string[]) {
  const inhabiles: Inhabiles = new Map(FERIADOS_MAPA);
  for (const f of extras) inhabiles.set(f, 'Día inhábil indicado por ti');
  const entrada = { notificacion, forma, cantidad: plazo.cantidad, unidad: plazo.unidad };
  const resultado = computar({ ...entrada, inhabiles });

  // Los días no laborables del sector público solo cuentan si el despacho se acogió.
  // Por precaución se usa la fecha más temprana y se muestra la otra.
  const conNoLaborables: Inhabiles = new Map(inhabiles);
  for (const d of NO_LABORABLES) {
    if (!conNoLaborables.has(d.fecha)) conNoLaborables.set(d.fecha, d.motivo);
  }
  const alternativo = computar({ ...entrada, inhabiles: conNoLaborables });
  const noLaborables = NO_LABORABLES.filter(
    (d) => d.fecha > notificacion && d.fecha <= alternativo.vencimiento,
  );
  const hoy = hoyEnLima();
  return {
    resultado,
    alternativo: alternativo.vencimiento !== resultado.vencimiento ? alternativo : null,
    noLaborables,
    estado: estadoDelPlazo(hoy, resultado.vencimiento, inhabiles),
    hoy,
    fueraDeCalendario: [notificacion, resultado.vencimiento].some(
      (f) => !ANIOS_CUBIERTOS.includes(Number(f.slice(0, 4))),
    ),
  };
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={styles.seccion}>
      <ThemedText type="smallBold">{titulo}</ThemedText>
      {children}
    </View>
  );
}

function AvisoEstado({ estado }: { estado: Estado }) {
  const tema = useTheme();
  const urgente = estado.tipo !== 'vigente';
  const texto = {
    vencido: 'El plazo ya venció.',
    hoy: 'Vence hoy. Presenta cuanto antes.',
    manana: 'Vence el próximo día hábil. Conviene presentar hoy.',
    vigente:
      estado.tipo === 'vigente'
        ? `Quedan ${estado.habilesRestantes} días hábiles después de hoy.`
        : '',
  }[estado.tipo];
  return (
    <ThemedText
      type="smallBold"
      style={urgente ? { color: tema.vacio } : { color: tema.textSecondary }}>
      {texto}
    </ThemedText>
  );
}

function ConMarcas({ texto }: { texto: string }) {
  const tema = useTheme();
  return (
    <Text style={[styles.textoNota, { color: tema.text }]}>
      {tramos(texto, [], {}).map((t, i) => (
        <Text
          key={i}
          style={t.tipo === 'verificar' ? { backgroundColor: tema.verificar } : undefined}>
          {t.texto}
        </Text>
      ))}
    </Text>
  );
}

function entradaColores(tema: ReturnType<typeof useTheme>) {
  return { color: tema.text, borderColor: tema.border, backgroundColor: tema.background };
}

function textoDelComputo(
  plazo: Plazo,
  forma: Forma,
  notificacion: string,
  r: Resultado,
  hoy: string,
): string {
  const contados = r.pasos.filter((p) => p.tipo === 'computo' && p.n);
  const saltados = r.pasos.filter((p) => p.tipo === 'inhabil');
  return [
    `Cómputo de plazo: ${plazo.acto} (${plazo.cantidad} ${plazo.unidad === 'meses' ? 'meses' : 'días hábiles'})`,
    `Base legal: ${plazo.base}`,
    `${ETIQUETA_FECHA[forma]}: ${fechaCorta(notificacion)} (${FORMAS[forma].toLowerCase()})`,
    forma === 'electronica' ? `Surte efecto: ${fechaCorta(r.efecto)}` : null,
    contados.length
      ? `Días contados: ${contados.map((p) => `${p.n}) ${fechaCorta(p.fecha)}`).join(', ')}`
      : null,
    saltados.length
      ? `Días inhábiles: ${saltados.map((p) => `${fechaCorta(p.fecha)} (${p.detalle})`).join(', ')}`
      : null,
    `VENCE: ${fechaLarga(r.vencimiento)}`,
    `Calculado el ${fechaCorta(hoy)}. Referencial: verificar en el texto vigente.`,
  ]
    .filter(Boolean)
    .join('\n');
}

const styles = StyleSheet.create({
  seccion: { gap: Spacing.two },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  filaFecha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  entrada: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  entradaFecha: { width: 160 },
  entradaLarga: { minHeight: 72, textAlignVertical: 'top' },
  caja: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two },
  vencimiento: { fontSize: 24, lineHeight: 32 },
  nota: { padding: Spacing.two, borderRadius: Spacing.two },
  textoNota: { fontSize: 14, lineHeight: 20 },
  acciones: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.two },
});
