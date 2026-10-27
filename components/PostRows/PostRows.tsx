import Link from "next/link";
import { format } from "date-fns";
import Colony from "@/components/Colony/Colony";
import styles from "./PostRows.module.css";

export type PostRow = {
	link: string;
	title: string;
	date: Date | string;
	readTime: number;
	lede?: string;
};

export default function PostRows({
	posts,
	seed,
}: {
	posts: PostRow[];
	seed: number;
}) {
	if (!posts.length) return null;
	return (
		<Colony seed={seed} inward={0.15} reach={24} className={styles.list}>
			{posts.map((p) => (
				<Link key={p.link} href={p.link} className={styles.row}>
					<time
						className={styles.date}
						dateTime={new Date(p.date).toISOString()}
					>
						{format(new Date(p.date), "MMM dd, yyyy")}
					</time>
					<span className={styles.main}>
						<span className={styles.title}>{p.title}</span>
						{p.lede && <span className={styles.lede}>{p.lede}</span>}
					</span>
					<span className={styles.read}>{p.readTime} min</span>
				</Link>
			))}
		</Colony>
	);
}
