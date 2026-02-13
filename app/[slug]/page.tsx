import { findPageBySlug } from "@/utils/getPageFromSlug";
import { PageProps } from "@/app/types";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import PostLayout from "./_components/PostLayout";

async function resolveSlug(slug: string) {
	const post = await findPageBySlug(["posts", slug]);
	if (post) return { kind: "post" as const, page: post };

	const generic = await findPageBySlug([slug]);
	if (generic) return { kind: "page" as const, page: generic };

	return null;
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const slug = (await params).slug;
	const resolved = await resolveSlug(slug);

	if (!resolved) return {};

	const { kind, page } = resolved;
	const { title, description, frontmatter } = page;

	if (kind === "post") {
		const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://akj.io";
		const postUrl = `${siteUrl}/${slug}`;

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

	return {
		title: frontmatter.title,
		description: frontmatter.subtitle,
	};
}

export default async function Page({ params }: PageProps) {
	const slug = (await params).slug;
	const resolved = await resolveSlug(slug);

	if (!resolved) notFound();

	const { kind, page } = resolved;

	if (kind === "post") {
		return (
			<PostLayout
				slug={slug}
				Component={page.Component}
				frontmatter={page.frontmatter}
				toc={page.toc ?? []}
				readTime={page.readTime}
			/>
		);
	}

	return <>{page.Component()}</>;
}
