import { getPost, getPostsIds } from "@/app/actions";
import Link from "next/link";
import styles from "./PopularTags.module.css";

export default async function PopularTags({ limit = 10 }: { limit?: number }) {
	const { postIds } = await getPostsIds();

	const posts = await Promise.all(
		postIds.map(async (id) => {
			return await getPost(id);
		}),
	);

	// Extract and count tags
	const tagCounts = new Map<string, number>();
	posts.forEach((post) => {
		if (post.frontmatter.tags) {
			post.frontmatter.tags.forEach((tag) => {
				tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
			});
		}
	});

	// Sort by count and limit
	const sortedTags = Array.from(tagCounts.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, limit);

	if (sortedTags.length === 0) {
		return null;
	}

	return (
		<aside className={styles.tags}>
			<h3 className={styles.heading}>Popular Tags</h3>
			<div className={styles.tagCloud}>
				{sortedTags.map(([tag, count]) => (
					<Link key={tag} href={`/posts?tag=${tag}`} className={styles.tag}>
						{tag}
						<span className={styles.count}>{count}</span>
					</Link>
				))}
			</div>
		</aside>
	);
}
