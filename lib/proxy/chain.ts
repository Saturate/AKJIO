import { NextRequest, NextResponse } from "next/server";

// Return a response to short-circuit, or call next() and decorate what comes back.
// Pass a new request to next() to change the headers the app sees.
export type ProxyMiddleware = (
	request: NextRequest,
	next: (request?: NextRequest) => NextResponse,
) => NextResponse;

export function chain(middlewares: ProxyMiddleware[]) {
	return (request: NextRequest): NextResponse => {
		const run = (index: number, current: NextRequest): NextResponse => {
			const middleware = middlewares[index];
			if (!middleware) {
				return NextResponse.next({ request: { headers: current.headers } });
			}
			return middleware(current, (next = current) => run(index + 1, next));
		};

		return run(0, request);
	};
}
