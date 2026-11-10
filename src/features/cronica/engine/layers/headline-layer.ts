import type { EditorialAlignment } from '../document-model';
import { CANVAS_WIDTH, CONTENT_EDGE, fontFor, type EditorialLine } from '../editorial-layout';
import { CRONICA_RED, CRONICA_BLACK } from '../canvas-tokens';

export function drawHeadlineLayer(
  ctx: CanvasRenderingContext2D,
  lines: readonly EditorialLine[],
  size: number,
  baselines: readonly number[],
  alignment: EditorialAlignment,
  canvasWidth = CANVAS_WIDTH,
  edge = CONTENT_EDGE,
): void {
  const centered = alignment === 'center';
  ctx.textBaseline = 'alphabetic';
  lines.forEach((line, i) => {
    const total = line.reduce((sum, part) => sum + part.width, 0);
    let x = centered ? (canvasWidth - total) / 2 : edge;
    for (const part of line) {
      ctx.font = fontFor(size, part);
      ctx.fillStyle = part.accent ? CRONICA_RED : CRONICA_BLACK;
      ctx.fillText(part.text, x, baselines[i]!);
      if (part.strike) {
        const y = baselines[i]! - size * .32;
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + part.width, y);
        ctx.stroke();
      }
      x += part.width;
    }
  });
}
