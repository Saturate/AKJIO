import fs from "fs";
import path from "path";

const POST_CONTENT_PATH = "content/posts";
const PAGE_CONTENT_PATH = "content";

function stripFrontmatter(content: string): string {
	const match = content.match(/^---\s*\n[\s\S]*?\n---\s*\n/);
	if (!match) return content;
	return content.slice(match[0].length).trim();
}

function resolveContentPath(slug: string): string | null {
	// Check posts/{slug}/index.mdx first
	const postDir = path.join(POST_CONTENT_PATH, slug);
	if (fs.existsSync(postDir) && fs.statSync(postDir).isDirectory()) {
		const files = fs.readdirSync(postDir);
		const mdxFile = files.find((f) => f.endsWith(".mdx"));
		if (mdxFile) return path.join(postDir, mdxFile);
	}

	// Fall back to content/{slug}.mdx
	const pagePath = path.join(PAGE_CONTENT_PATH, `${slug}.mdx`);
	if (fs.existsSync(pagePath)) return pagePath;

	return null;
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ slug: string }> },
) {
	const { slug } = await params;
	const filePath = resolveContentPath(slug);

	if (!filePath) {
		return new Response("Not found", { status: 404 });
	}

	const raw = fs.readFileSync(filePath, "utf8");
	const markdown = stripFrontmatter(raw);

	return new Response(markdown, {
		headers: {
			"Content-Type": "text/markdown; charset=utf-8",
			"Cache-Control": "s-maxage=3600, stale-while-revalidate",
		},
	});
}
