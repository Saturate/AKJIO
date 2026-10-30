import type { MDXComponents } from "mdx/types";
import React from "react";
import CodeFrame from "@/components/CodeFrame/CodeFrame";
import ProseImage from "@/components/ProseImage/ProseImage";
import { slugify } from "@/utils/slugify";

function toSize(v: string | number | undefined): number | undefined {
	const n = typeof v === "number" ? v : Number(v);
	return Number.isFinite(n) && n > 0 ? n : undefined;
}

function getTextContent(node: React.ReactNode): string {
	if (typeof node === "string" || typeof node === "number") {
		return String(node);
	}

	if (React.isValidElement(node)) {
		if (node.type === "small") {
			return "";
		}

		// @ts-expect-error - node.props.children type not guaranteed
		return getTextContent(node.props.children);
	}

	if (Array.isArray(node)) {
		return node.map(getTextContent).join("");
	}

	return ""; // If the node is neither text nor a React element
}

function splitTextToChars(text: string): React.ReactNode {
	const words = text.split(/(\s+)/);
	return words.map((seg, wi) => {
		if (/^\s+$/.test(seg)) return seg;
		return (
			<span key={wi} aria-hidden="true">
				{[...seg].map((ch, ci) => (
					<span key={ci} className="ch" data-c={ch}>
						{ch}
					</span>
				))}
			</span>
		);
	});
}

function infectableChars(node: React.ReactNode): React.ReactNode {
	return React.Children.map(node, (child, i) => {
		if (typeof child === "string") return splitTextToChars(child);
		if (typeof child === "number") return splitTextToChars(String(child));
		if (React.isValidElement(child)) return React.cloneElement(child, { key: i });
		return child;
	});
}

function createHeading(level: 1 | 2 | 3 | 4 | 5 | 6) {
	return ({ children }: React.PropsWithChildren) => {
		const text = getTextContent(children);
		const slug = slugify(text);
		const inner =
			level === 1
				? infectableChars(children)
				: React.createElement(
						"a",
						{ href: `#${slug}`, key: `link-${slug}`, className: "anchor" },
						children,
					);
		return React.createElement(
			`h${level}`,
			{ id: slug, ...(level === 1 ? { "data-infect": "", "aria-label": text } : {}) },
			inner,
		);
	};
}

function preLanguage(children: React.ReactNode): string | null {
	for (const child of React.Children.toArray(children)) {
		if (React.isValidElement<{ "data-language"?: unknown }>(child)) {
			const lang = child.props["data-language"];
			if (typeof lang === "string") return lang;
		}
	}
	return null;
}

function hasFigcaption(children: React.ReactNode): boolean {
	return React.Children.toArray(children).some(
		(c) => React.isValidElement(c) && c.type === "figcaption",
	);
}

// rehype-pretty-code wraps block code in a figure; give those the code frame (colony + copy).
function Figure({ children, ...props }: React.ComponentProps<"figure">) {
	if (!("data-rehype-pretty-code-figure" in props))
		return <figure {...props}>{children}</figure>;
	return (
		<CodeFrame
			language={preLanguage(children)}
			hasTitle={hasFigcaption(children)}
			seedText={getTextContent(children).slice(0, 240)}
			data-rehype-pretty-code-figure=""
		>
			{children}
		</CodeFrame>
	);
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
	return {
		// Allows customizing built-in components, e.g. to add styling.
		figure: Figure,
		h1: createHeading(1),
		h2: createHeading(2),
		h3: createHeading(3),
		h4: createHeading(4),
		h5: createHeading(5),
		h6: createHeading(6),
		img: ({ src, alt, width, height }) =>
			typeof src === "string" ? (
				<ProseImage
					src={src}
					alt={alt ?? ""}
					width={toSize(width)}
					height={toSize(height)}
				/>
			) : null,
		...components,
	};
}
