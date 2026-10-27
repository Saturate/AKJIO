import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { markdownPathFor, prefersMarkdown } from "./markdownNegotiation";

describe("prefersMarkdown", () => {
	it.each([
		["text/markdown", true],
		["text/markdown, text/html;q=0.9", true],
		["text/markdown;Q=1, text/html;q=0.5", true],
		["text/html, text/markdown;q=0.5", false],
		["text/markdown;q=0.5, */*", false],
		["text/markdown;q=0.5, text/*;q=0.9", false],
		["text/markdown;q=0", false],
		["text/markdown;q=junk", false],
		// What browsers send: no markdown at all
		["text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", false],
		["*/*", false],
		[null, false],
	])("%s → %s", (accept, expected) => {
		expect(prefersMarkdown(accept)).toBe(expected);
	});
});

describe("markdownPathFor", () => {
	it.each([
		["/", "/llm.txt"],
		["/posts", "/llms.txt"],
		["/some-post", "/some-post/llm.txt"],
		["/some-post/llm.txt", null],
		["/llms.txt", null],
		["/Uppercase", null],
		["/%2E%2E", null],
		["/a/b", null],
	])("%s → %s", (pathname, expected) => {
		expect(markdownPathFor(pathname)).toBe(expected);
	});

	// Any top-level route that isn't MDX content must be excluded, or agents asking for
	// markdown get a 404 where browsers get a page. This fails when a new one is added.
	it("skips every top-level app route that has no llm.txt twin", () => {
		const metadataRoutes = ["icon", "apple-icon", "opengraph-image", "twitter-image"];

		// Route groups like (site) don't add a URL segment, so their children are top-level too
		const topLevelRoutes = (dir: string): string[] =>
			fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
				if (entry.isDirectory()) {
					if (/^\(.+\)$/.test(entry.name)) {
						return topLevelRoutes(path.join(dir, entry.name));
					}
					// _private folders, [dynamic] and @slot segments, and dotted routes like llms.txt
					return /^[_[@]/.test(entry.name) || entry.name.includes(".") ? [] : [entry.name];
				}
				const base = entry.name.replace(/\.(tsx?|jsx?)$/, "");
				return metadataRoutes.includes(base) ? [base] : [];
			});

		const routes = topLevelRoutes(
			path.join(import.meta.dirname, "..", "..", "app"),
		);

		expect(routes.length).toBeGreaterThan(0);
		for (const route of routes) {
			const expected = route === "posts" ? "/llms.txt" : null;
			expect(markdownPathFor(`/${route}`), `/${route}`).toBe(expected);
		}
	});
});
