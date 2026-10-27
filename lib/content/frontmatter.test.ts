import { describe, expect, it } from "vitest";
import { parseFrontmatter, stripFrontmatter } from "./frontmatter";

const post = (fm: string, body = "Body text") => `---\n${fm}\n---\n\n${body}\n`;

describe("parseFrontmatter", () => {
	it("reads quoted and bare values", () => {
		const fm = parseFrontmatter(
			post(`title: "Hello: world"\nsubtitle: 'Sub'\ndescription: Plain words`),
		);
		expect(fm).toMatchObject({
			title: "Hello: world",
			subtitle: "Sub",
			description: "Plain words",
		});
	});

	it("doesn't take subtitle as the title when it comes first", () => {
		const fm = parseFrontmatter(post(`subtitle: The sub\ntitle: The title`));
		expect(fm.title).toBe("The title");
		expect(fm.subtitle).toBe("The sub");
	});

	it("only treats draft in the frontmatter as a draft", () => {
		expect(parseFrontmatter(post(`title: A\ndraft: true`)).draft).toBe(true);
		expect(
			parseFrontmatter(post(`title: A`, "```yaml\ndraft: true\n```")).draft,
		).toBe(false);
	});

	it("ignores the body entirely when there is no frontmatter", () => {
		const fm = parseFrontmatter("title: Not frontmatter\n", "fallback");
		expect(fm.title).toBe("fallback");
	});

	it("leaves date undefined instead of inventing one", () => {
		expect(parseFrontmatter(post(`title: A`)).date).toBeUndefined();
		expect(parseFrontmatter(post(`date: "2026-07-22T10:00"`)).date).toBe(
			"2026-07-22",
		);
	});

	it("reads inline and YAML list tags", () => {
		expect(parseFrontmatter(post(`tags: [ctf, "web security"]`)).tags).toEqual(
			["ctf", "web security"],
		);
		expect(parseFrontmatter(post(`tags:\n  - ctf\n  - 'ai'`)).tags).toEqual([
			"ctf",
			"ai",
		]);
		expect(parseFrontmatter(post(`title: A`)).tags).toEqual([]);
	});

	it("drops trailing comments but keeps # inside quotes and words", () => {
		expect(parseFrontmatter(post(`title: Real # not this`)).title).toBe("Real");
		expect(parseFrontmatter(post(`title: "Issue #42" # note`)).title).toBe(
			"Issue #42",
		);
		expect(parseFrontmatter(post(`title: C# tips`)).title).toBe("C# tips");
	});
});

describe("stripFrontmatter", () => {
	it("returns the trimmed body", () => {
		expect(stripFrontmatter(post("title: A", "# Heading"))).toBe("# Heading");
	});

	it("leaves content without frontmatter alone", () => {
		expect(stripFrontmatter("# Just markdown")).toBe("# Just markdown");
	});
});
