import { getPost, getPostsIds } from "@/app/actions";
import { format as formatDate } from "date-fns";
import Link from "next/link";
import styles from "./RecentPosts.module.css";

export default async function RecentPosts({ limit = 3 }: { limit?: number }) {
	const { postIds } = await getPostsIds();

	const posts = await Promise.all(
		postIds.map(async (id) => {
			return await getPost(id);
		}),
	);

	const recentPosts = posts
		.sort((a, b) => {
			return (
				new Date(b.frontmatter.date).getTime() -
				new Date(a.frontmatter.date).getTime()
			);
		})
		.slice(0, limit);

	return (
		<aside className={styles.sidebar}>
			<h3 className={styles.heading}>Recent Posts</h3>
			<ul className={styles.postList}>
				{recentPosts.map(({ frontmatter, link }) => (
					<li key={link} className={styles.postItem}>
						<Link href={link} className={styles.postLink}>
							<span className={styles.postTitle}>{frontmatter.title}</span>
							<time className={styles.postDate}>
								{formatDate(new Date(frontmatter.date), "MMM d, yyyy")}
							</time>
						</Link>
					</li>
				))}
			</ul>
			<Link href="/posts" className={styles.viewAll}>
				View all posts →
			</Link>
		</aside>
	);
}
