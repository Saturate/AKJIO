import { getPost } from "@/app/actions";
import { PageProps } from "@/app/types";

export default async function BlogPostPage({ params }: PageProps) {
	const slug = (await params).slug;
	const { content, frontmatter } = await getPost(slug);

	return (
		<>
			<h1>{frontmatter.title}</h1>
			<h2>{frontmatter.subtitle}</h2>
			{content}
		</>
	);
}
