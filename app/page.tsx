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
import Colony from "@/components/Colony/Colony";
import { hashStr } from "@/lib/random";

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
				<Colony as="article" seed={hashStr("home")} inward={0.4} reach={40} className={`${styles.mainContent} glassPanel`}>
					{page.Component()}
				</Colony>
				<div className={`${styles.sidebar} glassPanel`}>
					<RecentPosts limit={3} />
					<PopularTags limit={10} />
				</div>
			</div>
			<JsonLd data={personJsonLd} nonce={nonce} />
			<JsonLd data={orgJsonLd} nonce={nonce} />
		</>
	);
}
