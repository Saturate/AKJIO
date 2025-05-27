import { getPost, getPostsIds } from "@/app/actions";
import { format as formatDate } from "date-fns";
import Link from "next/link";

function ArticleExcerpt({
	link,
	title,
	date,
	subtitle,
}: {
	link: string;
	title: string;
	date: Date;
	subtitle: string;
}) {
	return (
		<article
			className="post"
			itemType="http://schema.org/BlogPosting"
			role="article"
		>
			<h1>
				<Link href={link}>{title}</Link>
			</h1>
			<time dateTime="{{ post.data.date | date('Y-m-d') }}">
				{formatDate(date, "do LLLL yyyy")}
			</time>
			<p itemProp="description">
				{subtitle}
				<a className="read-more" href={link}>
					»
				</a>
			</p>
		</article>
	);
}

export default async function PostsOverviewPage({}) {
	const { postIds } = await getPostsIds();

	console.log("hiihihihii");

	const teasers = await Promise.all(
		postIds.map(async (id) => {
			console.log("mapping", id);
			return await getPost(id);
		}),
	);

	console.log(teasers);

	const sortedByDateTeasers = teasers
		.sort((a, b) => {
			return (
				new Date(b.frontmatter.date).getTime() -
				new Date(a.frontmatter.date).getTime()
			);
		})
		.map(({ frontmatter, link }) => {
			return (
				<ArticleExcerpt key={frontmatter.title} {...frontmatter} link={link} />
			);
		});

	console.log(postIds, sortedByDateTeasers);

	return <>{sortedByDateTeasers}</>;
}
