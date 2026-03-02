import Link from "next/link";
import { getPost, getPostsIds } from "@/app/actions";
import styles from "./SeriesNav.module.css";

interface SeriesNavProps {
	seriesName: string;
	currentSlug: string;
}

export default async function SeriesNav({
	seriesName,
	currentSlug,
}: SeriesNavProps) {
	const { postIds } = await getPostsIds();

	const posts = await Promise.all(
		postIds.map(async (id) => {
			const post = await getPost(id);
			return { id, ...post };
		}),
	);

	const seriesPosts = posts
		.filter((post) => post.frontmatter.series === seriesName)
		.sort(
			(a, b) =>
				new Date(a.frontmatter.date).getTime() -
				new Date(b.frontmatter.date).getTime(),
		);

	if (seriesPosts.length < 2) return null;

	const currentIndex = seriesPosts.findIndex((p) => p.id === currentSlug);

	return (
		<nav className={styles.seriesNav} aria-label={`${seriesName} series`}>
			<p className={styles.seriesLabel}>
				{seriesName}
				<span className={styles.partCount}>
					{" · "}Part {currentIndex + 1} of {seriesPosts.length}
				</span>
			</p>
			<ol className={styles.seriesList}>
				{seriesPosts.map((post) => {
					const isCurrent = post.id === currentSlug;
					return (
						<li key={post.id} className={isCurrent ? styles.current : undefined}>
							{isCurrent ? (
								<span>
									{post.frontmatter.title}
								</span>
							) : (
								<Link href={post.link}>
									{post.frontmatter.title}
								</Link>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
