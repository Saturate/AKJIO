import { getPost, getPostsIds } from "@/app/actions";
import PostRows from "@/components/PostRows/PostRows";
import { hashStr } from "@/lib/random";
import styles from "./RelatedPosts.module.css";

const LIMIT = 5;

// Shared tags first, newest first within a tie.
export default async function RelatedPosts({
	currentSlug,
	tags,
}: {
	currentSlug: string;
	tags: string[];
}) {
	const { postIds } = await getPostsIds();
	const posts = await Promise.all(
		postIds.filter((id) => id !== currentSlug).map((id) => getPost(id)),
	);
	const own = new Set(tags);

	const ranked = posts
		.map((p) => ({
			p,
			shared: (p.frontmatter.tags ?? []).filter((t) => own.has(t)).length,
			time: new Date(p.frontmatter.date).getTime(),
		}))
		.sort((a, b) => b.shared - a.shared || b.time - a.time)
		.slice(0, LIMIT)
		.map(({ p }) => ({
			link: p.link,
			title: p.frontmatter.title,
			date: p.frontmatter.date,
			readTime: p.readTime,
		}));

	if (!ranked.length) return null;

	return (
		<section className={styles.related} aria-labelledby="related-heading">
			<div className={styles.head}>
				<h2 id="related-heading" className={styles.heading}>
					Related posts
				</h2>
				<span className={styles.count}>
					{ranked.length} {ranked.length === 1 ? "post" : "posts"}
				</span>
			</div>
			<PostRows posts={ranked} seed={hashStr(currentSlug + ":related")} />
		</section>
	);
}
