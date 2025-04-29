import { title } from "process";
import { PageProps } from "./types";

export async function generateMetadata(props: Readonly<PageProps>) {
	return {
		title: "AKJ.IO - Home of Allan Kimmer Jensen",
	};
}
export default async function FrontPage() {
	return (
		<>
			<h1>Hi! 👋</h1>
			<p>
				This website is being rebuild. Didn&apos;t look at it for too
				many years, and now i decided that it was time.
			</p>
		</>
	);
}
