import fs from "node:fs";
import path from "path";
import importifyPath from "./importifyPath";

const PAGE_CONTENT_PATH = "content/";

function removeContentOrdering(path: string) {
	return path.replace(/^\d_/, "");
}

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
				const entryWithPath = entry as fs.Dirent & { path?: string; parentPath?: string };
				const entryPath = entryWithPath.parentPath || entryWithPath.path;
				if (!entryPath) {
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
		}),
	);
}
