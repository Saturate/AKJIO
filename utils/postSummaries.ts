import { getPost, getPostsIds } from "@/lib/content/compiledPost";

export type PostSummary = {
	link: string;
	title: string;
	subtitle: string;
	description?: string;
	date: Date;
	readTime: number;
	tags: string[];
};

// Published posts, newest first.
export async function getPostSummaries(): Promise<PostSummary[]> {
	const { postIds } = await getPostsIds();
	const posts = await Promise.all(postIds.map((id) => getPost(id)));
	return (
		posts
			.map((p) => ({
				link: p.link,
				title: p.frontmatter.title,
				subtitle: p.frontmatter.subtitle,
				description: p.frontmatter.description,
				date: p.frontmatter.date,
				readTime: p.readTime,
				tags: p.frontmatter.tags ?? [],
			}))
			// An undated post would make the comparator return NaN and land anywhere; sort it last
			.sort(
				(a, b) =>
					(new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0),
			)
	);
}

export function tagCounts(posts: PostSummary[]): Array<[string, number]> {
	const counts = new Map<string, number>();
	for (const p of posts)
		for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
	return [...counts.entries()].sort(
		(a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
	);
}
