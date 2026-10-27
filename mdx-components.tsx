import type { MDXComponents } from "mdx/types";
import Image, { ImageProps } from "next/image";
import React from "react";
import CodeFrame from "@/components/CodeFrame/CodeFrame";

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

function slugify(str: React.ReactNode) {
	return getTextContent(str)
		.toLowerCase()
		.trim() // Remove whitespace from both ends of a string
		.replace(/\s+/g, "-") // Replace spaces with -
		.replace(/&/g, "-and-") // Replace & with 'and'
		.replace(/[^\w\-]+/g, "") // Remove all non-word characters except for -
		.replace(/\-\-+/g, "-"); // Replace multiple - with single -
}

function createHeading(level: 1 | 2 | 3 | 4 | 5 | 6) {
	return ({ children }: React.PropsWithChildren) => {
		const slug = slugify(children);
		return React.createElement(`h${level}`, { id: slug }, [
			React.createElement(
				"a",
				{
					href: `#${slug}`,
					key: `link-${slug}`,
					className: "anchor",
				},
				children,
			),
		]);
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
	return React.Children.toArray(children).some((c) => React.isValidElement(c) && c.type === "figcaption");
}

// rehype-pretty-code wraps block code in a figure; give those the code frame (colony + copy).
function Figure({ children, ...props }: React.ComponentProps<"figure">) {
	if (!("data-rehype-pretty-code-figure" in props)) return <figure {...props}>{children}</figure>;
	return (
		<CodeFrame language={preLanguage(children)} hasTitle={hasFigcaption(children)} seedText={getTextContent(children).slice(0, 240)} data-rehype-pretty-code-figure="">
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
		img: (props) => (
			<Image
				sizes="100vw"
				style={{ width: "100%", height: "auto" }}
				{...(props as ImageProps)}
			/>
		),
		...components,
	};
}
