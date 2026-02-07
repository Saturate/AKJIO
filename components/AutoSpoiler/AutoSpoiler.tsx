"use client";

import { ReactNode, ReactElement } from "react";
import Spoiler from "@/components/Spoiler/Spoiler";

interface AutoSpoilerProps {
	children?: ReactNode;
	text?: string;
}

// Matches common CTF flag patterns: THM{...}, FLAG{...}, CTF{...}, HTB{...}, etc.
const FLAG_PATTERN = /\b([A-Z]{2,})\{([^}]+)\}/g;

function processText(text: string): (string | ReactElement)[] {
	const parts: (string | ReactElement)[] = [];
	let lastIndex = 0;
	let match;
	let keyCounter = 0;

	while ((match = FLAG_PATTERN.exec(text)) !== null) {
		// Add text before the match
		if (match.index > lastIndex) {
			parts.push(text.slice(lastIndex, match.index));
		}

		// Add the flag wrapped in a Spoiler
		parts.push(
			<Spoiler key={`flag-${keyCounter++}`}>{match[0]}</Spoiler>
		);

		lastIndex = match.index + match[0].length;
	}

	// Add remaining text
	if (lastIndex < text.length) {
		parts.push(text.slice(lastIndex));
	}

	return parts.length > 0 ? parts : [text];
}

function processChildren(children: ReactNode): ReactNode {
	if (typeof children === "string") {
		const processed = processText(children);
		return processed.length === 1 ? processed[0] : <>{processed}</>;
	}

	if (Array.isArray(children)) {
		return children.map((child, index) => (
			<span key={index}>{processChildren(child)}</span>
		));
	}

	return children;
}

export default function AutoSpoiler({ children, text }: AutoSpoilerProps) {
	if (text) {
		const processed = processText(text);
		return <>{processed}</>;
	}
	return <>{processChildren(children)}</>;
}
