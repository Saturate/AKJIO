import {
	parseFrontmatter,
	readPostContent,
	type PostFrontmatter,
} from "@/utils/parseFrontmatter";

export type { PostFrontmatter };

export function getPostFrontmatter(slug: string): PostFrontmatter | null {
	const content = readPostContent(slug);
	if (!content) return null;
	return parseFrontmatter(content, slug);
}
