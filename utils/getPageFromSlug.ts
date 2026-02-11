import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import generateContentMap from "@/utils/generateContentMap";
import { generateTableOfContentsFromMarkdown } from "@/utils/generateTableOfContentsFromMarkdown";
import calculateReadTime from "@/utils/calculateReadTime";
import importifyPath from "./importifyPath";

export default async function getPageFromSlug(slug: string[] | string) {
	"use server";

	const contentMap = await generateContentMap();
	const slugPath = "/" + (typeof slug === "string" ? slug : slug.join("/"));

	const page = contentMap.find((content) => {
		if (!slug) {
			return content.websitePath === "/";
		}
		return content.websitePath === slugPath;
	});

	if (!page) {
		console.warn("PAGE 404", slug, contentMap, slugPath);
		notFound();
	}

	const contentFile = fs.readFileSync(path.join(page.filePath), "utf8");

	try {
		// Handle windows with replace for now
		const mdxModule = await import(
			`@/content/${importifyPath(page.relativeFilePath)}`
		);

		console.log(
			"getting it...",
			`@/content/${importifyPath(page.relativeFilePath)}`,
		);

		if (!mdxModule.default) {
			notFound();
		}

		const toc = await generateTableOfContentsFromMarkdown(contentFile);
		const readTime = calculateReadTime(contentFile);

		return {
			Component: mdxModule.default,
			title: mdxModule.frontmatter?.title ?? page.entryName,
			description:
				mdxModule.frontmatter?.description ?? mdxModule.frontmatter?.subtitle,
			page,
			toc,
			readTime,
			frontmatter: mdxModule.frontmatter,
			link: `/${page.websitePath}`,
		};
	} catch (err) {
		console.log({
			relativeFilePath: page.relativeFilePath,
			filePath: page.filePath,
		});
		throw err;
	}
}
