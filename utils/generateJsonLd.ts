/**
 * Utility functions to generate JSON-LD structured data
 * https://schema.org/
 */

import { cvData, type Skill, type WorkExperience } from "@/data/cv";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://akj.io";
const AUTHOR_NAME = "Allan Kimmer Jensen";
// Stable @id so every page's Person resolves to the same entity
const PERSON_ID = `${SITE_URL}/#person`;

function buildPerson(work: WorkExperience[], skills: Skill[]) {
	const currentJobs = work.filter((w) => w.dateRange.end === "present");

	return {
		"@type": "Person",
		"@id": PERSON_ID,
		name: AUTHOR_NAME,
		url: SITE_URL,
		jobTitle: currentJobs[0]?.position,
		...(currentJobs[0] && {
			worksFor: currentJobs.map((job) => ({
				"@type": "Organization",
				name: job.company,
				...(job.url && { url: job.url }),
			})),
		}),
		knowsAbout: skills.flatMap((s) => s.items.map((i) => i.name)),
		sameAs: [
			"https://github.com/Saturate",
			"https://www.linkedin.com/in/allankimmerjensen/",
		],
	};
}

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
			"@id": PERSON_ID,
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

// A personal site is about one person, so the WebSite points at them instead of a stand-in Organization
export function generateHomeSchema() {
	return {
		"@context": "https://schema.org",
		"@graph": [
			buildPerson(cvData.work, cvData.skills),
			{
				"@type": "WebSite",
				name: "AKJ.IO",
				url: SITE_URL,
				author: { "@id": PERSON_ID },
			},
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

export function generateProfilePageSchema(work: WorkExperience[], skills: Skill[]) {
	return {
		"@context": "https://schema.org",
		"@type": "ProfilePage",
		mainEntity: buildPerson(work, skills),
	};
}

/**
 * Helper to safely serialize JSON-LD for use in dangerouslySetInnerHTML
 */
export function serializeJsonLd(data: Record<string, unknown>): string {
	// Post titles and descriptions end up in here; "</script>" in one would close the tag early
	return JSON.stringify(data).replace(/</g, "\\u003c");
}
