import createMDX from "@next/mdx";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import remarkAbbr from "./lib/remark-abbr.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	pageExtensions: ["js", "jsx", "mdx", "md", "ts", "tsx"],
	async redirects() {
		return [
			{
				source: "/security.txt",
				destination: "/.well-known/security.txt",
				permanent: true,
			},
			{
				source: "/posts/:slug((?!llm\\.txt$).*)",
				destination: "/:slug",
				permanent: true,
			},
		];
	},
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{
						key: "X-Frame-Options",
						value: "SAMEORIGIN",
					},
					{
						key: "Permissions-Policy",
						value:
							"camera=(), microphone=(), geolocation=(), browsing-topics=()",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "Referrer-Policy",
						value: "origin-when-cross-origin",
					},
					{
						key: "Strict-Transport-Security",
						value: "max-age=63072000; includeSubDomains; preload",
					},
					{
						key: "Cross-Origin-Opener-Policy",
						value: "same-origin",
					},
					{
						key: "Reporting-Endpoints",
						value: 'default="https://reports.akj.io"',
					},
				],
			},
		];
	},
};

const withMDX = createMDX({
	// Add markdown plugins here, as desired
	options: {
		remarkPlugins: [remarkGfm, remarkFrontmatter, remarkMdxFrontmatter, remarkAbbr],
		rehypePlugins: [
			[
				rehypePrettyCode,
				{
					theme: "ayu-dark",
					bypassInlineCode: false,
					defaultLang: "plaintext",
				},
			],
		],
		remarkRehypeOptions: {
			passThrough: [
				'mdxjsEsm',
				'mdxFlowExpression',
				'mdxJsxFlowElement',
				'mdxJsxTextElement',
				'mdxTextExpression',
			],
		},
	},
});

// Merge MDX config with Next.js config
export default withMDX(nextConfig);
