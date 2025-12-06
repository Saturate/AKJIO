import fs from "node:fs";
import path from "path";
import importifyPath from "./importifyPath";

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
				// In newer Node.js versions, readdirSync with recursive returns parentPath instead of path
				const entryPath = (entry as any).parentPath || entry.path;
				if (!entryPath) {
					console.error("Entry has no path or parentPath:", entry);
					throw new Error(`Content entry missing path property: ${JSON.stringify(entry)}`);
				}
				const relativePath = entryPath.replace(folderPath, "").split("\\").join("/");
				const slugs =
					relativePath !== ""
						? relativePath.split("/").filter((slug: string) => slug !== "")
						: [];

				if (entry.name !== "index.mdx") {
					slugs.push(removeContentOrdering(entry.name.replace(".mdx", "")));
				}

				try {
					// Handle windows with replace for now
					const { frontmatter } = await import(
						`@/content/${importifyPath(path.join(relativePath, entry.name))}`
					);

					const filePath = path.join(entryPath, entry.name);

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
						path: entryPath,
						filePath: filePath,
						relativeFilePath: path.join(relativePath, entry.name),
					};

			} catch (err) {
				console.log('error laoding file',`@/content/${importifyPath(path.join(relativePath, entry.name))}`, relativePath, entry.name);
				throw err;
			}
		}),
	);
}
