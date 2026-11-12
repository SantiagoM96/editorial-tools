import { describe, expect, it } from 'vitest';
import { calculateEditorialLayout, fontFor, parseRich, wrappedLines } from './editorial-layout';

const fixedWidth = (_font: string, text: string) => text.length * 10;

describe('composición editorial pura', () => {
  it('interpreta marcas de destaque, itálica y tachado sin el DOM', () => {
    expect(parseRich('Hola *rojo* _italia_ ~fuera~')).toEqual([
      { text: 'Hola ', accent: false, italic: false, strike: false },
      { text: 'rojo', accent: true, italic: false, strike: false },
      { text: ' ', accent: false, italic: false, strike: false },
      { text: 'italia', accent: false, italic: true, strike: false },
      { text: ' ', accent: false, italic: false, strike: false },
      { text: 'fuera', accent: false, italic: false, strike: true },
    ]);
    expect(fontFor(64, { text: 'hola', accent: false, italic: true, strike: false }))
      .toBe('italic 700 64px Asap,Arial,sans-serif');
  });

  it('ajusta el texto a renglones y divide palabras excepcionalmente largas', () => {
    const lines = wrappedLines('Una muylargapalabra', 64, fixedWidth, 120, 20);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.flat().map(p => p.text).join('').replace(/\s/g, '')).toBe('Unamuylargapalabra');
    expect(lines.every(line => line.reduce((s, p) => s + p.width, 0) <= 80)).toBe(true);
    expect(wrappedLines(' ', 52, fixedWidth)).toEqual([]);
  });

  it('mantiene panel, barra, línea inferior y foto coherentes para variantes', () => {
    const cover = calculateEditorialLayout({
      headline: 'Texto de prueba', requestedSize: 64, forceUppercase: false,
      showStrap: true, variant: 'cover',
    }, fixedWidth);
    const interior = calculateEditorialLayout({
      headline: 'Texto de prueba', requestedSize: 52, forceUppercase: false,
      showStrap: false, variant: 'internal',
    }, fixedWidth);
    expect(cover.cover).toBe(true);
    expect(cover.barY).toBe(cover.panelTop - 34);
    expect(cover.imageBottom).toBe(cover.panelTop);
    expect(interior.cover).toBe(false);
    expect(interior.barY).toBe(interior.panelTop);
    expect(interior.imageBottom).toBe(interior.panelTop);
  });

  it('reduce la fuente solo cuando el texto excede la zona disponible', () => {
    const layout = calculateEditorialLayout({
      headline: 'a '.repeat(800), requestedSize: 94,
      forceUppercase: true, showStrap: true, variant: 'cover',
    }, fixedWidth);
    expect(layout.size).toBeLessThan(94);
    expect(layout.size).toBeGreaterThanOrEqual(32);
    expect(layout.baselines).toHaveLength(layout.lines.length);
  });
});
