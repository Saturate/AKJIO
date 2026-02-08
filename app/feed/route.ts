import fs from "fs";
import path from "path";

const POST_CONTENT_PATH = "content/posts";

type PostData = {
	id: string;
	title: string;
	subtitle: string | undefined;
	date: Date;
	tags: string[];
};

async function getPostsData(): Promise<PostData[]> {
	const postIds = fs
		.readdirSync(POST_CONTENT_PATH, { withFileTypes: true })
		.filter((item) => item.isDirectory() && item.name !== "_drafts")
		.map((item) => item.name);

	const posts = (await Promise.all(
		postIds.map(async (id) => {
			const postPath = path.join(POST_CONTENT_PATH, id);
			const files = fs.readdirSync(postPath);
			const mdxFile = files.find((f) => f.endsWith(".mdx"));

			if (!mdxFile) return null;

			const content = fs.readFileSync(path.join(postPath, mdxFile), "utf8");

			// Extract frontmatter (simple regex parsing)
			const titleMatch = content.match(/title:\s*["'](.+?)["']/);
			const subtitleMatch = content.match(/subtitle:\s*["'](.+?)["']/);
			const dateMatch = content.match(/date:\s*["']?(\d{4}-\d{2}-\d{2})/);
			const tagsMatch = content.match(/tags:\s*\[(.*?)\]/s);

			const tags = tagsMatch
				? tagsMatch[1]
						.split(",")
						.map((t) => t.trim().replace(/['"]/g, ""))
						.filter((t) => t.length > 0)
				: [];

			return {
				id,
				title: titleMatch ? titleMatch[1] : id,
				subtitle: subtitleMatch ? subtitleMatch[1] : undefined,
				date: dateMatch ? new Date(dateMatch[1]) : new Date(),
				tags,
			};
		})
	)).filter((p): p is PostData => p !== null);

	return posts.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function GET() {
	const sortedPosts = await getPostsData();
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://akj.io";

	const feedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Allan Kimmer Jensen</title>
    <link>${siteUrl}</link>
    <description>Writing on security, development, and CTF</description>
    <language>en</language>
    <atom:link href="${siteUrl}/feed" rel="self" type="application/rss+xml" />
    ${sortedPosts
			.map(
				(post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteUrl}/posts/${post.id}</link>
      <guid>${siteUrl}/posts/${post.id}</guid>
      <pubDate>${post.date.toUTCString()}</pubDate>
      ${post.subtitle ? `<description>${escapeXml(post.subtitle)}</description>` : ""}
      ${post.tags?.map((tag) => `<category>${escapeXml(tag)}</category>`).join("\n      ") || ""}
    </item>`,
			)
			.join("\n")}
  </channel>
</rss>`;

	return new Response(feedXml, {
		headers: {
			"Content-Type": "application/xml",
			"Cache-Control": "s-maxage=3600, stale-while-revalidate",
		},
	});
}

function escapeXml(unsafe: string): string {
	return unsafe.replace(/[<>&'"]/g, (c) => {
		switch (c) {
			case "<":
				return "&lt;";
			case ">":
				return "&gt;";
			case "&":
				return "&amp;";
			case "'":
				return "&apos;";
			case '"':
				return "&quot;";
			default:
				return c;
		}
	});
}
