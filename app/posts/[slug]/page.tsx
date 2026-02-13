import { PageProps } from "@/app/types";
import getPageFromSlug from "@/utils/getPageFromSlug";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import TableOfContents from "@/components/TableOfContents/TableOfContents";
import MobileTocPopover from "@/components/MobileTocPopover/MobileTocPopover";
import { AnchorProvider } from "@/hooks/useActiveHeading";
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

	const { title, description, frontmatter } = page;
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://akj.io";
	const postUrl = `${siteUrl}/posts/${slug}`;

	return {
		title: { default: title, template: "%s | AKJ.IO" },
		description,
		authors: [{ name: "Allan Kimmer Jensen" }],
		keywords: frontmatter.tags,
		openGraph: {
			type: "article",
			url: postUrl,
			title,
			description,
			publishedTime: frontmatter.date
				? new Date(frontmatter.date).toISOString()
				: undefined,
			modifiedTime: frontmatter.updated
				? new Date(frontmatter.updated).toISOString()
				: undefined,
			authors: ["Allan Kimmer Jensen"],
			tags: frontmatter.tags,
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			creator: "@allankimmer",
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
			<AnchorProvider toc={page.toc ?? []}>
				<MobileTocPopover
					entries={page.toc ?? []}
					introLabel={page.frontmatter.subtitle ?? page.frontmatter.description}
				/>
				<div className={styles.postLayout}>
					<aside className={styles.postToc}>
						<TableOfContents
						entries={page.toc ?? []}
						introLabel={page.frontmatter.subtitle ?? page.frontmatter.description}
					/>
					</aside>

					<article className={styles.postContent}>
						<h1>{page.frontmatter.title}</h1>
						<h2>{page.frontmatter.subtitle ?? page.frontmatter.description}</h2>
						{page.frontmatter.date && (
							<div className={styles.postMeta}>
								<time dateTime={page.frontmatter.date}>
									{format(new Date(page.frontmatter.date), "EEEE, MMMM do, yyyy")}
								</time>
								<span>{page.readTime} min read</span>
							</div>
						)}
						{page.Component()}
					</article>
				</div>
			</AnchorProvider>
			<JsonLd data={jsonLd} />
		</>
	);
}
