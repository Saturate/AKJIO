import type { ProxyMiddleware } from "./chain";

// RFC 8288 Link headers let agents find the machine-readable versions without parsing HTML
const HOME_LINKS = [
	'</llms.txt>; rel="describedby"; type="text/markdown"',
	'</llms-full.txt>; rel="describedby"; type="text/markdown"',
	'</feed>; rel="alternate"; type="application/rss+xml"',
];

export const linkHeaders: ProxyMiddleware = (request, next) => {
	const response = next();
	if (request.nextUrl.pathname !== "/") return response;

	for (const link of HOME_LINKS) response.headers.append("Link", link);
	return response;
};
