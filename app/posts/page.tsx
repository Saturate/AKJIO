import { getPost, getPostsIds } from "@/app/actions";
import ArticleExcerpt from "@/components/ArticleExcerpt/ArticleExcerpt";
import styles from "../../styles/Home.module.css";

export default async function PostsOverviewPage({}) {
	const { postIds } = await getPostsIds();

	const teasers = await Promise.all(
		postIds.map(async (id) => {
			return await getPost(id);
		}),
	);

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

	return (
		<main>
			<section className={styles.content}>{sortedByDateTeasers}</section>
		</main>
	);
}
