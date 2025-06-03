import getPageFromSlug from "@/utils/getPageFromSlug";
import { PageProps } from "./types";

export async function generateMetadata() {
	return {
		title: "AKJ.IO - Home of Allan Kimmer Jensen",
	};
}
export default async function FrontPage({ params }: PageProps) {
	const slug = (await params).slug;

	const page = await getPageFromSlug([slug]);

	return <>{page.Component()}</>;
}
