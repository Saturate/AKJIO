import { parse } from "yaml";

export interface PostFrontmatter {
	title: string;
	subtitle?: string;
	description?: string;
	/** As written (YYYY-MM-DD, optionally with a time), or undefined when missing or impossible */
	date?: string;
	tags: string[];
	draft: boolean;
}

// vfile-matter's fence regex, which compileMDX uses for the post page: listings must find
// exactly the same block, CRLF files included, or a "draft: true\r" reads as published
const FRONTMATTER =
	/^---(?:\r?\n|\r)(?:([\s\S]*?)(?:\r?\n|\r))?---(?:\r?\n|\r|$)/;

export function stripFrontmatter(content: string): string {
	const match = content.match(FRONTMATTER);
	if (!match) return content;
	return content.slice(match[0].length).trim();
}

// Same yaml.parse the post page goes through, so listings agree with it on title, tags and
// draft. null means the YAML is broken; the build fails on that file anyway, but until then
// (e.g. next dev) it must not leak into listings.
function frontmatterData(content: string): Record<string, unknown> | null {
	const block = content.match(FRONTMATTER)?.[1];
	if (!block) return {};
	try {
		const data: unknown = parse(block);
		return typeof data === "object" && data !== null && !Array.isArray(data)
			? Object.fromEntries(Object.entries(data))
			: {};
	} catch {
		return null;
	}
}

function text(value: unknown): string | undefined {
	if (typeof value === "number") return String(value);
	return typeof value === "string" && value.trim() ? value : undefined;
}

// Rejects 2024-13-01 and 2024-02-30 here, instead of an "Invalid time value" deep in the
// sitemap build that doesn't say which post caused it
function validDate(value: unknown): string | undefined {
	const raw = text(value)?.trim();
	const day = raw?.match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (!raw || !day || Number.isNaN(Date.parse(raw))) return undefined;

	const [, y, m, d] = day.map(Number);
	const check = new Date(Date.UTC(y, m - 1, d));
	const real =
		check.getUTCFullYear() === y &&
		check.getUTCMonth() === m - 1 &&
		check.getUTCDate() === d;
	return real ? raw : undefined;
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
	if (!data) return { title: fallbackTitle, tags: [], draft: true };

	return {
		title: text(data.title) ?? fallbackTitle,
		subtitle: text(data.subtitle),
		description: text(data.description),
		date: validDate(data.date),
		tags: tagList(data.tags),
		draft: data.draft === true || data.draft === "true",
	};
}
