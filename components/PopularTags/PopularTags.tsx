import Link from "next/link";
import styles from "./PopularTags.module.css";

type Props = { tags: Array<[string, number]>; active?: string; limit?: number };

export default function PopularTags({ tags, active, limit }: Props) {
	const shown = limit ? tags.slice(0, limit) : tags;
	if (!shown.length) return null;
	return (
		<ul className={styles.tags} aria-label="Tags">
			{active && (
				<li>
					<Link href="/posts" className={styles.tag}>
						All
					</Link>
				</li>
			)}
			{shown.map(([tag, count]) => (
				<li key={tag}>
					<Link
						href={`/posts?tag=${encodeURIComponent(tag)}`}
						className={`${styles.tag} ${tag === active ? styles.active : ""}`}
						aria-current={tag === active ? "page" : undefined}
					>
						{tag}
						<span className={styles.count}>{count}</span>
					</Link>
				</li>
			))}
		</ul>
	);
}
