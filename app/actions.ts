import fs from "fs";
import path from "path";
import { compileMDX } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import calculateReadTime from "@/utils/calculateReadTime";

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
const PAGE_CONTENT_PATH = "content/pages";

export async function getPost(id: string) {
	"use server";
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

export async function getPage(id: string) {
	"use server";
	const postPath = `${PAGE_CONTENT_PATH}/posts/${id}`;

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

	// Optionally provide a type for your frontmatter object
	const { content, frontmatter } = await compileMDX<FrontmatterType>({
		source: postFile,
		options: { parseFrontmatter: true },
	});
	return { content, frontmatter, link: `/${id}` };
}

export async function getPostsIds() {
	"use server";
	const dirs = fs
		.readdirSync(`${POST_CONTENT_PATH}/`, { withFileTypes: true })
		.filter((item) => item.isDirectory())
		.map((item) => item.name);

	const postIds = dirs.filter((id) => {
		const postDir = path.join(POST_CONTENT_PATH, id);
		const files = fs.readdirSync(postDir);
		const mdxFile = files.find((f) => f.endsWith(".mdx"));
		if (!mdxFile) return false;
		const content = fs.readFileSync(path.join(postDir, mdxFile), "utf8");
		const draftMatch = content.match(/draft:\s*true/);
		return !draftMatch;
	});

	return { postIds };
}
