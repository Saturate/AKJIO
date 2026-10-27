import fs from "fs";
import generateContentMap from "@/utils/generateContentMap";

function stripFrontmatter(content: string): string {
	const match = content.match(/^---\s*\n[\s\S]*?\n---\s*\n/);
	if (!match) return content;
	return content.slice(match[0].length).trim();
}

// Same lookup as the HTML route, so ordered files like content/1_about.mdx resolve too
async function resolveContentPath(slug: string): Promise<string | null> {
	const contentMap = await generateContentMap();
	const page =
		contentMap.find((c) => c.websitePath === `/posts/${slug}`) ??
		contentMap.find((c) => c.websitePath === `/${slug}`);

	return page?.filePath ?? null;
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ slug: string }> },
) {
	const { slug } = await params;
	const filePath = await resolveContentPath(slug);

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
