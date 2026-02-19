import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkFrontmatter from "remark-frontmatter";
import { visit } from "unist-util-visit";

// Minimal MDAST node shape — avoids the `mdast` direct dep (transitive only)
interface MdastNode {
	type: string;
	value?: string;
	children?: MdastNode[];
}

// Must stay in sync with the slugify in mdx-components.tsx
function slugify(str: string): string {
	return str
		.toLowerCase()
		.trim()
		.replace(/\s+/g, "-")
		.replace(/&/g, "-and-")
		.replace(/[^\w-]+/g, "")
		.replace(/--+/g, "-");
}

function flattenText(node: MdastNode): string {
	if (node.type === "text" || node.type === "inlineCode") return node.value ?? "";
	if (node.children) return node.children.map(flattenText).join("");
	return "";
}

export interface SearchDocument {
	id: string;
	/** Section URL — may include a #anchor */
	url: string;
	/** Always the page root URL, used for grouping results */
	page_url: string;
	/** Page title, carried on every document so results can be grouped without a separate lookup */
	page_title: string;
	type: "page" | "heading" | "text";
	content: string;
}

export function extractDocuments(
	mdxContent: string,
	{ url, title, description }: { url: string; title: string; description?: string },
): SearchDocument[] {
	const docs: SearchDocument[] = [];
	let docIndex = 0;
	const nextId = () => `${url}-${docIndex++}`;

	docs.push({ id: url, url, page_url: url, page_title: title, type: "page", content: title });

	if (description) {
		docs.push({
			id: nextId(),
			url,
			page_url: url,
			page_title: title,
			type: "text",
			content: description,
		});
	}

	let currentHeadingId: string | undefined;
	let currentContent: string[] = [];

	function flushContent() {
		const text = currentContent.join(" ").trim();
		if (text) {
			docs.push({
				id: nextId(),
				url: currentHeadingId ? `${url}#${currentHeadingId}` : url,
				page_url: url,
				page_title: title,
				type: "text",
				content: text,
			});
		}
		currentContent = [];
	}

	try {
		const tree = remark()
			.use(remarkFrontmatter)
			.use(remarkGfm)
			.use(remarkMdx)
			.parse(mdxContent);

		visit(tree, (node) => {
			if (node.type === "heading") {
				flushContent();
				const text = flattenText(node as MdastNode).trim();
				if (text) {
					currentHeadingId = slugify(text);
					docs.push({
						id: nextId(),
						url: `${url}#${currentHeadingId}`,
						page_url: url,
						page_title: title,
						type: "heading",
						content: text,
					});
				}
				return "skip";
			}

			if (node.type === "paragraph" || node.type === "blockquote") {
				const text = flattenText(node as MdastNode).trim();
				if (text) currentContent.push(text);
				return "skip";
			}
		});

		flushContent();
	} catch {
		// Malformed MDX — title and description are still indexed above
	}

	return docs;
}
