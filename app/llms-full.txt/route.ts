import fs from "fs";
import { getLlmPages, getLlmPosts, stripFrontmatter } from "@/utils/llmContent";

// The whole site in one file, so an agent can answer "who is Allan" with a single fetch
export async function GET() {
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://akj.io";
	const home = stripFrontmatter(fs.readFileSync("content/index.mdx", "utf8"));

	const sections = [
		"# AKJ.IO: Allan Kimmer Jensen",
		`> Full text of ${siteUrl}. Index with links: ${siteUrl}/llms.txt`,
		home,
		...getLlmPages().map(
			(page) =>
				`# ${page.title}\n\nURL: ${siteUrl}/${page.slug}\n\n${page.body}`,
		),
		...getLlmPosts().map((post) =>
			[
				`# ${post.title}`,
				`URL: ${siteUrl}/${post.id}  `,
				`Published: ${post.date.toISOString().slice(0, 10)}`,
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
