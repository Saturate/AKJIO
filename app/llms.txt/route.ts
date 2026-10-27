import { getLlmPages, getLlmPosts } from "@/utils/llmContent";

export async function GET() {
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://akj.io";
	const posts = getLlmPosts();
	const pages = getLlmPages();

	const lines = [
		"# AKJ.IO",
		"",
		"> Software engineer and security enthusiast. Writing about CTF challenges, web security, frontend development, and software architecture.",
		"",
		`Everything below in one file: ${siteUrl}/llms-full.txt`,
		"",
		"## Blog Posts",
		"",
		...posts.map((post) => {
			const desc = post.description ? `: ${post.description}` : "";
			return `- [${post.title}](${siteUrl}/${post.id}/llm.txt)${desc}`;
		}),
		"",
		"## Pages",
		"",
		...pages.map(
			(page) => `- [${page.title}](${siteUrl}/${page.slug}/llm.txt)`,
		),
		"",
	];

	return new Response(lines.join("\n"), {
		headers: {
			"Content-Type": "text/markdown; charset=utf-8",
			"Cache-Control": "s-maxage=3600, stale-while-revalidate",
		},
	});
}
