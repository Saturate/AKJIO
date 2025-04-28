import { getPost } from "@/app/actions";

type PageProps = Readonly<{
	params: Promise<{ slug: string; lang: string }>;
	searchParams: Promise<{ [key: string]: string }>;
}>;

export default async function TestPage({ params }: PageProps) {
	const slug = (await params).slug;
	const { content, frontmatter } = await getPost(slug);

	return (
		<>
			{slug}
			<h1>{frontmatter.title}</h1>
			{content}
		</>
	);
}
