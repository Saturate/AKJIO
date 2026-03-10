import fs from "fs";

function stripFrontmatter(content: string): string {
	const match = content.match(/^---\s*\n[\s\S]*?\n---\s*\n/);
	if (!match) return content;
	return content.slice(match[0].length).trim();
}

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
