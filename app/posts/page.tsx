import { getPost, getPostsIds } from "@/app/actions";
import ArticleExcerpt from "@/components/ArticleExcerpt/ArticleExcerpt";
import Link from "next/link";
import type { Metadata } from "next";

type Props = {
	searchParams: Promise<{ tag?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
	const { tag } = await searchParams;

	if (tag) {
		return {
			title: `Posts tagged "${tag}" - AKJ.IO`,
			description: `Blog posts and articles about ${tag} by Allan Kimmer Jensen`,
		};
	}

	return {
		title: "Posts - AKJ.IO",
		description: "Writing about security, frontend development, architecture, and software engineering.",
	};
}

export default async function PostsOverviewPage({ searchParams }: Props) {
	const { tag } = await searchParams;
	const { postIds } = await getPostsIds();

	const posts = await Promise.all(
		postIds.map(async (id) => {
			return await getPost(id);
		}),
	);

	// Filter by tag if provided
	const filteredPosts = tag
		? posts.filter((post) => post.frontmatter.tags?.includes(tag))
		: posts;

	const sortedPosts = filteredPosts
		.sort((a, b) => {
			return (
				new Date(b.frontmatter.date).getTime() -
				new Date(a.frontmatter.date).getTime()
			);
		})
		.map(({ frontmatter, link }) => {
			return (
				<ArticleExcerpt key={frontmatter.title} {...frontmatter} link={link} />
			);
		});

	return (
		<>
			{tag && (
				<div style={{ marginBottom: "2rem" }}>
					<p>
						Showing posts tagged with: <strong>{tag}</strong>
					</p>
					<Link href="/posts">← Clear filter</Link>
				</div>
			)}
			{sortedPosts.length === 0 && (
				<p>No posts found {tag && `with tag "${tag}"`}.</p>
			)}
			{sortedPosts}
		</>
	);
}
