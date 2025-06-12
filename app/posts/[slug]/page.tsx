import { PageProps } from "@/app/types";
import TableOfContents from "@/components/TableOfContent/TableOfContents";
import getPageFromSlug from "@/utils/getPageFromSlug";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import styles from "./page.module.css";

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
		title: { default: title, template: "%s • Allan Kimmer Jensen" },
		description: description,
		openGraph: {
			title,
			description: description,
		},
	};
}

export default async function BlogPostPage({ params }: PageProps) {
	const slug = (await params).slug;
	const { Component, toc, frontmatter } = await getPageFromSlug([
		"posts",
		slug,
	]);

	return (
		<article className={styles.main}>
			<div className={styles.content} data-content="true">
				<h1>{frontmatter.title}</h1>
				<h2>{frontmatter.subtitle ?? frontmatter.description}</h2>
				{frontmatter?.author ? <p>Author: {frontmatter?.author}</p> : null}
				{Component()}
			</div>
			<aside>
				<TableOfContents className={styles.stickyToc} tableOfContents={toc} />
			</aside>
		</article>
	);
}
