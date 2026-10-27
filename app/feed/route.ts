import { readAllPosts } from "@/lib/content/posts";

type PostData = {
	id: string;
	title: string;
	subtitle: string | undefined;
	date: Date | undefined;
	tags: string[];
};

// Undated posts sort last and get no pubDate, rather than claiming they were published now
function getPostsData(): PostData[] {
	return readAllPosts()
		.map(({ id, frontmatter: fm }) => ({
			id,
			title: fm.title,
			subtitle: fm.subtitle,
			date: fm.date ? new Date(fm.date) : undefined,
			tags: fm.tags,
		}))
		.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
}

export async function GET() {
	const sortedPosts = getPostsData();
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
      <link>${siteUrl}/${post.id}</link>
      <guid>${siteUrl}/${post.id}</guid>
      ${post.date ? `<pubDate>${post.date.toUTCString()}</pubDate>` : ""}
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
