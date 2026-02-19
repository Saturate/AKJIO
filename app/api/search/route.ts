import fs from "fs";
import path from "path";
import { extractDocuments } from "@/lib/search/extract";

export const dynamic = "force-static";

function parseFrontmatterFields(content: string) {
	const match = /^---\s*\n([\s\S]*?)\n---/.exec(content);
	if (!match) return {};
	const yaml = match[1];
	const get = (key: string) => {
		const m = new RegExp(`^${key}:\\s*['"]*([^'"\\n]+)['"]*`, "m").exec(yaml);
		return m?.[1]?.trim();
	};
	return {
		title: get("title"),
		description: get("description") ?? get("subtitle"),
	};
}

function collectMdxFiles(dir: string): { filePath: string; websitePath: string }[] {
	const results: { filePath: string; websitePath: string }[] = [];

	function walk(currentDir: string, segments: string[]) {
		let entries: fs.Dirent[];
		try {
			entries = fs.readdirSync(currentDir, { withFileTypes: true });
		} catch {
			return;
		}

		for (const entry of entries) {
			// skip draft folders
			if (entry.name.startsWith("_")) continue;

			if (entry.isDirectory()) {
				walk(path.join(currentDir, entry.name), [...segments, entry.name]);
			} else if (entry.name.endsWith(".mdx")) {
				const slug =
					entry.name === "index.mdx"
						? segments
						: [...segments, entry.name.replace(".mdx", "")];
				results.push({
					filePath: path.join(currentDir, entry.name),
					websitePath: "/" + slug.join("/"),
				});
			}
		}
	}

	walk(dir, []);
	return results;
}

export async function GET() {
	const contentDir = path.join(process.cwd(), "content");
	const files = collectMdxFiles(contentDir);
	const documents = [];

	for (const { filePath, websitePath } of files) {
		try {
			const content = fs.readFileSync(filePath, "utf8");
			const { title, description } = parseFrontmatterFields(content);

			if (!title) continue;

			const docs = extractDocuments(content, { url: websitePath, title, description });
			documents.push(...docs);
		} catch {
			// skip unreadable files
		}
	}

	return Response.json(documents);
}
