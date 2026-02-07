import { PageProps } from "@/app/types";
import getPageFromSlug from "@/utils/getPageFromSlug";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import TableOfContents from "@/components/TableOfContents/TableOfContents";
import styles from "./page.module.css";
import { format } from "date-fns";
import { generateBlogPostingSchema } from "@/utils/generateJsonLd";
import JsonLd from "@/components/JsonLd/JsonLd";

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const slug = (await params).slug;
	const page = await getPageFromSlug(["posts", slug]);

	if (!page) {
		return notFound();
	}

	const { title, description } = page;
	return {
		title: { default: title, template: "%s | AKJ.IO" },
		description: description,
		openGraph: {
			title,
			description: description,
		},
	};
}

export default async function BlogPostPage({ params }: PageProps) {
	const slug = (await params).slug;
	const page = await getPageFromSlug(["posts", slug]);

	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://akj.io";
	const postUrl = `${siteUrl}/posts/${slug}`;

	const jsonLd = generateBlogPostingSchema(
		{
			title: page.frontmatter.title,
			description: page.frontmatter.description,
			subtitle: page.frontmatter.subtitle,
			date: page.frontmatter.date,
			updated: page.frontmatter.updated,
			tags: page.frontmatter.tags,
		},
		postUrl,
	);

	return (
		<>
			<div className={styles.postLayout}>
				<article className={styles.postContent}>
					<h1>{page.frontmatter.title}</h1>
					<h2>{page.frontmatter.subtitle ?? page.frontmatter.description}</h2>
					{page.frontmatter.date && (
						<time className={styles.postDate} dateTime={page.frontmatter.date}>
							{format(new Date(page.frontmatter.date), "EEEE, MMMM do, yyyy")}
						</time>
					)}
					{page.Component()}
				</article>

				{page.toc && page.toc.length > 0 && (
					<aside className={styles.postSidebar}>
						<TableOfContents entries={page.toc} />
					</aside>
				)}
			</div>
			<JsonLd data={jsonLd} />
		</>
	);
}
