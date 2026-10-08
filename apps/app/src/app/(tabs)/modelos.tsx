import { useState } from 'react';

import { Vacio } from '@/components/avisos';
import { Pantalla } from '@/components/pantalla';
import { Rejilla } from '@/components/rejilla';
import { SelectorRamas } from '@/components/selector-ramas';
import { Tarjeta } from '@/components/tarjeta';
import { ThemedText } from '@/components/themed-text';
import { listarModelos } from '@/lib/datos';
import { nombreRama } from '@/lib/ramas';

const TIPO = {
  judicial: 'Escrito judicial',
  fiscal: 'Ante Fiscalía',
  extrajudicial: 'Extrajudicial',
};

export default function Modelos() {
  const [ramas, setRamas] = useState<string[]>([]);
  const modelos = listarModelos().filter((m) => !ramas.length || ramas.includes(m.rama));

  return (
    <Pantalla>
      <ThemedText type="subtitle">Modelos de escritos</ThemedText>
      <ThemedText themeColor="textSecondary">
        Completa los datos y obtén el escrito listo para revisar, copiar o descargar.
      </ThemedText>
      <SelectorRamas seleccion={ramas} alCambiar={setRamas} />
      {!modelos.length ? <Vacio>Aún no hay modelos para esta rama.</Vacio> : null}
      <Rejilla>
        {modelos.map((m) => (
          <Tarjeta key={m.slug} href={{ pathname: '/modelo/[slug]', params: { slug: m.slug } }}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {nombreRama(m.rama)} · {TIPO[m.tipo]}
              {m.estado === 'borrador' ? ' · Borrador en revisión' : ''}
            </ThemedText>
            <ThemedText type="smallBold">{m.titulo}</ThemedText>
            <ThemedText type="small">{m.descripcion}</ThemedText>
          </Tarjeta>
        ))}
      </Rejilla>
    </Pantalla>
  );
}
