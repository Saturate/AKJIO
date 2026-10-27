import { describe, expect, it } from "vitest";
import {
	DEFAULT_SETTINGS,
	GROWTH_RANGE,
	parseSettings,
	serializeSettings,
} from "./settings";

const cookie = (value: unknown) => encodeURIComponent(JSON.stringify(value));

// The settings cookie and the WebMCP update tool both feed untrusted input through this
describe("parseSettings", () => {
	it("round-trips valid settings", () => {
		const s = { ...DEFAULT_SETTINGS, strain: "lichen" as const, growth: 2 };
		expect(parseSettings(serializeSettings(s))).toEqual(s);
	});

	it("falls back to defaults for missing, malformed or non-object input", () => {
		expect(parseSettings(undefined)).toEqual(DEFAULT_SETTINGS);
		expect(parseSettings("%E0%A4%A")).toEqual(DEFAULT_SETTINGS);
		expect(parseSettings(cookie([1, 2]))).toEqual(DEFAULT_SETTINGS);
	});

	it("clamps numbers and rejects wrong types field by field", () => {
		const s = parseSettings(
			cookie({ growth: 999, spores: "lots", strain: "nope", react: "yes", theme: "light" }),
		);
		expect(s.growth).toBe(GROWTH_RANGE.max);
		expect(s.spores).toBe(DEFAULT_SETTINGS.spores);
		expect(s.strain).toBe(DEFAULT_SETTINGS.strain);
		expect(s.react).toBe(DEFAULT_SETTINGS.react);
		expect(s.theme).toBe("light");
	});

	it("drops unknown keys", () => {
		expect(parseSettings(cookie({ evil: "<script>" }))).not.toHaveProperty("evil");
	});
});
