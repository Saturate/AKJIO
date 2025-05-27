import getPageFromSlug from "@/utils/getPageFromSlug";
import { PageProps } from "@/app/types";

export async function generateMetadata({ params }: PageProps) {
	const slug = (await params).slug;
	const { frontmatter } = await getPageFromSlug(slug);

	return {
		title: frontmatter.title,
		description: frontmatter.subtitle,
	};
}

export default async function Page({ params }: PageProps) {
	const slug = (await params).slug;
	const page = await getPageFromSlug([slug]);

	return <>{page.Component()}</>;
}
