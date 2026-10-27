import {
	parseFrontmatter,
	type PostFrontmatter,
} from "@/lib/content/frontmatter";
import { readPostContent } from "@/lib/content/posts";

export type { PostFrontmatter };

export function getPostFrontmatter(slug: string): PostFrontmatter | null {
	const content = readPostContent(slug);
	if (!content) return null;
	return parseFrontmatter(content, slug);
}
