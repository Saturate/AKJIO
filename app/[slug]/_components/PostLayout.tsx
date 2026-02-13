import TableOfContents from "@/components/TableOfContents/TableOfContents";
import MobileTocPopover from "@/components/MobileTocPopover/MobileTocPopover";
import { AnchorProvider } from "@/hooks/useActiveHeading";
import styles from "./PostLayout.module.css";
import { format } from "date-fns";
import { generateBlogPostingSchema } from "@/utils/generateJsonLd";
import JsonLd from "@/components/JsonLd/JsonLd";
import Comments from "@/components/Comments/Comments";
import type { TOCEntry } from "@/utils/generateTableOfContentsFromMarkdown";

type PostLayoutProps = {
	slug: string;
	Component: React.ComponentType;
	frontmatter: {
		title: string;
		subtitle?: string;
		description?: string;
		date: string;
		updated?: string;
		tags?: string[];
	};
	toc: TOCEntry[];
	readTime: number;
};

export default function PostLayout({
	slug,
	Component,
	frontmatter,
	toc,
	readTime,
}: PostLayoutProps) {
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://akj.io";
	const postUrl = `${siteUrl}/${slug}`;
	const introLabel = frontmatter.subtitle ?? frontmatter.description ?? "";

	const jsonLd = generateBlogPostingSchema(
		{
			title: frontmatter.title,
			description: frontmatter.description,
			subtitle: frontmatter.subtitle,
			date: frontmatter.date,
			updated: frontmatter.updated,
			tags: frontmatter.tags,
		},
		postUrl,
	);

	return (
		<>
			<AnchorProvider toc={toc}>
				<MobileTocPopover
					entries={toc}
					introLabel={introLabel}
				/>
				<div className={styles.postLayout}>
					<aside className={styles.postToc}>
						<TableOfContents
							entries={toc}
							introLabel={introLabel}
						/>
					</aside>

					<article className={styles.postContent}>
						<h1>{frontmatter.title}</h1>
						<h2>{frontmatter.subtitle ?? frontmatter.description}</h2>
						{frontmatter.date && (
							<div className={styles.postMeta}>
								<time dateTime={frontmatter.date}>
									{format(new Date(frontmatter.date), "EEEE, MMMM do, yyyy")}
								</time>
								<span>{readTime} min read</span>
							</div>
						)}
						<Component />
						<Comments />
					</article>
				</div>
			</AnchorProvider>
			<JsonLd data={jsonLd} />
		</>
	);
}
