import type { MetadataRoute } from "next";
import { parseFrontmatter, readAllPosts } from "@/utils/parseFrontmatter";

function getPostsData(): Array<{ id: string; date: Date }> {
	return readAllPosts().map(({ id, content }) => {
		const fm = parseFrontmatter(content);
		return {
			id,
			date: fm.date ? new Date(fm.date) : new Date(),
		};
	});
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://akj.io";
	const posts = getPostsData();

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

	const postPages: MetadataRoute.Sitemap = posts.map(({ id, date }) => ({
		url: `${siteUrl}/${id}`,
		lastModified: date,
		changeFrequency: "monthly" as const,
		priority: 0.7,
	}));

	return [...staticPages, ...postPages];
}
