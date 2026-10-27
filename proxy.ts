import { chain } from "@/lib/proxy/chain";
import { markdownNegotiation } from "@/lib/proxy/markdownNegotiation";
import { linkHeaders } from "@/lib/proxy/linkHeaders";
import { contentSecurityPolicy } from "@/lib/proxy/contentSecurityPolicy";

// Order matters: a middleware that short-circuits skips everything after it
export const proxy = chain([
	markdownNegotiation,
	linkHeaders,
	contentSecurityPolicy,
]);

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
