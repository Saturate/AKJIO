"use client";

import { useEffect, useState } from "react";
import styles from "./TableOfContents.module.css";

export type TOCEntry = {
	level: number;
	text: string;
	slug: string;
	children: TOCEntry[];
};

export default function TableOfContents({
	tableOfContents,
}: {
	tableOfContents: TOCEntry[];
}) {
	const [activeSection, setActiveSection] = useState<string | null>(null);
	useEffect(() => {
		const root = document.querySelector('[data-content="true"]');

		if (!root) return;

		const elements = root.children;
		const sections: Map<Element, string> = new Map();
		let currentSectionId: string | null = null;
		for (const element of elements) {
			if (element.id && (element.tagName === "H2" || element.tagName === "H3"))
				currentSectionId = element.id;
			if (!currentSectionId) continue;

			sections.set(element, `#${currentSectionId}`);
		}

		const visibleElements = new Set<Element>();

		const callback = (entries: IntersectionObserverEntry[]) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					visibleElements.add(entry.target);
				} else {
					visibleElements.delete(entry.target);
				}
			}

			const firstVisibleSection = Array.from(sections.entries()).find(
				([element]) => visibleElements.has(element),
			);

			if (!firstVisibleSection) return;
			setActiveSection(firstVisibleSection[1]);
		};

		const observer = new IntersectionObserver(callback, {
			rootMargin: "-56px 0px",
		});

		Array.from(sections.keys()).forEach((element) => observer.observe(element));

		return () => observer.disconnect();
	}, []);

	return (
		<div className={styles.toc}>
			<h2>Table of Content</h2>
			<ol data-toc="true">
				{tableOfContents.map(({ text, slug, children }, i) => (
					<li key={i}>
						<a
							aria-current={activeSection === slug ? "location" : undefined}
							href={slug}
						>
							{text}
						</a>
						{children.length > 0 && (
							<ol>
								{children.map(({ text, slug }, i) => (
									<li key={i}>
										<a
											aria-current={
												activeSection === slug ? "location" : undefined
											}
											href={slug}
										>
											{text}
										</a>
									</li>
								))}
							</ol>
						)}
					</li>
				))}
			</ol>
		</div>
	);
}
