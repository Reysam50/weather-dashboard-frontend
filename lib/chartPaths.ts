export interface Point {
  x: number;
  y: number;
}

/** Maps a series of numbers onto an SVG viewBox, y-axis inverted (higher
 * value = smaller y, since SVG's origin is top-left). */
export function scaleSeries(
  values: number[],
  width: number,
  height: number,
  padY = 2
): Point[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const usableH = height - padY * 2;

  return values.map((v, i) => ({
    x: values.length === 1 ? width / 2 : (i / (values.length - 1)) * width,
    y: padY + usableH - ((v - min) / range) * usableH,
  }));
}

/** Catmull-Rom → cubic Bezier smoothing through the given points, same
 * technique the Stitch mockups' hand-drawn curves approximate visually. */
export function smoothLinePath(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/** Closes a line path down to the baseline, for a filled-area effect. */
export function areaPath(linePath: string, points: Point[], height: number): string {
  if (points.length === 0) return "";
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath} L ${last.x} ${height} L ${first.x} ${height} Z`;
}
