import { PageProps } from "@/app/types";
import TableOfContents from "@/components/TableOfContent/TableOfContents";
import getPageFromSlug from "@/utils/getPageFromSlug";
import { Metadata } from "next";
import { notFound } from "next/navigation";

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
		<>
			<h1>{frontmatter.title}</h1>
			<h2>{frontmatter.subtitle ?? frontmatter.description}</h2>
			{Component()}

			<TableOfContents tableOfContents={toc} />
		</>
	);
}
