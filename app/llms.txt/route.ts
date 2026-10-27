import { getLlmPages, getLlmPosts } from "@/utils/llmContent";
import { SITE_URL } from "@/lib/site";

export async function GET() {
	const posts = getLlmPosts();
	const pages = getLlmPages();

	const lines = [
		"# AKJ.IO",
		"",
		"> Software engineer and security enthusiast. Writing about CTF challenges, web security, frontend development, and software architecture.",
		"",
		`Everything below in one file: ${SITE_URL}/llms-full.txt`,
		"",
		"## Blog Posts",
		"",
		...posts.map((post) => {
			const desc = post.description ? `: ${post.description}` : "";
			return `- [${post.title}](${SITE_URL}/${post.id}/llm.txt)${desc}`;
		}),
		"",
		"## Pages",
		"",
		...pages.map(
			(page) => `- [${page.title}](${SITE_URL}/${page.slug}/llm.txt)`,
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
