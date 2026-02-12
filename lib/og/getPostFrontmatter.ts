import fs from "fs";
import path from "path";

const POST_CONTENT_PATH = path.join(process.cwd(), "content/posts");

export interface PostFrontmatter {
	title: string;
	subtitle?: string;
	description?: string;
	date?: string;
	tags: string[];
}

/**
 * Regex-based frontmatter parser that handles both:
 *   tags: ["AI", "security"]       (inline array)
 *   tags:\n  - security\n  - ctf   (YAML list)
 */
export function getPostFrontmatter(slug: string): PostFrontmatter | null {
	const postDir = path.join(POST_CONTENT_PATH, slug);
	if (!fs.existsSync(postDir)) return null;

	const files = fs.readdirSync(postDir);
	const mdxFile = files.find((f) => f.endsWith(".mdx"));
	if (!mdxFile) return null;

	const content = fs.readFileSync(path.join(postDir, mdxFile), "utf8");
	const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
	if (!fmMatch) return null;

	const fm = fmMatch[1];

	const titleMatch = fm.match(/title:\s*(["'])(.+?)\1/);
	const subtitleMatch = fm.match(/subtitle:\s*(["'])(.+?)\1/);
	const descriptionMatch = fm.match(/description:\s*(["'])(.+?)\1/);
	const dateMatch = fm.match(/date:\s*["']?(\d{4}-\d{2}-\d{2})/);

	// Inline array: tags: ["AI", "security"]
	const inlineTagsMatch = fm.match(/tags:\s*\[(.*?)\]/s);
	// YAML list: tags:\n  - foo\n  - bar
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
		title: titleMatch?.[2] ?? slug,
		subtitle: subtitleMatch?.[2],
		description: descriptionMatch?.[2],
		date: dateMatch?.[1],
		tags,
	};
}
