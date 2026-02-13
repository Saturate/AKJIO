"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TOCEntry } from "@/utils/generateTableOfContentsFromMarkdown";
import TOCItem from "./TOCItem";
import styles from "./TableOfContents.module.css";

interface TableOfContentsProps {
	entries: TOCEntry[];
	introLabel?: string;
	activeIds?: Set<string>;
	hideHeader?: boolean;
}

function getLineOffset(depth: number): number {
	return depth >= 3 ? 10 : 0;
}

export default function TableOfContents({ entries, introLabel, activeIds: externalActiveIds, hideHeader }: TableOfContentsProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [internalActiveIds, setInternalActiveIds] = useState<Set<string>>(new Set());
	const activeIds = externalActiveIds ?? internalActiveIds;
	const [svg, setSvg] = useState<{
		path: string;
		width: number;
		height: number;
	}>();
	const [activeHighlight, setActiveHighlight] = useState<{
		top: number;
		height: number;
	} | null>(null);

	const allEntries = useMemo(() => {
		const flattenEntries = (entries: TOCEntry[]): TOCEntry[] => {
			return entries.reduce((acc: TOCEntry[], entry) => {
				acc.push(entry);
				if (entry.children && entry.children.length > 0) {
					acc.push(...flattenEntries(entry.children));
				}
				return acc;
			}, []);
		};
		return flattenEntries(entries);
	}, [entries]);

	useEffect(() => {
		if (externalActiveIds) return;

		const headingIds = allEntries.map((e) => e.slug.slice(1));
		const visible = new Set<string>();

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
					const viewTop = entries[0]?.rootBounds?.top ?? 0;
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

					setInternalActiveIds(new Set(fallback ? [fallback] : []));
				} else {
					setInternalActiveIds(new Set(headingIds.filter((id) => visible.has(id))));
				}
			},
			{
				rootMargin: "0px",
				threshold: 0.98,
			},
		);

		const elements = headingIds.flatMap((id) => document.getElementById(id) ?? []);
		elements.forEach((el) => observer.observe(el));

		return () => observer.disconnect();
	}, [allEntries, externalActiveIds]);

	const atIntro = activeIds.size === 0;

	// Update active highlight position
	useEffect(() => {
		if (!containerRef.current) {
			setActiveHighlight(null);
			return;
		}

		const container = containerRef.current;

		if (atIntro) {
			if (introLabel) {
				const introLink = container.querySelector("a[data-intro]") as HTMLElement | null;
				if (introLink) {
					setActiveHighlight({
						top: introLink.offsetTop,
						height: introLink.offsetHeight,
					});
					return;
				}
			}
			setActiveHighlight(null);
			return;
		}

		const activeLinks = Array.from(activeIds)
			.map(id => container.querySelector(`a[href="#${id}"]`))
			.filter(Boolean) as HTMLElement[];

		if (activeLinks.length === 0) {
			setActiveHighlight(null);
			return;
		}

		// Find the topmost and bottommost active items
		const positions = activeLinks.map(link => ({
			top: link.offsetTop,
			bottom: link.offsetTop + link.offsetHeight
		}));

		const top = Math.min(...positions.map(p => p.top));
		const bottom = Math.max(...positions.map(p => p.bottom));

		setActiveHighlight({
			top,
			height: bottom - top
		});
	}, [Array.from(activeIds).sort().join(','), atIntro, introLabel]);

	useEffect(() => {
		if (!containerRef.current) return;
		const container = containerRef.current;

		function onResize(): void {
			if (container.clientHeight === 0) return;
			let w = 0, h = 0;
			const d: string[] = [];
			let isFirst = true;

			const introEl = container.querySelector("a[data-intro]") as HTMLElement | null;
			if (introEl) {
				const introStyles = getComputedStyle(introEl);
				const offset = getLineOffset(2) + 1;
				const top = introEl.offsetTop + parseFloat(introStyles.paddingTop);
				const bottom = introEl.offsetTop + introEl.clientHeight - parseFloat(introStyles.paddingBottom);

				w = Math.max(offset, w);
				h = Math.max(h, bottom);
				d.push(`M${offset} ${top}`);
				d.push(`L${offset} ${bottom}`);
				isFirst = false;
			}

			for (let i = 0; i < allEntries.length; i++) {
				const element: HTMLElement | null = container.querySelector(
					`a[href="${allEntries[i].slug}"]`,
				);
				if (!element) continue;

				const styles = getComputedStyle(element);
				const offset = getLineOffset(allEntries[i].level) + 1;
				const top = element.offsetTop + parseFloat(styles.paddingTop);
				const bottom = element.offsetTop + element.clientHeight - parseFloat(styles.paddingBottom);

				w = Math.max(offset, w);
				h = Math.max(h, bottom);

				d.push(`${isFirst ? 'M' : 'L'}${offset} ${top}`);
				d.push(`L${offset} ${bottom}`);
				isFirst = false;
			}

			setSvg({
				path: d.join(' '),
				width: w + 1,
				height: h,
			});
		}

		const resizeObserver = new ResizeObserver(onResize);
		onResize();

		resizeObserver.observe(container);
		return () => {
			resizeObserver.disconnect();
		};
	}, [allEntries]);

	const handleClick = (slug: string) => {
		const element = document.querySelector(slug);
		if (element) {
			element.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	};

	if (!entries || entries.length === 0) {
		return null;
	}

	return (
		<nav className={styles.toc}>
			{!hideHeader && <h3 className={styles.tocHeader}>On this page</h3>}
			<div className={styles.tocContainer}>
				{svg && (
					<div
						className={styles.tocSvgContainer}
						style={{
							width: svg.width,
							height: svg.height,
							maskImage: `url("data:image/svg+xml,${
								encodeURIComponent(
									`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svg.width} ${svg.height}"><path d="${svg.path}" stroke="black" stroke-width="1" fill="none" /></svg>`,
								)
							}")`,
						}}
					>
						<div className={styles.tocLine} />
						{activeHighlight && (
							<div
								className={styles.tocHighlight}
								style={{
									top: `${activeHighlight.top}px`,
									height: `${activeHighlight.height}px`,
								}}
							/>
						)}
					</div>
				)}
				<div ref={containerRef} className={styles.tocList}>
					{introLabel && (
						<a
							href="#"
							data-intro
							onClick={(e) => {
								e.preventDefault();
								window.scrollTo({ top: 0, behavior: "smooth" });
							}}
							style={{ paddingInlineStart: "14px" }}
							className={`${styles.tocItem} ${styles.tocItemIntro} ${atIntro ? styles.tocItemActive : ""}`}
						>
							{introLabel}
						</a>
					)}
					{allEntries.map((entry, i) => (
						<TOCItem
							key={entry.slug}
							entry={entry}
							isActive={activeIds.has(entry.slug.substring(1))}
							onClick={handleClick}
							upperDepth={introLabel && i === 0 ? 2 : (allEntries[i - 1]?.level ?? entry.level)}
							lowerDepth={allEntries[i + 1]?.level ?? entry.level}
						/>
					))}
				</div>
			</div>
		</nav>
	);
}
