import Link from "next/link";
import TableOfContents from "@/components/TableOfContents/TableOfContents";
import MobileTocPopover from "@/components/MobileTocPopover/MobileTocPopover";
import { AnchorProvider } from "@/hooks/useActiveHeading";
import styles from "./PostLayout.module.css";
import { format } from "date-fns";
import { generateBlogPostingSchema } from "@/utils/generateJsonLd";
import JsonLd from "@/components/JsonLd/JsonLd";
import Comments from "@/components/Comments/Comments";
import SeriesNav from "@/components/SeriesNav/SeriesNav";
import Sources from "@/components/Sources/Sources";
import Colony from "@/components/Colony/Colony";
import InfectedTitle from "@/components/InfectedTitle/InfectedTitle";
import RelatedPosts from "@/components/RelatedPosts/RelatedPosts";
import { hashStr } from "@/lib/random";
import type { TOCEntry } from "@/utils/generateTableOfContentsFromMarkdown";
import { SITE_URL } from "@/lib/site";

type PostLayoutProps = {
	slug: string;
	Component: React.ComponentType;
	frontmatter: {
		title: string;
		subtitle?: string;
		description?: string;
		date: string;
		updated?: string;
		series?: string;
		tags?: string[];
		sources?: Array<{ title: string; url: string }>;
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
	const postUrl = `${SITE_URL}/${slug}`;
	const introLabel = frontmatter.subtitle ?? frontmatter.description ?? "";
	const updated =
		frontmatter.updated && frontmatter.updated !== frontmatter.date
			? frontmatter.updated
			: null;

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
				<MobileTocPopover entries={toc} introLabel={introLabel} />
				<div className={styles.layout} data-layout="full-width">
					<article className={styles.article}>
						<Colony
							as="header"
							className={styles.head}
							seed={hashStr(slug)}
							inward={0.65}
							reach={70}
							infect
						>
							<InfectedTitle
								text={frontmatter.title}
								className={styles.title}
							/>
							{introLabel && <p className={styles.lede}>{introLabel}</p>}
							<dl className={styles.meta}>
								{frontmatter.date && (
									<div>
										<dt>Published</dt>
										<dd>
											<time dateTime={frontmatter.date}>
												{format(new Date(frontmatter.date), "MMM d, yyyy")}
											</time>
										</dd>
									</div>
								)}
								{updated && (
									<div>
										<dt>Updated</dt>
										<dd>
											<time dateTime={updated}>
												{format(new Date(updated), "MMM d, yyyy")}
											</time>
										</dd>
									</div>
								)}
								<div>
									<dt>Reading</dt>
									<dd>{readTime} min</dd>
								</div>
								{frontmatter.tags && frontmatter.tags.length > 0 && (
									<div className={styles.tagsRow}>
										<dt>Tags</dt>
										<dd className={styles.tags}>
											{frontmatter.tags.map((tag) => (
												<Link
													key={tag}
													href={`/posts?tag=${encodeURIComponent(tag)}`}
													className={styles.tag}
												>
													{tag}
												</Link>
											))}
										</dd>
									</div>
								)}
							</dl>
						</Colony>

						<div className="prose">
							<Component />
						</div>
						{frontmatter.sources && frontmatter.sources.length > 0 && (
							<Sources sources={frontmatter.sources} />
						)}
						{frontmatter.series && (
							<SeriesNav seriesName={frontmatter.series} currentSlug={slug} />
						)}
						<Comments />
					</article>

					<aside className={styles.toc}>
						<div className={styles.tocInner}>
							<TableOfContents entries={toc} introLabel={introLabel} />
						</div>
					</aside>

					<div className={styles.below}>
						<RelatedPosts currentSlug={slug} tags={frontmatter.tags ?? []} />
					</div>
				</div>
			</AnchorProvider>
			<JsonLd data={jsonLd} />
		</>
	);
}
