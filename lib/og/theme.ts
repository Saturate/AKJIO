import { STRAINS } from "@/lib/strains";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export const OG_SCALE = 1;
export const OG_RENDER_WIDTH = OG_WIDTH * OG_SCALE;
export const OG_RENDER_HEIGHT = OG_HEIGHT * OG_SCALE;

// Biolume dark, same values the site renders.
const t = STRAINS.biolume.dark;
export const colors = {
	bg: t.bg,
	raised: t.raised,
	line: t.line,
	text: t.text,
	textMuted: t.muted,
	accent: t.accent,
	growth: t.growth,
	tagBg: "transparent",
	tagBorder: t.line,
} as const;
