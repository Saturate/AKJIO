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
		series?: string;
		tags?: string[];
		sources?: Array<{ title: string; url: string }>;
	};
	toc: TOCEntry[];
	readTime: number;
	nonce?: string;
};

export default function PostLayout({
	slug,
	Component,
	frontmatter,
	toc,
	readTime,
	nonce,
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
				<MobileTocPopover entries={toc} introLabel={introLabel} />
				<div className={styles.postLayout}>
					<aside className={styles.postToc}>
						<TableOfContents entries={toc} introLabel={introLabel} />
					</aside>

					<div className={styles.postPanel}>
						<svg width="0" height="0" aria-hidden="true">
							<defs>
								<clipPath id="organic-mask" clipPathUnits="objectBoundingBox">
									<path
										d="
									M 0.015,0.002
									C 0.08,0.0005 0.18,0.0015 0.30,0.0008
									C 0.42,0.0004 0.56,0.0018 0.68,0.001
									C 0.80,0.0005 0.90,0.0015 0.985,0.002
									C 0.994,0.015 0.989,0.06 0.993,0.15
									C 0.997,0.30 0.989,0.50 0.993,0.65
									C 0.997,0.80 0.990,0.90 0.993,0.94
									C 0.995,0.975 0.992,0.99 0.985,0.998
									C 0.90,0.9995 0.80,0.998 0.68,0.999
									C 0.56,0.9995 0.42,0.998 0.30,0.999
									C 0.18,0.9995 0.08,0.998 0.015,0.998
									C 0.008,0.99 0.011,0.975 0.007,0.94
									C 0.003,0.90 0.011,0.80 0.007,0.65
									C 0.003,0.50 0.011,0.30 0.007,0.15
									C 0.004,0.06 0.009,0.015 0.015,0.002
									Z
								"
									/>
								</clipPath>
							</defs>
						</svg>
						<article className={`${styles.postContent} glassPanel`}>
							<h1>{frontmatter.title}</h1>
							<h2>{frontmatter.subtitle ?? frontmatter.description}</h2>
							{frontmatter.date && (
								<div className={styles.postMeta}>
									<time dateTime={frontmatter.date}>
										{format(new Date(frontmatter.date), "EEEE, MMMM do, yyyy")}
									</time>
									{frontmatter.updated &&
										frontmatter.updated !== frontmatter.date && (
											<span>
												Updated{" "}
												<time dateTime={frontmatter.updated}>
													{format(
														new Date(frontmatter.updated),
														"MMMM do, yyyy",
													)}
												</time>
											</span>
										)}
									<span>{readTime} min read</span>
								</div>
							)}
							<Component />
							{frontmatter.sources && frontmatter.sources.length > 0 && (
								<Sources sources={frontmatter.sources} />
							)}
							{frontmatter.series && (
								<SeriesNav seriesName={frontmatter.series} currentSlug={slug} />
							)}
							<Comments />
						</article>
					</div>
				</div>
			</AnchorProvider>
			<JsonLd data={jsonLd} nonce={nonce} />
		</>
	);
}
