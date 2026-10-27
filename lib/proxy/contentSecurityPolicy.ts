import { NextRequest } from "next/server";
import type { ProxyMiddleware } from "./chain";

export const contentSecurityPolicy: ProxyMiddleware = (request, next) => {
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

	const response = next(new NextRequest(request, { headers: requestHeaders }));

	if (process.env.NODE_ENV !== "development") {
		response.headers.set("Content-Security-Policy", csp);
	}

	return response;
};
