import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';

export async function copiar(texto: string) {
  await Clipboard.setStringAsync(texto);
}

export async function compartir(titulo: string, texto: string) {
  await Share.share({ title: titulo, message: texto });
}

function escaparHtml(texto: string) {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Descarga el escrito como documento de Word (solo web). Usa HTML con el
 * formato habitual de los escritos: A4, Arial 12, interlineado 1.5, justificado.
 * Las marcas [[VERIFICAR]] salen resaltadas en amarillo.
 */
export function descargarWord(nombreArchivo: string, texto: string) {
  const parrafos = escaparHtml(texto)
    .split('\n')
    .map((linea) =>
      linea.trim()
        ? `<p>${linea.replace(/(\[\[VERIFICAR[^\]]*\]\])/g, '<span style="background:yellow">$1</span>')}</p>`
        : '<p>&nbsp;</p>',
    )
    .join('');
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>@page{size:21cm 29.7cm;margin:2.5cm}body{font-family:Arial;font-size:12pt}p{margin:0;line-height:150%;text-align:justify}</style></head><body>${parrafos}</body></html>`;
  const blob = new Blob(['﻿', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nombreArchivo}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}
