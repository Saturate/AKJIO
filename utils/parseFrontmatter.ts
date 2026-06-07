import fs from "fs";
import path from "path";

const POST_CONTENT_PATH = "content/posts";

export interface PostFrontmatter {
	title: string;
	subtitle?: string;
	description?: string;
	date?: string;
	tags: string[];
}

/**
 * Handles both inline array tags: ["a", "b"] and YAML list tags.
 */
export function parseFrontmatter(
	content: string,
	fallbackTitle: string = "",
): PostFrontmatter {
	const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
	const fm = fmMatch?.[1] ?? content;

	const titleMatch = fm.match(/title:\s*(["'])(.+?)\1/);
	const subtitleMatch = fm.match(/subtitle:\s*(["'])(.+?)\1/);
	const descriptionMatch = fm.match(/description:\s*(["'])(.+?)\1/);
	const dateMatch = fm.match(/date:\s*["']?(\d{4}-\d{2}-\d{2})/);

	const inlineTagsMatch = fm.match(/tags:\s*\[(.*?)\]/s);
	const yamlTagsMatch = fm.match(/tags:\s*\n((?:\s+-\s+.+\n?)+)/);

	let tags: string[] = [];
	if (inlineTagsMatch) {
		tags = inlineTagsMatch[1]
			.split(",")
			.map((t) => t.trim().replace(/['"]/g, ""))
			.filter((t) => t.length > 0);
	} else if (yamlTagsMatch) {
		tags = yamlTagsMatch[1]
			.split("\n")
			.map((line) => line.replace(/^\s+-\s+/, "").trim())
			.filter((t) => t.length > 0);
	}

	return {
		title: titleMatch?.[2] ?? fallbackTitle,
		subtitle: subtitleMatch?.[2],
		description: descriptionMatch?.[2],
		date: dateMatch?.[1],
		tags,
	};
}

export interface PostEntry {
	id: string;
	content: string;
}

export function readAllPosts(): PostEntry[] {
	const postIds = fs
		.readdirSync(POST_CONTENT_PATH, { withFileTypes: true })
		.filter((item) => item.isDirectory() && item.name !== "_drafts")
		.map((item) => item.name);

	return postIds
		.map((id) => {
			const postPath = path.join(POST_CONTENT_PATH, id);
			const files = fs.readdirSync(postPath);
			const mdxFile = files.find((f) => f.endsWith(".mdx"));
			if (!mdxFile) return null;
			const content = fs.readFileSync(path.join(postPath, mdxFile), "utf8");
			return { id, content };
		})
		.filter((p): p is PostEntry => p !== null);
}

export function readPostContent(slug: string): string | null {
	const postDir = path.join(process.cwd(), POST_CONTENT_PATH, slug);
	if (!fs.existsSync(postDir)) return null;
	const files = fs.readdirSync(postDir);
	const mdxFile = files.find((f) => f.endsWith(".mdx"));
	if (!mdxFile) return null;
	return fs.readFileSync(path.join(postDir, mdxFile), "utf8");
}
