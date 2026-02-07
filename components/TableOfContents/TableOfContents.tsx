"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TOCEntry } from "@/utils/generateTableOfContentsFromMarkdown";
import TOCItem from "./TOCItem";
import styles from "./TableOfContents.module.css";

interface TableOfContentsProps {
	entries: TOCEntry[];
}

function getLineOffset(depth: number): number {
	return depth >= 3 ? 10 : 0;
}

export default function TableOfContents({ entries }: TableOfContentsProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
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
		const observer = new IntersectionObserver(
			(entries) => {
				setActiveIds((prev) => {
					const newSet = new Set(prev);
					entries.forEach((entry) => {
						const id = entry.target.id;
						const rect = entry.boundingClientRect;

						// Calculate the active zone (matching rootMargin: "-10% 0px -50% 0px")
						const viewportHeight = window.innerHeight;
						const activeZoneTop = viewportHeight * 0.10;
						const activeZoneBottom = viewportHeight * 0.50;

						// Check if the heading is actually in the active zone
						const inActiveZone = rect.top >= activeZoneTop && rect.top <= activeZoneBottom;

						if (entry.isIntersecting && inActiveZone) {
							newSet.add(id);
						} else {
							newSet.delete(id);
						}
					});
					return newSet;
				});
			},
			{
				rootMargin: "-10% 0px -50% 0px",
				threshold: [0, 0.5, 1],
			}
		);

		const headings = document.querySelectorAll("h2[id], h3[id], h4[id], h5[id], h6[id]");
		headings.forEach((heading) => observer.observe(heading));

		return () => observer.disconnect();
	}, []);

	// Update active highlight position
	useEffect(() => {
		if (!containerRef.current || activeIds.size === 0) {
			setActiveHighlight(null);
			return;
		}

		const container = containerRef.current;
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
	}, [Array.from(activeIds).sort().join(',')]);

	useEffect(() => {
		if (!containerRef.current) return;
		const container = containerRef.current;

		function onResize(): void {
			if (container.clientHeight === 0) return;
			let w = 0, h = 0;
			const d: string[] = [];

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

				d.push(`${i === 0 ? 'M' : 'L'}${offset} ${top}`);
				d.push(`L${offset} ${bottom}`);
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
			<h3 className={styles.tocHeader}>On this page</h3>
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
					{allEntries.map((entry, i) => (
						<TOCItem
							key={entry.slug}
							entry={entry}
							isActive={activeIds.has(entry.slug.substring(1))}
							onClick={handleClick}
							upperDepth={allEntries[i - 1]?.level ?? entry.level}
							lowerDepth={allEntries[i + 1]?.level ?? entry.level}
						/>
					))}
				</div>
			</div>
		</nav>
	);
}
