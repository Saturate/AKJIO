import fs from "fs";
import path from "path";

const POST_CONTENT_PATH = "content/posts";

export interface PostFrontmatter {
	title: string;
	subtitle?: string;
	description?: string;
	date?: string;
	tags: string[];
	draft?: boolean;
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

	const titleMatch = fm.match(/title:\s*(?:(["'])(.+?)\1|(.+?)(?:\n|$))/);
	const subtitleMatch = fm.match(/subtitle:\s*(?:(["'])(.+?)\1|(.+?)(?:\n|$))/);
	const descriptionMatch = fm.match(
		/description:\s*(?:(["'])(.+?)\1|(.+?)(?:\n|$))/,
	);
	const dateMatch = fm.match(/date:\s*["']?(\d{4}-\d{2}-\d{2})/);

	const draftMatch = fm.match(/draft:\s*(true|false)/);

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
		title: titleMatch?.[2] ?? titleMatch?.[3]?.trim() ?? fallbackTitle,
		subtitle: subtitleMatch?.[2] ?? subtitleMatch?.[3]?.trim(),
		description: descriptionMatch?.[2] ?? descriptionMatch?.[3]?.trim(),
		date: dateMatch?.[1],
		tags,
		draft: draftMatch?.[1] === "true",
	};
}

export interface PostEntry {
	id: string;
	content: string;
}

export function readAllPosts(): PostEntry[] {
	const postsPath = path.join(process.cwd(), POST_CONTENT_PATH);
	const postIds = fs
		.readdirSync(postsPath, { withFileTypes: true })
		.filter((item) => item.isDirectory())
		.map((item) => item.name);

	return postIds
		.map((id) => {
			const postPath = path.join(postsPath, id);
			const files = fs.readdirSync(postPath);
			const mdxFile = files.find((f) => f.endsWith(".mdx"));
			if (!mdxFile) return null;
			const content = fs.readFileSync(path.join(postPath, mdxFile), "utf8");
			const fm = parseFrontmatter(content, id);
			if (fm.draft) return null;
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
