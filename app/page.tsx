import getPageFromSlug from "@/utils/getPageFromSlug";
import { PageProps } from "./types";
import RecentPosts from "@/components/RecentPosts/RecentPosts";
import PopularTags from "@/components/PopularTags/PopularTags";
import Colony from "@/components/Colony/Colony";
import page from "@/styles/Page.module.css";
import { generateHomeSchema } from "@/utils/generateJsonLd";
import JsonLd from "@/components/JsonLd/JsonLd";
import { hashStr } from "@/lib/random";
import { getPostSummaries, tagCounts } from "@/utils/postSummaries";

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
	const [content, posts] = await Promise.all([
		getPageFromSlug([slug]),
		getPostSummaries(),
	]);

	return (
		<>
			<div data-layout="full-width">
				<div className={page.column}>
					<Colony
						as="article"
						seed={hashStr("home")}
						inward={0.25}
						reach={40}
						infect
						className={`${page.frame} prose`}
					>
						{content.Component()}
					</Colony>
				</div>
				<div className={page.wide}>
					<RecentPosts posts={posts} limit={5} />
					<section className={page.section} aria-labelledby="tags-heading">
						<h2 id="tags-heading">Tags</h2>
						<PopularTags tags={tagCounts(posts)} limit={14} />
					</section>
				</div>
			</div>
			<JsonLd data={generateHomeSchema()} />
		</>
	);
}
