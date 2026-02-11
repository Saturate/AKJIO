const WORDS_PER_MINUTE = 200;
// Code reads slower — each line counts as roughly 5 "words" of effort
const CODE_LINE_WORD_EQUIVALENT = 5;

export default function calculateReadTime(rawContent: string): number {
	const withoutFrontmatter = rawContent.replace(/^---[\s\S]*?---/, "");

	// Extract code blocks separately since they're read at a different pace
	const codeBlocks: string[] = [];
	const prose = withoutFrontmatter.replace(/```[\s\S]*?```/g, (match) => {
		codeBlocks.push(match);
		return "";
	});

	const codeLines = codeBlocks
		.flatMap((block) => block.split("\n").slice(1, -1)) // drop ``` fences
		.filter((line) => line.trim().length > 0).length;

	const cleanedProse = prose
		// Remove inline code
		.replace(/`[^`]*`/g, "")
		// Remove MDX imports/exports
		.replace(/^(import|export)\s.*$/gm, "")
		// Remove HTML/JSX tags
		.replace(/<[^>]+>/g, "")
		// Remove markdown images/links syntax (keep text)
		.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
		// Remove heading markers
		.replace(/^#{1,6}\s/gm, "");

	const proseWords = cleanedProse.split(/\s+/).filter(Boolean).length;
	const totalWordEquivalent = proseWords + codeLines * CODE_LINE_WORD_EQUIVALENT;

	return Math.max(1, Math.round(totalWordEquivalent / WORDS_PER_MINUTE));
}
