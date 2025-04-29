import { getPost } from "@/app/actions";

type PageProps = Readonly<{
	params: Promise<{ slug: string; lang: string }>;
	searchParams: Promise<{ [key: string]: string }>;
}>;

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
