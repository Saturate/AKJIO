import { getPost } from "@/app/actions";

export default async function TestPage({
	params,
}: {
	params: { slug: string };
}) {
	const { content, frontmatter } = await getPost(params.slug);

	return (
		<>
			{params.slug}
			<h1>{frontmatter.title}</h1>
			{content}
		</>
	);
}
