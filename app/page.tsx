import getPageFromSlug from "@/utils/getPageFromSlug";
import { PageProps } from "./types";
import styles from "../styles/Home.module.css";

export async function generateMetadata() {
	return {
		title: "Allan Kimmer Jensen",
	};
}
export default async function FrontPage({ params }: PageProps) {
	const slug = (await params).slug;

	const page = await getPageFromSlug([slug]);

	return (
		<main>
			<section className={styles.content}>{page.Component()}</section>
		</main>
	);
}
