import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { parseFundingYml } from "./funding";

describe("parseFundingYml", () => {
	it("reads the repo's real FUNDING.yml", () => {
		const links = parseFundingYml(fs.readFileSync(".github/FUNDING.yml", "utf8"));
		expect(links).toContainEqual({
			platform: "github",
			url: "https://github.com/sponsors/Saturate",
		});
	});

	it("handles lists, quotes, comments and custom URLs", () => {
		const links = parseFundingYml(
			[
				"github: ['a', \"b\"] # sponsors",
				"ko_fi: someone",
				"patreon: # Replace with a single Patreon username",
				"custom: ['https://example.com/tip?x=1#top']",
				"unknown_platform: ignored",
			].join("\n"),
		);

		expect(links).toEqual([
			{ platform: "github", url: "https://github.com/sponsors/a" },
			{ platform: "github", url: "https://github.com/sponsors/b" },
			{ platform: "ko_fi", url: "https://ko-fi.com/someone" },
			{ platform: "custom", url: "https://example.com/tip?x=1#top" },
		]);
	});
});
