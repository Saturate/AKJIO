import {
	GROWTH_RANGE,
	LENGTH_RANGE,
	SPORES_RANGE,
	parseSettings,
	type Settings,
} from "@/lib/settings";
import { STRAINS, STRAIN_KEYS } from "@/lib/strains";

type SettingsAccess = {
	current: () => Settings;
	update: (next: Settings) => void;
	reset: () => void;
};

const SETTINGS_SCHEMA = {
	type: "object",
	properties: {
		strain: {
			type: "string",
			enum: [...STRAIN_KEYS],
			description: `Colour strain: ${STRAIN_KEYS.map((k) => `${k} (${STRAINS[k].name})`).join(", ")}`,
		},
		theme: { type: "string", enum: ["system", "dark", "light"] },
		growth: {
			type: "number",
			...GROWTH_RANGE,
			description: "Hyphae growth speed multiplier; 0 freezes them",
		},
		length: {
			type: "number",
			...LENGTH_RANGE,
			description: "How far strands crawl and tendrils reach",
		},
		spores: {
			type: "number",
			minimum: SPORES_RANGE.min,
			maximum: SPORES_RANGE.max,
			description: "Background spore density; 0 hides them",
		},
		react: {
			type: "boolean",
			description: "Spores flee the pointer and puff on keypress",
		},
		pulses: { type: "boolean" },
		glitch: { type: "boolean" },
	},
} as const;

const describe = (s: Settings) => JSON.stringify(s, null, 2);

// Same knobs as the culture panel, so an agent can restyle the site for the person it's browsing with
export function createSettingsTools({
	current,
	update,
	reset,
}: SettingsAccess): ModelContextTool[] {
	return [
		{
			name: "get_site_settings",
			title: "Read site settings",
			description:
				"Current look of akj.io for this visitor: colour strain, light/dark theme and the living-background controls.",
			inputSchema: { type: "object", properties: {} },
			annotations: { readOnlyHint: true },
			execute: async () => describe(current()),
		},
		{
			name: "update_site_settings",
			title: "Change site settings",
			description:
				"Change how akj.io looks for this visitor. Pass only the fields to change; values out of range are clamped. Stored in a cookie on this browser.",
			inputSchema: SETTINGS_SCHEMA,
			execute: async (input) => {
				// parseSettings is the cookie's validator, so agent input gets the same narrowing and clamping
				const next = parseSettings(
					encodeURIComponent(JSON.stringify({ ...current(), ...input })),
				);
				update(next);
				return describe(next);
			},
		},
		{
			name: "reset_site_settings",
			title: "Reset site settings",
			description:
				"Put akj.io back to its default look and remove the settings cookie.",
			inputSchema: { type: "object", properties: {} },
			execute: async () => {
				reset();
				return "Settings reset to defaults.";
			},
		},
	];
}
