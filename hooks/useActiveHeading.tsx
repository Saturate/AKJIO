"use client";

import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { TOCEntry } from "@/utils/generateTableOfContentsFromMarkdown";

const ActiveAnchorContext = createContext<string[]>([]);

/**
 * The estimated active heading ID
 */
export function useActiveAnchor(): string | undefined {
	return useContext(ActiveAnchorContext)[0];
}

/**
 * All currently visible heading IDs
 */
export function useActiveAnchors(): string[] {
	return useContext(ActiveAnchorContext);
}

function flattenEntries(entries: TOCEntry[]): TOCEntry[] {
	return entries.reduce((acc: TOCEntry[], entry) => {
		acc.push(entry);
		if (entry.children.length > 0) {
			acc.push(...flattenEntries(entry.children));
		}
		return acc;
	}, []);
}

function useAnchorObserver(headingIds: string[]): string[] {
	const [activeAnchor, setActiveAnchor] = useState<string[]>([]);
	const visibleRef = useRef(new Set<string>());

	useEffect(() => {
		const visible = visibleRef.current;
		visible.clear();

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						visible.add(entry.target.id);
					} else {
						visible.delete(entry.target.id);
					}
				}

				if (visible.size === 0) {
					const viewTop =
						entries.length > 0 ? (entries[0]?.rootBounds?.top ?? 0) : 0;
					let fallback: string | undefined;
					let min = -1;

					for (const id of headingIds) {
						const el = document.getElementById(id);
						if (!el) continue;
						const top = el.getBoundingClientRect().top;
						// Only consider headings above the viewport
						if (top >= viewTop) continue;
						const d = viewTop - top;
						if (min === -1 || d < min) {
							fallback = id;
							min = d;
						}
					}

					setActiveAnchor(fallback ? [fallback] : []);
				} else {
					setActiveAnchor(headingIds.filter((id) => visible.has(id)));
				}
			},
			{ rootMargin: "0px", threshold: 0.98 },
		);

		const elements = headingIds.flatMap(
			(id) => document.getElementById(id) ?? [],
		);
		elements.forEach((el) => observer.observe(el));

		return () => observer.disconnect();
	}, [headingIds]);

	return activeAnchor;
}

interface AnchorProviderProps {
	toc: TOCEntry[];
	children: ReactNode;
}

export function AnchorProvider({ toc, children }: AnchorProviderProps) {
	const allEntries = useMemo(() => flattenEntries(toc), [toc]);
	const headingIds = useMemo(
		() => allEntries.map((e) => e.slug.slice(1)),
		[allEntries],
	);

	return (
		<ActiveAnchorContext.Provider value={useAnchorObserver(headingIds)}>
			{children}
		</ActiveAnchorContext.Provider>
	);
}
