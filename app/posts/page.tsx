import type { Metadata } from "next";
import Colony from "@/components/Colony/Colony";
import PostRows from "@/components/PostRows/PostRows";
import PopularTags from "@/components/PopularTags/PopularTags";
import JsonLd from "@/components/JsonLd/JsonLd";
import page from "@/styles/Page.module.css";
import { generateCollectionPageSchema } from "@/utils/generateJsonLd";
import { getPostSummaries, tagCounts } from "@/utils/postSummaries";
import { hashStr } from "@/lib/random";
import { SITE_URL } from "@/lib/site";

type Props = {
	searchParams: Promise<{ tag?: string }>;
};

export async function generateMetadata({
	searchParams,
}: Props): Promise<Metadata> {
	const { tag } = await searchParams;

	if (tag) {
		return {
			title: `Posts tagged "${tag}" - AKJ.IO`,
			description: `Blog posts and articles about ${tag} by Allan Kimmer Jensen`,
			alternates: {
				canonical: `/posts?tag=${tag}`,
			},
		};
	}

	return {
		title: "Posts - AKJ.IO",
		description:
			"Writing about security, frontend development, architecture, and software engineering.",
		alternates: {
			canonical: "/posts",
		},
	};
}

export default async function PostsOverviewPage({ searchParams }: Props) {
	const { tag } = await searchParams;
	const all = await getPostSummaries();
	const posts = tag ? all.filter((p) => p.tags.includes(tag)) : all;

	const jsonLd = generateCollectionPageSchema(
		posts.map((p) => ({
			title: p.title,
			description: p.description,
			subtitle: p.subtitle,
			date: p.date instanceof Date ? p.date.toISOString() : p.date,
			tags: p.tags,
			url: `${SITE_URL}${p.link}`,
		})),
	);

	return (
		<div data-layout="full-width">
			<div className={page.wide}>
				<Colony
					as="header"
					seed={hashStr("posts:" + (tag ?? ""))}
					inward={0.4}
					reach={40}
					className={`${page.frame} ${page.head}`}
				>
					<h1>{tag ? `Posts on ${tag}` : "Posts"}</h1>
					<p className={page.lede}>
						{tag
							? `${posts.length} ${posts.length === 1 ? "post" : "posts"} tagged ${tag}.`
							: "Security research, CTF writeups, frontend and the odd hardware project."}
					</p>
					{/* One-off tags would bury the useful ones; they stay reachable from each post. */}
					<PopularTags
						tags={tagCounts(all).filter(([t, n]) => n > 1 || t === tag)}
						active={tag}
					/>
				</Colony>
				{posts.length ? (
					<PostRows
						posts={posts.map((p) => ({
							...p,
							lede: p.subtitle || p.description,
						}))}
						seed={hashStr("posts:list:" + (tag ?? ""))}
					/>
				) : (
					<p className={page.label}>No posts tagged {tag}.</p>
				)}
			</div>
			<JsonLd data={jsonLd} />
		</div>
	);
}
