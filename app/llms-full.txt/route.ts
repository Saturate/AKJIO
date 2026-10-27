import fs from "fs";
import { stripFrontmatter } from "@/lib/content/frontmatter";
import { getLlmPages, getLlmPosts } from "@/utils/llmContent";
import { SITE_URL } from "@/lib/site";

// The whole site in one file, so an agent can answer "who is Allan" with a single fetch
export async function GET() {
	const home = stripFrontmatter(fs.readFileSync("content/index.mdx", "utf8"));

	const sections = [
		"# AKJ.IO: Allan Kimmer Jensen",
		`> Full text of ${SITE_URL}. Index with links: ${SITE_URL}/llms.txt`,
		home,
		...getLlmPages().map(
			(page) =>
				`# ${page.title}\n\nURL: ${SITE_URL}/${page.slug}\n\n${page.body}`,
		),
		...getLlmPosts().map((post) =>
			[
				`# ${post.title}`,
				`URL: ${SITE_URL}/${post.id}  `,
				post.date ? `Published: ${post.date.toISOString().slice(0, 10)}` : "",
				post.description ? `\n> ${post.description}` : "",
				`\n${post.body}`,
			].join("\n"),
		),
	];

	return new Response(sections.join("\n\n---\n\n") + "\n", {
		headers: {
			"Content-Type": "text/markdown; charset=utf-8",
			"Cache-Control": "s-maxage=3600, stale-while-revalidate",
		},
	});
}
