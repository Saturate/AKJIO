import { getPage } from "../actions";
import { PageProps } from "@/app/types";

export async function generateMetadata({ params }: PageProps) {
	const slug = (await params).slug;
	const { frontmatter } = await getPage(slug);

	return {
		title: frontmatter.title,
		description: frontmatter.subtitle,
	};
}

export default async function Page({ params }: PageProps) {
	const slug = (await params).slug;
	const { content, frontmatter } = await getPage(slug);

	console.log("page", slug, content, frontmatter);

	return <>{content}</>;
}
