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
	});

	// Keeping the time means same-day posts sort the same in the feed and llms as on /posts
	it("keeps the time of day and drops impossible dates", () => {
		expect(parseFrontmatter(post(`date: "2026-07-22T10:00:00"`)).date).toBe(
			"2026-07-22T10:00:00",
		);
		expect(parseFrontmatter(post(`date: 2026-07-22`)).date).toBe("2026-07-22");
		expect(parseFrontmatter(post(`date: 2024-13-01`)).date).toBeUndefined();
		expect(parseFrontmatter(post(`date: 2024-02-30`)).date).toBeUndefined();
		expect(parseFrontmatter(post(`date: soon`)).date).toBeUndefined();
	});

	// Same fence rules as vfile-matter, which compileMDX uses for the post page
	it("reads CRLF files and ignores fences with trailing spaces", () => {
		const crlf = "---\r\ntitle: A\r\ntags: [x, y]\r\ndraft: true\r\n---\r\n\r\nBody\r\n";
		expect(parseFrontmatter(crlf)).toMatchObject({
			title: "A",
			tags: ["x", "y"],
			draft: true,
		});
		expect(stripFrontmatter(crlf)).toBe("Body");
		expect(parseFrontmatter("--- \ntitle: A\n---\n", "fallback").title).toBe(
			"fallback",
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

	it("handles the YAML forms a regex parser gets wrong", () => {
		const fm = parseFrontmatter(
			post(
				[
					`title: "He said \\"hi\\""`,
					`subtitle: 'It''s fine'`,
					`description: >-`,
					`  Folded over`,
					`  two lines`,
					`tags:`,
					`- unindented`,
					`- list`,
				].join("\n"),
			),
		);
		expect(fm).toMatchObject({
			title: 'He said "hi"',
			subtitle: "It's fine",
			description: "Folded over two lines",
			tags: ["unindented", "list"],
		});
	});

	it("treats broken YAML as a draft rather than publishing it", () => {
		expect(
			parseFrontmatter(post(`title: Foo: bar\ndraft: true`), "fallback"),
		).toMatchObject({ title: "fallback", tags: [], draft: true });
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
