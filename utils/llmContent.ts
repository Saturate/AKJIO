import fs from "fs";
import path from "path";
import { parseFrontmatter, stripFrontmatter } from "@/lib/content/frontmatter";
import { readAllPosts } from "@/lib/content/posts";

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

// Published posts, newest first; undated ones last
export function getLlmPosts(): LlmPost[] {
	return readAllPosts()
		.map(({ id, content, frontmatter: fm }) => ({
			id,
			title: fm.title,
			description: fm.description ?? fm.subtitle,
			date: fm.date ? new Date(fm.date) : undefined,
			body: stripFrontmatter(content),
		}))
		.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
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
				title: parseFrontmatter(content, slug).title,
				body: stripFrontmatter(content),
			};
		});
}
