import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AvisoDemo, Cargando, MensajeError, Vacio } from '@/components/avisos';
import { Chip } from '@/components/chip';
import { Pantalla } from '@/components/pantalla';
import { SelectorRamas } from '@/components/selector-ramas';
import { TarjetaNorma } from '@/components/tarjeta-norma';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useCarga } from '@/hooks/use-carga';
import { normasDeFecha, ultimaFechaConNormas } from '@/lib/datos';
import { fechaLarga, hoyEnLima } from '@/lib/fechas';

export default function Hoy() {
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

  const visibles = (datos?.normas ?? []).filter(
    (n) =>
      (verDesignaciones || !(n.ramas.length === 1 && n.ramas[0] === 'otros')) &&
      (!ramas.length || n.ramas.some((r) => ramas.includes(r))),
  );
  const ocultas = (datos?.normas.length ?? 0) - visibles.length;

  return (
    <Pantalla refrescando={cargando && !!datos} alRefrescar={recargar}>
      <View style={styles.cabecera}>
        <ThemedText type="subtitle">Normas del día</ThemedText>
        {datos ? (
          <ThemedText themeColor="textSecondary">
            {datos.fecha === datos.hoy
              ? `Hoy, ${fechaLarga(datos.fecha)}`
              : `Última edición: ${fechaLarga(datos.fecha)}`}
          </ThemedText>
        ) : null}
      </View>
      <AvisoDemo />
      <SelectorRamas seleccion={ramas} alCambiar={setRamas} />
      <View style={styles.fila}>
        <Chip
          etiqueta={verDesignaciones ? 'Ocultar designaciones' : 'Ver designaciones y otros'}
          activo={verDesignaciones}
          alPresionar={() => setVerDesignaciones((v) => !v)}
        />
      </View>

      {cargando && !datos ? <Cargando /> : null}
      {error ? <MensajeError error={error} /> : null}
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
      {datos && ocultas > 0 ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.pie}>
          {ocultas} {ocultas === 1 ? 'norma oculta' : 'normas ocultas'} por los filtros.
        </ThemedText>
      ) : null}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  cabecera: { gap: Spacing.one },
  fila: { flexDirection: 'row' },
  pie: { textAlign: 'center' },
});
