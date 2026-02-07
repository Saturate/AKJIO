import getPageFromSlug from "@/utils/getPageFromSlug";
import { PageProps } from "./types";
import RecentPosts from "@/components/RecentPosts/RecentPosts";
import PopularTags from "@/components/PopularTags/PopularTags";
import styles from "./page.module.css";
import {
	generatePersonSchema,
	generateOrganizationSchema,
	serializeJsonLd,
} from "@/utils/generateJsonLd";

export async function generateMetadata() {
	return {
		title: "AKJ.IO - Home of Allan Kimmer Jensen",
	};
}
export default async function FrontPage({ params }: PageProps) {
	const slug = (await params).slug;

	const page = await getPageFromSlug([slug]);

	const personJsonLd = generatePersonSchema();
	const orgJsonLd = generateOrganizationSchema();

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: serializeJsonLd(personJsonLd) }}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: serializeJsonLd(orgJsonLd) }}
			/>
			<div className={styles.homeLayout}>
				<article className={styles.mainContent}>{page.Component()}</article>
				<div className={styles.sidebar}>
					<RecentPosts limit={3} />
					<PopularTags limit={10} />
				</div>
			</div>
		</>
	);
}
