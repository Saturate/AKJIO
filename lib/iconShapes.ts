import { STRAINS } from "@/lib/strains";

// Shared by app/icon.tsx (SVG) and app/apple-icon.tsx (PNG) so every size draws the same mark.
const t = STRAINS.biolume.dark;
export const ICON_COLORS = { bg: t.bg, line: t.line, text: t.text, accent: t.accent, growth: t.growth } as const;

// Silkscreen-style "A" on a 5x6 grid (1 = filled), drawn as rects so no font is needed.
const A = ["01110", "10001", "10001", "11111", "10001", "10001"];
const A_RECTS: Array<{ x: number; y: number }> = A.flatMap((row, y) => [...row].flatMap((c, x) => (c === "1" ? [{ x, y }] : [])));

// In a 32-unit box.
const BOX = 32;
const CELL = 4;
const ORIGIN = { x: 6, y: 5 };
const SPORES = [
	{ cx: 26.5, cy: 7, r: 1.6, color: ICON_COLORS.accent },
	{ cx: 28.5, cy: 11.5, r: 0.9, color: ICON_COLORS.growth },
	{ cx: 28.5, cy: 25.5, r: 1.1, color: ICON_COLORS.accent },
];
// A short strand creeping along the bottom-left edge, ending in a knot.
const HYPHA = "M1.5 30.5 L4 30.2 L6.5 30.6 L9 30.1 L11 29.4";
const KNOT = { cx: 11.2, cy: 29.3, r: 0.9 };

export function iconSvg(): string {
	const rects = A_RECTS.map(({ x, y }) => `<rect x="${ORIGIN.x + x * CELL}" y="${ORIGIN.y + y * CELL}" width="${CELL}" height="${CELL}"/>`).join("");
	const spores = SPORES.map((s) => `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" fill="${s.color}"/>`).join("");
	return [
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BOX} ${BOX}">`,
		`<rect width="${BOX}" height="${BOX}" fill="${ICON_COLORS.bg}"/>`,
		`<rect x="0.5" y="0.5" width="${BOX - 1}" height="${BOX - 1}" fill="none" stroke="${ICON_COLORS.line}"/>`,
		`<g fill="${ICON_COLORS.text}" shape-rendering="crispEdges">${rects}</g>`,
		`<path d="${HYPHA}" fill="none" stroke="${ICON_COLORS.growth}" stroke-width="0.9" stroke-linecap="round"/>`,
		`<circle cx="${KNOT.cx}" cy="${KNOT.cy}" r="${KNOT.r}" fill="${ICON_COLORS.growth}"/>`,
		spores,
		`</svg>`,
	].join("");
}
