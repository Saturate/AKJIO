import fs from "fs";
import { compileMDX } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";

type FrontmatterType = {
	title: string;
	subtitle: string;
	date: Date;
};

const POST_CONTENT_PATH = "content/posts";

export async function getPost(id: string) {
	"use server";
	const path = `${POST_CONTENT_PATH}/${id}/${id}`;

	// Some old blogs (well not many), use .md ext check if it exists
	const postFileExt = ["md", "mdx"].find((ext) => {
		return fs.existsSync(`${path}.${ext}`);
	});

	if (!postFileExt) {
		notFound();
	}

	const postFile = fs.readFileSync(`${path}.${postFileExt}`, "utf8");

	// Optionally provide a type for your frontmatter object
	const { content, frontmatter } = await compileMDX<FrontmatterType>({
		source: postFile,
		options: { parseFrontmatter: true },
	});
	return { content, frontmatter, link: `/posts/${id}` };
}

export async function getPostsIds() {
	"use server";
	const postIds = fs
		.readdirSync(`${POST_CONTENT_PATH}/`, { withFileTypes: true })
		.filter((item) => item.isDirectory() && item.name !== "_drafts")
		.map((item) => item.name);

	console.log(postIds);

	return { postIds };
}
