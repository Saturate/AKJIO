import { NextRequest, NextResponse } from "next/server";

/*
	OLD Headers were:

	X-XSS-Protection: 1; mode=block
	X-Frame-Options: SAMEORIGIN
	Referrer-Policy: no-referrer-when-downgrade
	Content-Security-Policy: default-src 'self' *.akj.io googleapis.com fonts.googleapis.com fonts.gstatic.com 'sha256-nP0EI9B9ad8IoFUti2q7EQBabcE5MS5v0nkvRfUbYnM=' 'sha256-JG41RMQL8CqgkFKcSK/aphGI1C0di1CaK+aDwq8lJF4=' cdnjs.cloudflare.com www.google-analytics.com google-analytics.com; upgrade-insecure-requests; report-uri https://e3710ad22de216c6539627c47ee49254.report-uri.com/r/d/csp/enforce;
*/

export function proxy(request: NextRequest) {
	const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
	const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
    report-to default;
`;
	// Replace newline characters and spaces
	const contentSecurityPolicyHeaderValue = cspHeader
		.replace(/\s{2,}/g, " ")
		.trim();

	const requestHeaders = new Headers(request.headers);
	requestHeaders.set("x-nonce", nonce);

	const response = NextResponse.next({
		request: {
			headers: requestHeaders,
		},
	});

	if (process.env.NODE_ENV !== "development") {
		response.headers.set(
			"Content-Security-Policy",
			contentSecurityPolicyHeaderValue
		);
	}

	return response;
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		{
			source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
			missing: [
				{ type: "header", key: "next-router-prefetch" },
				{ type: "header", key: "purpose", value: "prefetch" },
			],
		},
	],
};
