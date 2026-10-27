// Shared by the heading renderer and the TOC so anchors always match.
export function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/\s+/g, "-")
		.replace(/&/g, "-and-")
		.replace(/[^\w-]+/g, "")
		.replace(/--+/g, "-");
}

// Headings in raw markdown still carry inline formatting the rendered text doesn't have.
export function stripInlineMarkdown(text: string): string {
	return text
		.replace(/`([^`]+)`/g, "$1")
		.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
		.replace(/(\*\*|__)(.+?)\1/g, "$2")
		.replace(/(\*|_)(.+?)\1/g, "$2");
}
