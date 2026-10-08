import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AvisoDemo, Cargando, MensajeError, Vacio } from '@/components/avisos';
import { BotonEnlace } from '@/components/boton';
import { Interruptor } from '@/components/interruptor';
import { Pantalla } from '@/components/pantalla';
import { SelectorRamas } from '@/components/selector-ramas';
import { TarjetaCompilado } from '@/components/tarjeta-compilado';
import { TarjetaNorma } from '@/components/tarjeta-norma';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCarga } from '@/hooks/use-carga';
import { useEscritorio } from '@/hooks/use-escritorio';
import { cambiosRecientes } from '@/lib/compilados';
import { listarCompilados, normasDeFecha, ultimaFechaConNormas } from '@/lib/datos';
import { fechaLarga, hoyEnLima } from '@/lib/fechas';

export default function Hoy() {
  const escritorio = useEscritorio();
  const [ramas, setRamas] = useState<string[]>([]);
  const [verDesignaciones, setVerDesignaciones] = useState(false);

  const { datos, error, cargando, recargar } = useCarga(async () => {
    const hoy = hoyEnLima();
    let normas = await normasDeFecha(hoy);
    let fecha = hoy;
    // Temprano en la mañana aún no hay normas del día: se muestra la última edición.
    if (!normas.length) {
      const ultima = await ultimaFechaConNormas();
      if (ultima && ultima !== hoy) {
        fecha = ultima;
        normas = await normasDeFecha(ultima);
      }
    }
    return { fecha, hoy, normas };
  });

  // Aparte: si falla, las normas del día se muestran igual.
  const compilados = useCarga(async () => cambiosRecientes(await listarCompilados()));
  const recargarTodo = () => {
    recargar();
    compilados.recargar();
  };

  const visibles = (datos?.normas ?? []).filter(
    (n) =>
      (verDesignaciones || !(n.ramas.length === 1 && n.ramas[0] === 'otros')) &&
      (!ramas.length || n.ramas.some((r) => ramas.includes(r))),
  );
  const ocultas = (datos?.normas.length ?? 0) - visibles.length;

  const filtros = (
    <>
      <SelectorRamas seleccion={ramas} alCambiar={setRamas} />
      <Interruptor
        etiqueta="Incluir designaciones y otras normas sin rama"
        detalle="Nombramientos, encargos, viajes y similares"
        valor={verDesignaciones}
        alCambiar={setVerDesignaciones}
      />
    </>
  );

  const actualizados = compilados.datos?.length ? (
    <View style={styles.seccion}>
      <ThemedText type="smallBold">Textos actualizados que cambiaron esta semana</ThemedText>
      {compilados.datos.map((c) => (
        <TarjetaCompilado key={c.id} compilado={c} />
      ))}
    </View>
  ) : null;

  const lista = (
    <View style={styles.seccion}>
      {cargando && !datos ? <Cargando /> : null}
      {error ? <MensajeError error={error} /> : null}
      {datos ? (
        <ThemedText type="small" themeColor="textSecondary">
          {visibles.length} de {datos.normas.length} normas publicadas
          {ocultas > 0 ? ` (${ocultas} ocultas por los filtros)` : ''}
        </ThemedText>
      ) : null}
      {datos && !visibles.length ? (
        <Vacio>
          {datos.normas.length
            ? 'Ninguna norma coincide con el filtro.'
            : 'Aún no hay normas publicadas.'}
        </Vacio>
      ) : null}
      {visibles.map((n) => (
        <TarjetaNorma key={n.id} norma={n} />
      ))}
    </View>
  );

  return (
    <Pantalla refrescando={cargando && !!datos} alRefrescar={recargarTodo}>
      <View style={styles.cabecera}>
        <ThemedText type="subtitle">Normas del día</ThemedText>
        {datos ? (
          <ThemedText themeColor="textSecondary">
            {datos.fecha === datos.hoy
              ? `Diario oficial El Peruano de hoy, ${fechaLarga(datos.fecha)}`
              : `Última edición publicada: ${fechaLarga(datos.fecha)}`}
          </ThemedText>
        ) : null}
      </View>
      <AvisoDemo />

      {escritorio ? (
        <View style={styles.columnas}>
          <View style={styles.principal}>{lista}</View>
          <View style={styles.lateral}>
            <ThemedView type="backgroundElement" style={styles.panel}>
              {filtros}
            </ThemedView>
            {actualizados}
            <ThemedView type="backgroundElement" style={styles.panel}>
              <ThemedText type="smallBold">Herramientas</ThemedText>
              <BotonEnlace
                href="/plazos"
                icono="plazos"
                variante="secundario"
                etiqueta="Calcular un plazo"
              />
              <BotonEnlace
                href="/modelos"
                icono="modelos"
                variante="secundario"
                etiqueta="Redactar un escrito"
              />
            </ThemedView>
          </View>
        </View>
      ) : (
        <>
          {filtros}
          {actualizados}
          {lista}
        </>
      )}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  cabecera: { gap: Spacing.one },
  seccion: { gap: Spacing.three },
  columnas: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.five },
  principal: { flex: 1, minWidth: 0 },
  lateral: { width: 340, gap: Spacing.four },
  panel: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.three },
});
