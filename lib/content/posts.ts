import fs from "fs";
import path from "path";
import { parseFrontmatter, type PostFrontmatter } from "./frontmatter";

const POST_CONTENT_PATH = "content/posts";
const SLUG = /^[a-z0-9-]+$/;

export interface PostEntry {
	id: string;
	content: string;
	frontmatter: PostFrontmatter;
}

function postFile(id: string): string | null {
	const postDir = path.join(process.cwd(), POST_CONTENT_PATH, id);
	if (!fs.existsSync(postDir) || !fs.statSync(postDir).isDirectory()) return null;
	const mdxFile = fs.readdirSync(postDir).find((f) => f.endsWith(".mdx"));
	return mdxFile ? path.join(postDir, mdxFile) : null;
}

// Published posts only; drafts stay reachable by URL but stay out of listings
export function readAllPosts(): PostEntry[] {
	const postsPath = path.join(process.cwd(), POST_CONTENT_PATH);

	return fs
		.readdirSync(postsPath, { withFileTypes: true })
		.filter((item) => item.isDirectory())
		.flatMap(({ name: id }) => {
			const file = postFile(id);
			if (!file) return [];
			const content = fs.readFileSync(file, "utf8");
			const frontmatter = parseFrontmatter(content, id);
			return frontmatter.draft ? [] : [{ id, content, frontmatter }];
		});
}

// Slug comes from the URL, so it's checked before it becomes part of a path
export function readPostContent(slug: string): string | null {
	if (!SLUG.test(slug)) return null;
	const file = postFile(slug);
	return file ? fs.readFileSync(file, "utf8") : null;
}
