import fs from "fs";
import path from "path";

const POST_CONTENT_PATH = "content/posts";
const PAGE_CONTENT_PATH = "content";

const EXCLUDED_PAGES = new Set(["404.mdx", "index.mdx", "design-guide.mdx"]);

export type LlmPost = {
	id: string;
	title: string;
	description: string | undefined;
	date: Date;
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

// Published posts, newest first
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
		if (content.match(/draft:\s*true/)) return [];

		const titleMatch = content.match(/title:\s*["']?(.+?)["']?\s*$/m);
		const subtitleMatch = content.match(/subtitle:\s*["']?(.+?)["']?\s*$/m);
		const descriptionMatch = content.match(
			/description:\s*["']?(.+?)["']?\s*$/m,
		);
		const dateMatch = content.match(/date:\s*["']?(\d{4}-\d{2}-\d{2})/);

		return [
			{
				id,
				title: titleMatch ? titleMatch[1] : id,
				description: descriptionMatch?.[1] ?? subtitleMatch?.[1],
				date: dateMatch ? new Date(dateMatch[1]) : new Date(),
				body: stripFrontmatter(content),
			},
		];
	});

	return posts.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function getLlmPages(): LlmPage[] {
	return fs
		.readdirSync(PAGE_CONTENT_PATH)
		.filter((f) => f.endsWith(".mdx") && !EXCLUDED_PAGES.has(f))
		.map((file) => {
			const content = fs.readFileSync(
				path.join(PAGE_CONTENT_PATH, file),
				"utf8",
			);
			const titleMatch = content.match(/title:\s*["']?(.+?)["']?\s*$/m);
			// Matches generateContentMap: "1_about.mdx" is served at /about
			const slug = file.replace(/\.mdx$/, "").replace(/^\d_/, "");

			return {
				slug,
				title: titleMatch ? titleMatch[1] : slug,
				body: stripFrontmatter(content),
			};
		});
}
