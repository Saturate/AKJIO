import { DEFAULT_STRAIN, isStrainKey, type StrainKey } from "@/lib/strains";

export type ThemeChoice = "system" | "dark" | "light";

export type Settings = {
	strain: StrainKey;
	theme: ThemeChoice;
	/** Growth speed multiplier for the hyphae; 0 freezes them. */
	growth: number;
	/** Background spore density; 1 is the default field, 0 hides it. */
	spores: number;
	/** Spores move away from the pointer and puff on keypress. */
	react: boolean;
	pulses: boolean;
	glitch: boolean;
};

export const SETTINGS_COOKIE = "akj-culture";
export const GROWTH_RANGE = { min: 0, max: 3, step: 0.25 } as const;
export const SPORES_RANGE = { min: 0, max: 2, step: 0.25 } as const;

export const DEFAULT_SETTINGS: Settings = {
	strain: DEFAULT_STRAIN,
	theme: "system",
	growth: 1,
	spores: 1,
	react: true,
	pulses: true,
	glitch: true,
};

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isThemeChoice(v: unknown): v is ThemeChoice {
	return v === "system" || v === "dark" || v === "light";
}

function clamp(v: unknown, range: { min: number; max: number }, fallback: number): number {
	return typeof v === "number" && Number.isFinite(v) ? Math.min(range.max, Math.max(range.min, v)) : fallback;
}

function bool(v: unknown, fallback: boolean): boolean {
	return typeof v === "boolean" ? v : fallback;
}

// The cookie is user-controlled input: every field is narrowed and clamped, anything else falls back.
export function parseSettings(raw: string | undefined): Settings {
	if (!raw) return DEFAULT_SETTINGS;
	let data: unknown;
	try {
		data = JSON.parse(decodeURIComponent(raw));
	} catch {
		return DEFAULT_SETTINGS;
	}
	if (!isRecord(data)) return DEFAULT_SETTINGS;
	const d = DEFAULT_SETTINGS;
	return {
		strain: isStrainKey(data.strain) ? data.strain : d.strain,
		theme: isThemeChoice(data.theme) ? data.theme : d.theme,
		growth: clamp(data.growth, GROWTH_RANGE, d.growth),
		spores: clamp(data.spores, SPORES_RANGE, d.spores),
		react: bool(data.react, d.react),
		pulses: bool(data.pulses, d.pulses),
		glitch: bool(data.glitch, d.glitch),
	};
}

export function serializeSettings(s: Settings): string {
	return encodeURIComponent(JSON.stringify(s));
}

export function isDefaultSettings(s: Settings): boolean {
	const d = DEFAULT_SETTINGS;
	return (
		s.strain === d.strain &&
		s.theme === d.theme &&
		s.growth === d.growth &&
		s.spores === d.spores &&
		s.react === d.react &&
		s.pulses === d.pulses &&
		s.glitch === d.glitch
	);
}
