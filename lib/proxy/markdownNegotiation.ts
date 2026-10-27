import { NextRequest, NextResponse } from "next/server";
import type { ProxyMiddleware } from "./chain";

// Top-level app routes that aren't MDX content, so they have no llm.txt twin
const NON_CONTENT_ROUTES = new Set(["cv", "feed", "opengraph-image"]);

function markdownPathFor(pathname: string): string | null {
	if (pathname === "/") return "/llm.txt";
	if (pathname === "/posts") return "/llms.txt";

	// Strict slug charset also stops encoded dots (%2E%2E) reaching the fs lookup
	const match = pathname.match(/^\/([a-z0-9-]+)$/);
	if (!match || NON_CONTENT_ROUTES.has(match[1])) return null;

	return `/${match[1]}/llm.txt`;
}

function acceptQuality(accept: string, mediaType: string): number | null {
	for (const part of accept.split(",")) {
		const [type, ...params] = part.split(";").map((s) => s.trim());
		if (type.toLowerCase() !== mediaType) continue;

		const q = params.find((p) => p.toLowerCase().startsWith("q="));
		return q ? Number(q.slice(2)) : 1;
	}
	return null;
}

// Agents often send "text/markdown, text/html;q=0.9", so markdown wins only
// when it ranks at least as high as HTML (or the wildcards that cover it)
function prefersMarkdown(request: NextRequest): boolean {
	const accept = request.headers.get("accept");
	if (!accept) return false;

	const markdown = acceptQuality(accept, "text/markdown") ?? 0;
	const html =
		acceptQuality(accept, "text/html") ??
		acceptQuality(accept, "text/*") ??
		acceptQuality(accept, "*/*") ??
		0;

	return markdown > 0 && markdown >= html;
}

export const markdownNegotiation: ProxyMiddleware = (request, next) => {
	const markdownPath = markdownPathFor(request.nextUrl.pathname);
	if (!markdownPath || !prefersMarkdown(request)) return next();

	// Vary on the HTML variant would be pointless: Next's renderer overwrites it
	const response = NextResponse.rewrite(new URL(markdownPath, request.url));
	response.headers.set("Vary", "Accept");
	return response;
};
