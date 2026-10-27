import fs from "fs";
import path from "path";

const POST_CONTENT_PATH = "content/posts";
const PAGE_CONTENT_PATH = "content";

const EXCLUDED_PAGES = new Set(["404", "index", "design-guide"]);

export type LlmPost = {
	id: string;
	title: string;
	description: string | undefined;
	date: Date | undefined;
	body: string;
};

export type LlmPage = {
	slug: string;
	title: string;
	body: string;
};

export function stripFrontmatter(content: string): string {
	const match = content.match(/^---\s*\n[\s\S]*?\n---\s*\n/);
	if (!match) return content;
	return content.slice(match[0].length).trim();
}

// Scoped to the frontmatter and anchored, so "subtitle:" can't match "title:" and a
// "draft: true" inside a code sample in the body doesn't hide the post
function frontmatterField(content: string, key: string): string | undefined {
	const frontmatter = content.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? "";
	return frontmatter.match(
		new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, "m"),
	)?.[1];
}

// Published posts, newest first; undated ones last
export function getLlmPosts(): LlmPost[] {
	const postIds = fs
		.readdirSync(POST_CONTENT_PATH, { withFileTypes: true })
		.filter((item) => item.isDirectory())
		.map((item) => item.name);

	const posts = postIds.flatMap((id) => {
		const postPath = path.join(POST_CONTENT_PATH, id);
		const mdxFile = fs.readdirSync(postPath).find((f) => f.endsWith(".mdx"));
		if (!mdxFile) return [];

		const content = fs.readFileSync(path.join(postPath, mdxFile), "utf8");
		if (frontmatterField(content, "draft") === "true") return [];

		const date = frontmatterField(content, "date")?.match(
			/^\d{4}-\d{2}-\d{2}/,
		)?.[0];

		return [
			{
				id,
				title: frontmatterField(content, "title") ?? id,
				description:
					frontmatterField(content, "description") ??
					frontmatterField(content, "subtitle"),
				date: date ? new Date(date) : undefined,
				body: stripFrontmatter(content),
			},
		];
	});

	return posts.sort(
		(a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0),
	);
}

export function getLlmPages(): LlmPage[] {
	return fs
		.readdirSync(PAGE_CONTENT_PATH)
		.filter((f) => f.endsWith(".mdx"))
		.map((file) => ({
			file,
			// Matches generateContentMap: "1_about.mdx" is served at /about
			slug: file.replace(/\.mdx$/, "").replace(/^\d_/, ""),
		}))
		.filter(({ slug }) => !EXCLUDED_PAGES.has(slug))
		.map(({ file, slug }) => {
			const content = fs.readFileSync(
				path.join(PAGE_CONTENT_PATH, file),
				"utf8",
			);

			return {
				slug,
				title: frontmatterField(content, "title") ?? slug,
				body: stripFrontmatter(content),
			};
		});
}
