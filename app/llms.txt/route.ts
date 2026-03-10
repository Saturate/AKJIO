import fs from "fs";
import path from "path";

const POST_CONTENT_PATH = "content/posts";
const PAGE_CONTENT_PATH = "content";

const EXCLUDED_PAGES = new Set(["404.mdx", "index.mdx", "design-guide.mdx"]);

type PostData = {
	id: string;
	title: string;
	description: string | undefined;
	date: Date;
};

type PageData = {
	slug: string;
	title: string;
};

async function getPostsData(): Promise<PostData[]> {
	const postIds = fs
		.readdirSync(POST_CONTENT_PATH, { withFileTypes: true })
		.filter((item) => item.isDirectory() && item.name !== "_drafts")
		.map((item) => item.name);

	const posts = (
		await Promise.all(
			postIds.map(async (id) => {
				const postPath = path.join(POST_CONTENT_PATH, id);
				const files = fs.readdirSync(postPath);
				const mdxFile = files.find((f) => f.endsWith(".mdx"));

				if (!mdxFile) return null;

				const content = fs.readFileSync(
					path.join(postPath, mdxFile),
					"utf8",
				);

				const titleMatch = content.match(/title:\s*["']?(.+?)["']?\s*$/m);
				const subtitleMatch = content.match(
					/subtitle:\s*["']?(.+?)["']?\s*$/m,
				);
				const descriptionMatch = content.match(
					/description:\s*["']?(.+?)["']?\s*$/m,
				);
				const dateMatch = content.match(
					/date:\s*["']?(\d{4}-\d{2}-\d{2})/,
				);

				return {
					id,
					title: titleMatch ? titleMatch[1] : id,
					description: descriptionMatch?.[1] ?? subtitleMatch?.[1],
					date: dateMatch ? new Date(dateMatch[1]) : new Date(),
				};
			}),
		)
	).filter((p): p is PostData => p !== null);

	return posts.sort((a, b) => b.date.getTime() - a.date.getTime());
}

function getPagesData(): PageData[] {
	const files = fs
		.readdirSync(PAGE_CONTENT_PATH)
		.filter((f) => f.endsWith(".mdx") && !EXCLUDED_PAGES.has(f));

	return files.map((file) => {
		const content = fs.readFileSync(
			path.join(PAGE_CONTENT_PATH, file),
			"utf8",
		);
		const titleMatch = content.match(/title:\s*["']?(.+?)["']?\s*$/m);
		const slug = file.replace(/\.mdx$/, "");

		return {
			slug,
			title: titleMatch ? titleMatch[1] : slug,
		};
	});
}

export async function GET() {
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://akj.io";
	const posts = await getPostsData();
	const pages = getPagesData();

	const lines = [
		"# AKJ.IO",
		"",
		"> Software engineer and security enthusiast. Writing about CTF challenges, web security, frontend development, and software architecture.",
		"",
		"## Blog Posts",
		"",
		...posts.map((post) => {
			const desc = post.description ? `: ${post.description}` : "";
			return `- [${post.title}](${siteUrl}/${post.id}/llm.txt)${desc}`;
		}),
		"",
		"## Pages",
		"",
		...pages.map(
			(page) => `- [${page.title}](${siteUrl}/${page.slug}/llm.txt)`,
		),
		"",
	];

	return new Response(lines.join("\n"), {
		headers: {
			"Content-Type": "text/markdown; charset=utf-8",
			"Cache-Control": "s-maxage=3600, stale-while-revalidate",
		},
	});
}
