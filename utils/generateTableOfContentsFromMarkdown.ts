export type TOCEntry = {
	level: number;
	text: string;
	slug: string;
	children: TOCEntry[];
};

export async function generateTableOfContentsFromMarkdown(markdown: string) {
	const headings = [
		// Match Markdown and HTML headings (e.g., ## Heading, <h2>Heading</h2>)
		...markdown.matchAll(
			/^(#+)\s+(.+)$|^<h([1-6])(?:\s+[^>]*\bid=["'](.*?)["'][^>]*)?>(.*?)<\/h\3>/gm,
		),
	].map((match) => {
		let level;
		let text;
		let slug;

		if (match[1]) {
			// Markdown headings
			level = match[1].length;
			text = match[2].trim().replaceAll("\\", "");
		} else {
			// HTML headings
			level = parseInt(match[3], 10); // Extract level from <hN>
			text = match[5].trim().replaceAll("\\", "");
			if (match[4]) {
				slug = `#${match[4]}`;
			}
		}

		// Generate slug
		slug ??= `#${text
			.replace(/`([^`]+)`/g, "$1") // Remove inline code formatting
			.replace(/[^\w\s-]/g, "") // Remove special characters
			.trim()
			.replace(/\s+/g, "-") // Replace spaces with hyphens
			.toLowerCase()}`;

		return { level, text, slug, children: [] };
	});

	const toc: TOCEntry[] = [];
	const stack: TOCEntry[] = [{ level: 0, text: "", slug: "", children: toc }];

	const containsQuickReference = markdown.match(/\<ApiTable\s+rows=\{\[/);
	if (containsQuickReference) {
		toc.push({
			level: 0,
			text: "Quick reference",
			slug: "#quick-reference",
			children: [],
		});
	}

	for (const heading of headings) {
		while (stack[stack.length - 1].level >= heading.level) stack.pop();
		stack[stack.length - 1].children.push(heading);
		stack.push(heading);
	}

	return toc;
}
