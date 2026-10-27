export interface PostFrontmatter {
	title: string;
	subtitle?: string;
	description?: string;
	/** YYYY-MM-DD, or undefined when the post has no date */
	date?: string;
	tags: string[];
	draft: boolean;
}

const FRONTMATTER = /^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/;

export function stripFrontmatter(content: string): string {
	const match = content.match(FRONTMATTER);
	if (!match) return content;
	return content.slice(match[0].length).trim();
}

function frontmatterBlock(content: string): string {
	return content.match(FRONTMATTER)?.[1] ?? "";
}

// YAML scalar: a quoted value ends at its closing quote, a bare one at " #" (a comment)
function scalar(raw: string): string {
	const quoted = raw.match(/^(["'])(.*?)\1/);
	if (quoted) return quoted[2];
	return raw.replace(/\s+#.*$/, "").trim();
}

function unquote(value: string): string {
	const match = value.match(/^(["'])(.*)\1$/);
	return match ? match[2] : value;
}

// Scoped to the frontmatter block and anchored to line starts, so "subtitle:" can't
// match "title:" and a "draft: true" inside a code sample in the body is ignored
function field(block: string, key: string): string | undefined {
	const raw = block.match(new RegExp(`^${key}:[ \\t]*(.*?)[ \\t]*$`, "m"))?.[1];
	const value = raw ? scalar(raw) : "";
	return value || undefined;
}

// Handles both inline arrays (tags: [a, "b"]) and YAML lists (tags:\n  - a)
function tags(block: string): string[] {
	const inline = block.match(/^tags:[ \t]*\[(.*?)\]/ms)?.[1];
	const list = block.match(/^tags:[ \t]*\n((?:[ \t]+-[ \t]+.+\n?)+)/m)?.[1];

	const items = inline
		? inline.split(",")
		: (list?.split("\n").map((line) => line.replace(/^\s+-\s+/, "")) ?? []);

	return items.map((t) => unquote(t.trim())).filter((t) => t.length > 0);
}

export function parseFrontmatter(
	content: string,
	fallbackTitle = "",
): PostFrontmatter {
	const block = frontmatterBlock(content);

	return {
		title: field(block, "title") ?? fallbackTitle,
		subtitle: field(block, "subtitle"),
		description: field(block, "description"),
		date: field(block, "date")?.match(/^\d{4}-\d{2}-\d{2}/)?.[0],
		tags: tags(block),
		draft: field(block, "draft") === "true",
	};
}
