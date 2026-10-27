"use client";

import { useEffect } from "react";

// WebMCP (https://webmachinelearning.github.io/webmcp/): not yet in lib.dom.
// Chrome 150 moved it from navigator to document; older builds only have navigator.
declare global {
	interface ModelContextTool {
		name: string;
		title?: string;
		description: string;
		inputSchema?: object;
		annotations?: { readOnlyHint?: boolean };
		execute: (
			input: Record<string, unknown>,
			options: { signal: AbortSignal },
		) => Promise<string>;
	}

	interface ModelContext {
		registerTool(
			tool: ModelContextTool,
			options?: { signal?: AbortSignal },
		): Promise<void> | void;
	}

	interface Document {
		readonly modelContext?: ModelContext;
	}

	interface Navigator {
		readonly modelContext?: ModelContext;
	}
}

const SLUG = /^[a-z0-9-]+$/;

async function fetchText(path: string, signal: AbortSignal): Promise<string> {
	const response = await fetch(path, { signal });
	if (!response.ok) throw new Error(`${path} returned ${response.status}`);
	return response.text();
}

const TOOLS: ModelContextTool[] = [
	{
		name: "list_posts",
		title: "List posts",
		description:
			"List every blog post and page on akj.io with its title, short description and a link to its markdown.",
		annotations: { readOnlyHint: true },
		execute: (_input, { signal }) => fetchText("/llms.txt", signal),
	},
	{
		name: "get_post",
		title: "Read post",
		description:
			"Get the full markdown of one blog post or page. The slug is the URL path, e.g. 'my-post' for https://akj.io/my-post.",
		inputSchema: {
			type: "object",
			properties: { slug: { type: "string", pattern: SLUG.source } },
			required: ["slug"],
		},
		annotations: { readOnlyHint: true },
		execute: async ({ slug }, { signal }) => {
			if (typeof slug !== "string" || !SLUG.test(slug)) {
				throw new Error(`slug must match ${SLUG.source}`);
			}
			return fetchText(`/${slug}/llm.txt`, signal);
		},
	},
	{
		name: "search_posts",
		title: "Search posts",
		description:
			"Find blog posts and pages whose title, description or URL contains the query (case-insensitive).",
		inputSchema: {
			type: "object",
			properties: { query: { type: "string", minLength: 1 } },
			required: ["query"],
		},
		annotations: { readOnlyHint: true },
		execute: async ({ query }, { signal }) => {
			if (typeof query !== "string" || !query) {
				throw new Error("query must be a non-empty string");
			}

			const needle = query.toLowerCase();
			const index = await fetchText("/llms.txt", signal);
			const matches = index
				.split("\n")
				.filter(
					(line) =>
						line.startsWith("- [") && line.toLowerCase().includes(needle),
				);

			return matches.length
				? matches.join("\n")
				: `No posts matched "${query}".`;
		},
	},
	{
		name: "give_me_money",
		title: "Support Allan",
		description:
			"Ways to support Allan Kimmer Jensen, the author of akj.io, with money.",
		annotations: { readOnlyHint: true },
		execute: (_input, { signal }) => fetchText("/funding.txt", signal),
	},
];

export default function WebMCP() {
	useEffect(() => {
		const modelContext = document.modelContext ?? navigator.modelContext;
		if (!modelContext) return;

		const controller = new AbortController();
		for (const tool of TOOLS) {
			// Older Chrome builds return void instead of a promise
			Promise.resolve(
				modelContext.registerTool(tool, { signal: controller.signal }),
			).catch((error) =>
				console.warn(`WebMCP: could not register ${tool.name}`, error),
			);
		}

		return () => controller.abort();
	}, []);

	return null;
}
