import { NextRequest, NextResponse } from "next/server";

// Top-level app routes that aren't MDX content, so they have no llm.txt twin
const NON_CONTENT_ROUTES = new Set(["cv", "feed"]);

function markdownPathFor(pathname: string): string | null {
	if (pathname === "/") return "/llm.txt";
	if (pathname === "/posts") return "/llms.txt";

	const match = pathname.match(/^\/([^/.]+)$/);
	if (!match || NON_CONTENT_ROUTES.has(match[1])) return null;

	return `/${match[1]}/llm.txt`;
}

function acceptQuality(accept: string, mediaType: string): number {
	for (const part of accept.split(",")) {
		const [type, ...params] = part.split(";").map((s) => s.trim());
		if (type.toLowerCase() !== mediaType) continue;

		const q = params.find((p) => p.startsWith("q="));
		return q ? Number(q.slice(2)) : 1;
	}
	return 0;
}

// Agents often send "text/markdown, text/html;q=0.9", so markdown wins only
// when it ranks at least as high as HTML
function prefersMarkdown(request: NextRequest): boolean {
	const accept = request.headers.get("accept");
	if (!accept) return false;

	const markdown = acceptQuality(accept, "text/markdown");
	return markdown > 0 && markdown >= acceptQuality(accept, "text/html");
}

export function proxy(request: NextRequest) {
	const markdownPath = markdownPathFor(request.nextUrl.pathname);
	if (markdownPath && prefersMarkdown(request)) {
		const response = NextResponse.rewrite(new URL(markdownPath, request.url));
		response.headers.set("Vary", "Accept");
		return response;
	}

	const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

	const csp = [
		"default-src 'self'",
		`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' blob: data:",
		"font-src 'self'",
		"connect-src 'self' https://*.vercel.live",
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-src https://vercel.live https://giscus.app",
		"frame-ancestors 'none'",
		"upgrade-insecure-requests",
		"report-to default",
	].join("; ");

	const requestHeaders = new Headers(request.headers);
	requestHeaders.set("x-nonce", nonce);

	const response = NextResponse.next({
		request: { headers: requestHeaders },
	});

	if (process.env.NODE_ENV !== "development") {
		response.headers.set("Content-Security-Policy", csp);
	}

	return response;
}

export const config = {
	matcher: [
		{
			source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
			missing: [
				{ type: "header", key: "next-router-prefetch" },
				{ type: "header", key: "purpose", value: "prefetch" },
			],
		},
	],
};
