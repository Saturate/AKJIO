/**
 * Utility functions to generate JSON-LD structured data
 * https://schema.org/
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://akj.io";
const AUTHOR_NAME = "Allan Kimmer Jensen";

interface BlogPostData {
	title: string;
	description?: string;
	subtitle?: string;
	date: string;
	updated?: string;
	tags?: string[];
}

export function generateBlogPostingSchema(post: BlogPostData, url: string) {
	const datePublished = new Date(post.date).toISOString();
	const dateModified = post.updated
		? new Date(post.updated).toISOString()
		: datePublished;

	return {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		headline: post.title,
		description: post.description || post.subtitle,
		datePublished,
		dateModified,
		author: {
			"@type": "Person",
			name: AUTHOR_NAME,
			url: SITE_URL,
		},
		...(post.tags && post.tags.length > 0 && { keywords: post.tags.join(", ") }),
		url,
		mainEntityOfPage: {
			"@type": "WebPage",
			"@id": url,
		},
	};
}

export function generatePersonSchema() {
	return {
		"@context": "https://schema.org",
		"@type": "Person",
		name: AUTHOR_NAME,
		url: SITE_URL,
		sameAs: [
			"https://github.com/alkj",
			"https://www.linkedin.com/in/allankimmerjensen/",
		],
	};
}

export function generateOrganizationSchema() {
	return {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: "AKJ.IO",
		url: SITE_URL,
		logo: `${SITE_URL}/logo.png`,
		sameAs: [
			"https://github.com/alkj",
			"https://www.linkedin.com/in/allankimmerjensen/",
		],
	};
}

export function generateBreadcrumbSchema(
	items: Array<{ name: string; url: string }>,
) {
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.name,
			item: item.url,
		})),
	};
}

export function generateCollectionPageSchema(
	posts: Array<BlogPostData & { url: string }>,
) {
	return {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: "Blog Posts - AKJ.IO",
		description:
			"Writing about security, frontend development, architecture, and software engineering.",
		url: `${SITE_URL}/posts`,
		mainEntity: {
			"@type": "ItemList",
			itemListElement: posts.map((post, index) => ({
				"@type": "ListItem",
				position: index + 1,
				url: post.url,
			})),
		},
	};
}

/**
 * Helper to safely serialize JSON-LD for use in dangerouslySetInnerHTML
 */
export function serializeJsonLd(data: Record<string, unknown>): string {
	return JSON.stringify(data);
}
