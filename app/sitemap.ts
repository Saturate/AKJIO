import type { MetadataRoute } from "next";
import fs from "fs";
import path from "path";

const POST_CONTENT_PATH = "content/posts";

async function getPostsData() {
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

			const content = fs.readFileSync(
				path.join(postPath, mdxFile),
				"utf8"
			);

			// Extract frontmatter date (simple regex for date field)
			const dateMatch = content.match(/date:\s*["']?(\d{4}-\d{2}-\d{2})/);
			const date = dateMatch ? new Date(dateMatch[1]) : new Date();

			return { id, date };
		})
	)).filter((p): p is { id: string; date: Date } => p !== null);

	return posts;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://akj.io";
	const posts = await getPostsData();

	// Static pages
	const staticPages: MetadataRoute.Sitemap = [
		{
			url: siteUrl,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 1.0,
		},
		{
			url: `${siteUrl}/about`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: `${siteUrl}/work`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: `${siteUrl}/posts`,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 0.9,
		},
	];

	// Blog posts
	const postPages: MetadataRoute.Sitemap = posts.map(({ id, date }) => ({
		url: `${siteUrl}/posts/${id}`,
		lastModified: date,
		changeFrequency: "monthly" as const,
		priority: 0.7,
	}));

	return [...staticPages, ...postPages];
}
