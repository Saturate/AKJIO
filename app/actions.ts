import fs from "fs";
import path from "path";
import { compileMDX } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";

type FrontmatterType = {
	title: string;
	subtitle: string;
	date: Date;
};

const POST_CONTENT_PATH = "content/posts";
const PAGE_CONTENT_PATH = "content/pages";

export async function getPost(id: string) {
	"use server";
	const postPath = `${POST_CONTENT_PATH}/${id}/${id}`;

	// Some old blogs (well not many), use .md ext check if it exists
	const postFileExt = ["md", "mdx"].find((ext) => {
		console.log(path.join(process.cwd(), `./${postPath}.${ext}`));

		return fs.existsSync(path.join(process.cwd(), `./${postPath}.${ext}`));
	});

	if (!postFileExt) {
		notFound();
	}

	const postFile = fs.readFileSync(
		path.join(process.cwd(), `./${postPath}.${postFileExt}`),
		"utf8"
	);

	// Optionally provide a type for your frontmatter object
	const { content, frontmatter } = await compileMDX<FrontmatterType>({
		source: postFile,
		options: { parseFrontmatter: true },
	});
	return { content, frontmatter, link: `/posts/${id}` };
}

export async function getPage(id: string) {
	"use server";
	const postPath = `${PAGE_CONTENT_PATH}/${id}`;

	// Some old blogs (well not many), use .md ext check if it exists
	const postFileExt = ["md", "mdx"].find((ext) => {
		console.log(path.join(process.cwd(), `./${postPath}.${ext}`));

		return fs.existsSync(path.join(process.cwd(), `./${postPath}.${ext}`));
	});

	if (!postFileExt) {
		notFound();
	}

	const postFile = fs.readFileSync(
		path.join(process.cwd(), `./${postPath}.${postFileExt}`),
		"utf8"
	);

	// Optionally provide a type for your frontmatter object
	const { content, frontmatter } = await compileMDX<FrontmatterType>({
		source: postFile,
		options: { parseFrontmatter: true },
	});
	return { content, frontmatter, link: `/${id}` };
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
