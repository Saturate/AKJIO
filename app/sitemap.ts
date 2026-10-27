import type { MetadataRoute } from "next";
import { readAllPosts } from "@/lib/content/posts";
import { SITE_URL } from "@/lib/site";

function getPostsData(): Array<{ id: string; date: Date | undefined }> {
	return readAllPosts().map(({ id, frontmatter }) => ({
		id,
		date: frontmatter.date ? new Date(frontmatter.date) : undefined,
	}));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const posts = getPostsData();

	const staticPages: MetadataRoute.Sitemap = [
		{
			url: SITE_URL,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 1.0,
		},
		{
			url: `${SITE_URL}/about`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: `${SITE_URL}/work`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: `${SITE_URL}/posts`,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 0.9,
		},
	];

	const postPages: MetadataRoute.Sitemap = posts.map(({ id, date }) => ({
		url: `${SITE_URL}/${id}`,
		lastModified: date,
		changeFrequency: "monthly" as const,
		priority: 0.7,
	}));

	return [...staticPages, ...postPages];
}
