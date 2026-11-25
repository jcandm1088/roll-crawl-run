import art from './growing-together.json';

/**
 * The approved logo artwork ("Growing Together", Concept 5) as SVG markup.
 * One source of truth (growing-together.json) is used for the in-app mark,
 * the icon generator, and the concept board.
 */
export type MarkColors = { background: string; primary: string; accent: string };

export function markShapes(colors: MarkColors): string {
  return art.shapes
    .map((s) => {
      const fill = colors[s.fill as keyof MarkColors];
      const stroke = 'stroke' in s && s.stroke ? ` stroke="${colors[s.stroke as keyof MarkColors]}" stroke-width="${s.strokeWidth}"${'strokeLinejoin' in s ? ` stroke-linejoin="${s.strokeLinejoin}"` : ''}` : '';
      return s.type === 'circle' ? `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" fill="${fill}"${stroke}/>` : `<path d="${s.d}" fill="${fill}"${stroke}/>`;
    })
    .join('');
}

export const BRAND_COLORS: MarkColors = art.brandColors;
export const MARK_RADIUS = art.cornerRadius;
