import fs from "fs";
import path from "path";
import { compileMDX } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import calculateReadTime from "@/utils/calculateReadTime";
import { readAllPosts } from "./posts";

type FrontmatterType = {
	title: string;
	subtitle: string;
	description?: string;
	date: Date;
	updated?: Date;
	series?: string;
	tags?: string[];
	sources?: Array<{ title: string; url: string }>;
	draft?: boolean;
};

const POST_CONTENT_PATH = "content/posts";

export async function getPost(id: string) {
	const postPath = `${POST_CONTENT_PATH}/${id}`;

	// Some old blogs (well not many), use .md ext check if it exists
	const postFileExt = [
		`./${postPath}/${id}.mdx`,
		`./${postPath}/index.mdx`,
	].find((filePath) => {
		return fs.existsSync(path.join(process.cwd(), filePath));
	});

	if (!postFileExt) {
		notFound();
	}

	const postFile = fs.readFileSync(
		path.join(process.cwd(), postFileExt),
		"utf8",
	);

	const { content, frontmatter } = await compileMDX<FrontmatterType>({
		source: postFile,
		options: { parseFrontmatter: true },
	});
	const readTime = calculateReadTime(postFile);
	return { content, frontmatter, link: `/${id}`, readTime };
}

export async function getPostsIds() {
	return { postIds: readAllPosts().map(({ id }) => id) };
}
