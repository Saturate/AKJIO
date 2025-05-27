import fs from "node:fs";
import path from "path";

const PAGE_CONTENT_PATH = "content/";

function removeContentOrdering(path: string) {
	return path.replace(/^\d_/, "");
}

// const CONTENT_MAP = {
// 	pages: "/",
// 	posts: "/posts",
// };

/**
 * @todo Should use 'use cache' and https://nextjs.org/docs/app/api-reference/functions/cacheTag but for development this is fine. We could also generate a JSON file, and read that.
 */
export default async function generateContentMap() {
	const folderPath = path.join(process.cwd(), `./${PAGE_CONTENT_PATH}`);
	const content = fs.readdirSync(folderPath, {
		withFileTypes: true,
		recursive: true,
	});

	return await Promise.all(
		content
			.filter((path) => !path.isDirectory())
			.map(async (entry) => {
				const relativePath = entry.path.replace(folderPath, "");
				const slugs =
					relativePath !== ""
						? relativePath.split("/").filter((slug) => slug !== "")
						: [];

				if (entry.name !== "index.mdx") {
					slugs.push(removeContentOrdering(entry.name.replace(".mdx", "")));
				}

				const filePath = path.join(entry.path, entry.name);

				// Handle windows with replace for now
				const { frontmatter } = await import(
					`@/content/${path.join(relativePath, entry.name).replace("\\", "/")}`
				);

				return {
					websitePath: "/" + slugs.join("/"),
					slugs: [...slugs],
					relativePath: relativePath,
					entryName: entry.name,
					data: {
						frontmatter,
						...frontmatter,
					},
					folderPath,
					path: entry.path,
					relativeFilePath: path.join(relativePath, entry.name),
					filePath: filePath,
				};
			}),
	);
}
