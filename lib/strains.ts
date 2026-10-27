export const STRAIN_KEYS = ["biolume", "spore", "swatch", "broccoli", "lichen"] as const;
export type StrainKey = (typeof STRAIN_KEYS)[number];
export type Mode = "light" | "dark";

export type Tokens = {
	bg: string;
	raised: string;
	line: string;
	text: string;
	muted: string;
	accent: string;
	growth: string;
	tip: string;
	glitchA: string;
	glitchB: string;
};

export type Strain = { name: string; dark: Tokens; light: Tokens };

export const DEFAULT_STRAIN: StrainKey = "biolume";

export const STRAINS: Record<StrainKey, Strain> = {
	biolume: {
		name: "Biolume",
		dark: { bg: "#07060f", raised: "#0f0d1d", line: "#29243f", text: "#ece8ff", muted: "#8f89ad", accent: "#5cffb0", growth: "#6b4cff", tip: "#5cffb0", glitchA: "#ff3ea5", glitchB: "#3effe0" },
		light: { bg: "#f4f2fb", raised: "#ebe7f7", line: "#d3cde8", text: "#120f24", muted: "#55507a", accent: "#00744f", growth: "#4b3aa8", tip: "#00744f", glitchA: "#ff3ea5", glitchB: "#00a0a0" },
	},
	spore: {
		name: "Spore",
		dark: { bg: "#140c2a", raised: "#1c1436", line: "#3d3651", text: "#e6ecdc", muted: "#94a8a6", accent: "#b6f23a", growth: "#829b9b", tip: "#d9ff6a", glitchA: "#8d6b7f", glitchB: "#b6f23a" },
		light: { bg: "#eef2e6", raised: "#e3e9d8", line: "#c4cbb8", text: "#140c2a", muted: "#565068", accent: "#3f6b00", growth: "#5d6f6f", tip: "#8d6b7f", glitchA: "#8d6b7f", glitchB: "#3f6b00" },
	},
	swatch: {
		name: "Swatch",
		dark: { bg: "#140c2a", raised: "#1c1436", line: "#3d3651", text: "#e3e8dc", muted: "#829b9b", accent: "#c4dab2", growth: "#8d6b7f", tip: "#c4dab2", glitchA: "#8d6b7f", glitchB: "#829b9b" },
		light: { bg: "#f1f4ec", raised: "#e6ecdf", line: "#c9cfc1", text: "#140c2a", muted: "#4f5d5d", accent: "#6e4c61", growth: "#6f8585", tip: "#8d6b7f", glitchA: "#8d6b7f", glitchB: "#829b9b" },
	},
	broccoli: {
		name: "Broccoli",
		dark: { bg: "#0f1f16", raised: "#132a1c", line: "#2e4a37", text: "#e9f0df", muted: "#a9bca8", accent: "#9be15d", growth: "#5a9e3a", tip: "#d4ff7a", glitchA: "#e0372c", glitchB: "#9be15d" },
		light: { bg: "#e9f0df", raised: "#dfe8d2", line: "#c3d1bb", text: "#132a1c", muted: "#4a6150", accent: "#2b6e1c", growth: "#3f7a2a", tip: "#e0372c", glitchA: "#e0372c", glitchB: "#2b6e1c" },
	},
	lichen: {
		name: "Lichen",
		dark: { bg: "#12130c", raised: "#1a1c12", line: "#33362a", text: "#ebe8d6", muted: "#9d9d84", accent: "#d6ff3a", growth: "#a89b62", tip: "#d6ff3a", glitchA: "#c2643b", glitchB: "#d6ff3a" },
		light: { bg: "#f2efe0", raised: "#e8e4d0", line: "#d0cbb4", text: "#1a1c12", muted: "#5d5c48", accent: "#566600", growth: "#7d7140", tip: "#c2643b", glitchA: "#c2643b", glitchB: "#566600" },
	},
};

export function isStrainKey(value: unknown): value is StrainKey {
	return typeof value === "string" && STRAIN_KEYS.some((k) => k === value);
}

const cssName = (key: string) => "--" + key.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());

function declarations(tokens: Tokens, strain: Strain): string {
	// Syntax colors come from a dark Shiki theme, so code surfaces stay dark in both modes.
	const code = `--code-bg:${strain.dark.raised};--code-line:${strain.dark.line};--code-text:${strain.dark.text};--code-muted:${strain.dark.muted};`;
	return (
		Object.entries(tokens)
			.map(([k, v]) => `${cssName(k)}:${v};`)
			.join("") + code
	);
}

// Rendered once into <head>. Biolume is also the fallback before the pre-paint script runs.
export function strainCss(): string {
	const fallback = STRAINS[DEFAULT_STRAIN];
	const rules: string[] = [
		`:root{${declarations(fallback.dark, fallback)}}`,
		`:root.light{${declarations(fallback.light, fallback)}}`,
	];
	for (const key of STRAIN_KEYS) {
		const s = STRAINS[key];
		rules.push(`:root[data-strain="${key}"]{${declarations(s.dark, s)}}`);
		rules.push(`:root.light[data-strain="${key}"]{${declarations(s.light, s)}}`);
	}
	return rules.join("");
}
