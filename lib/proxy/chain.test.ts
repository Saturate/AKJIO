import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it } from "vitest";
import { chain, type ProxyMiddleware } from "./chain";

const request = () => new NextRequest("https://akj.io/some-post");

describe("chain", () => {
	it("runs middlewares in order and lets each decorate the response", () => {
		const order: string[] = [];
		const tag =
			(name: string): ProxyMiddleware =>
			(req, next) => {
				order.push(`${name}:in`);
				const response = next();
				order.push(`${name}:out`);
				response.headers.append("x-seen", name);
				return response;
			};

		const response = chain([tag("a"), tag("b")])(request());

		expect(order).toEqual(["a:in", "b:in", "b:out", "a:out"]);
		expect(response.headers.get("x-seen")).toBe("b, a");
	});

	it("skips the rest when a middleware returns its own response", () => {
		const shortCircuit: ProxyMiddleware = () =>
			NextResponse.rewrite(new URL("https://akj.io/other"));
		const never: ProxyMiddleware = () => {
			throw new Error("should not run");
		};

		const response = chain([shortCircuit, never])(request());

		expect(response.headers.get("x-middleware-rewrite")).toBe(
			"https://akj.io/other",
		);
	});

	it("passes a replaced request on to later middlewares", () => {
		const addHeader: ProxyMiddleware = (req, next) => {
			const headers = new Headers(req.headers);
			headers.set("x-nonce", "abc");
			return next(new NextRequest(req, { headers }));
		};
		let seen: string | null = null;
		const read: ProxyMiddleware = (req, next) => {
			seen = req.headers.get("x-nonce");
			return next();
		};

		chain([addHeader, read])(request());

		expect(seen).toBe("abc");
	});
});
