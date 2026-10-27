import Link from "next/link";
import Colony from "@/components/Colony/Colony";
import InfectedTitle from "@/components/InfectedTitle/InfectedTitle";
import RecentPosts from "@/components/RecentPosts/RecentPosts";
import page from "@/styles/Page.module.css";
import { hashStr } from "@/lib/random";
import { getPostSummaries } from "@/utils/postSummaries";
import MissingPath from "./_components/MissingPath";
import styles from "./not-found.module.css";

export const metadata = {
	title: "Not found",
	// Overrides the layout's index/follow so the page doesn't send both alongside Next's noindex
	robots: { index: false, follow: true },
};

export default async function NotFound() {
	const posts = await getPostSummaries();

	return (
		<div data-layout="full-width">
			<div className={page.column}>
				<Colony
					as="header"
					seed={hashStr("404")}
					inward={0.65}
					reach={70}
					infect
					className={`${page.frame} ${styles.head}`}
				>
					<p className={page.label}>
						404 · <MissingPath className={styles.path} />
					</p>
					<InfectedTitle text="Nothing grew here" className={styles.title} />
					<p className={page.lede}>
						The hyphae followed this path and found nothing to feed on. The page
						may have moved, or it never sprouted in the first place.
					</p>
					<nav aria-label="Ways back" className={styles.actions}>
						<Link href="/" className={`${page.label} grow-underline`}>
							← Back home
						</Link>
						<Link href="/posts" className={`${page.label} grow-underline`}>
							All posts →
						</Link>
					</nav>
				</Colony>
			</div>
			{posts.length > 0 && (
				<div className={`${page.wide} ${page.section}`}>
					<RecentPosts posts={posts} limit={3} />
				</div>
			)}
		</div>
	);
}
