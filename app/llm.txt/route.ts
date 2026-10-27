import fs from "fs";
import { stripFrontmatter } from "@/lib/content/frontmatter";

export async function GET() {
	const raw = fs.readFileSync("content/index.mdx", "utf8");
	const markdown = stripFrontmatter(raw);

	return new Response(markdown, {
		headers: {
			"Content-Type": "text/markdown; charset=utf-8",
			"Cache-Control": "s-maxage=3600, stale-while-revalidate",
		},
	});
}
