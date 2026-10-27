import { parse } from "yaml";

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

// Same YAML parser family compileMDX uses for the post page itself, so listings, the
// feed and llms.txt can't disagree with the page about a post's title or tags.
// Broken YAML yields no fields rather than taking down every listing.
function frontmatterData(content: string): Record<string, unknown> {
	const block = content.match(FRONTMATTER)?.[1];
	if (!block) return {};
	try {
		const data: unknown = parse(block);
		return typeof data === "object" && data !== null && !Array.isArray(data)
			? Object.fromEntries(Object.entries(data))
			: {};
	} catch {
		return {};
	}
}

function text(value: unknown): string | undefined {
	if (typeof value === "number") return String(value);
	return typeof value === "string" && value.trim() ? value : undefined;
}

function isoDate(value: unknown): string | undefined {
	if (value instanceof Date) return value.toISOString().slice(0, 10);
	return text(value)?.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
}

function tagList(value: unknown): string[] {
	const items = Array.isArray(value) ? value : [value];
	return items.flatMap((item) => {
		const tag = text(item);
		return tag ? [tag] : [];
	});
}

export function parseFrontmatter(
	content: string,
	fallbackTitle = "",
): PostFrontmatter {
	const data = frontmatterData(content);

	return {
		title: text(data.title) ?? fallbackTitle,
		subtitle: text(data.subtitle),
		description: text(data.description),
		date: isoDate(data.date),
		tags: tagList(data.tags),
		draft: data.draft === true || data.draft === "true",
	};
}
