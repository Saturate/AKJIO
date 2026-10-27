import Link from "next/link";
import PostRows from "@/components/PostRows/PostRows";
import { hashStr } from "@/lib/random";
import type { PostSummary } from "@/utils/postSummaries";
import styles from "./RecentPosts.module.css";

export default function RecentPosts({
	posts,
	limit = 5,
}: {
	posts: PostSummary[];
	limit?: number;
}) {
	return (
		<section className={styles.recent} aria-labelledby="recent-heading">
			<div className={styles.head}>
				<h2 id="recent-heading" className={styles.heading}>
					Recent posts
				</h2>
				<Link href="/posts" className={`${styles.all} grow-underline`}>
					All {posts.length} posts
				</Link>
			</div>
			<PostRows posts={posts.slice(0, limit)} seed={hashStr("home:recent")} />
		</section>
	);
}
