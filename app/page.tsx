import getPageFromSlug from "@/utils/getPageFromSlug";
import { PageProps } from "./types";
import RecentPosts from "@/components/RecentPosts/RecentPosts";
import PopularTags from "@/components/PopularTags/PopularTags";
import styles from "./page.module.css";
import {
	generatePersonSchema,
	generateOrganizationSchema,
} from "@/utils/generateJsonLd";
import JsonLd from "@/components/JsonLd/JsonLd";
import { getNonce } from "@/utils/nonce";

export async function generateMetadata() {
	return {
		title: "AKJ.IO - Home of Allan Kimmer Jensen",
		alternates: {
			canonical: "/",
			types: {
				"application/rss+xml": "https://akj.io/feed",
				"text/markdown": "https://akj.io/llm.txt",
			},
		},
	};
}
export default async function FrontPage({ params }: PageProps) {
	const slug = (await params).slug;

	const page = await getPageFromSlug([slug]);
	const nonce = await getNonce();

	const personJsonLd = generatePersonSchema();
	const orgJsonLd = generateOrganizationSchema();

	return (
		<>
			<div className={styles.homeLayout} data-layout="full-width">
				<article className={styles.greeting}>{page.Component()}</article>
				<aside className={styles.recentWork}>
					<RecentPosts limit={5} />
					<PopularTags limit={10} />
				</aside>
			</div>
			<JsonLd data={personJsonLd} nonce={nonce} />
			<JsonLd data={orgJsonLd} nonce={nonce} />
		</>
	);
}
